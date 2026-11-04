package main

import (
	"errors"
	"math/rand"
	"strconv"
	"sync"
	"time"

	"github.com/egoist/mygo"
)

// Call is one drawn number.
type Call struct {
	Number int    `json:"number"`
	Phrase string `json:"phrase"`
}

// State is the full caller state broadcast to frontends.
type State struct {
	Current   *Call `json:"current"`
	Called    []int `json:"called"`
	Remaining int   `json:"remaining"`
	Auto      bool  `json:"auto"`
	Interval  int   `json:"intervalMs"`
}

// phrases maps each 90-ball UK number to its canonical bingo call.
var phrases = map[int]string{
	1: "Kelly's eye", 2: "One little duck", 3: "Cup of tea", 4: "Knock at the door",
	5: "Man alive", 6: "Tom's tricks", 7: "Lucky seven", 8: "Garden gate",
	9: "Doctor's orders", 10: "Downing Street", 11: "Legs eleven", 12: "One dozen",
	13: "Unlucky for some", 14: "Valentine's Day", 15: "Young and keen",
	16: "Sweet sixteen", 17: "Dancing queen", 18: "Coming of age", 19: "Goodbye teens",
	20: "One score", 21: "Royal salute", 22: "Two little ducks", 23: "Thee and me",
	24: "Two dozen", 25: "Duck and dive", 26: "Pick and mix", 27: "Gateway to heaven",
	28: "In a state", 29: "Rise and shine", 30: "Dirty Gertie", 31: "Get up and run",
	32: "Buckle my shoe", 33: "All the threes", 34: "Ask for more", 35: "Jump and jive",
	36: "Three dozen", 37: "More than eleven", 38: "Christmas cake", 39: "Steps",
	40: "Life begins", 41: "Time for fun", 42: "Winnie the Pooh", 43: "Down on your knees",
	44: "Droopy drawers", 45: "Halfway there", 46: "Up to tricks", 47: "Four and seven",
	48: "Four dozen", 49: "PC", 50: "Half a century", 51: "Tweak of the thumb",
	52: "Danny La Rue", 53: "Stuck in a tree", 54: "Clean the floor", 55: "Snakes alive",
	56: "Shotts bus", 57: "Heinz varieties", 58: "Make them wait", 59: "Brighton line",
	60: "Five dozen", 61: "Baker's bun", 62: "Tickety-boo", 63: "Tweak of the thumb",
	64: "Red raw", 65: "Old age pension", 66: "Clickety click", 67: "Stairway to heaven",
	68: "Saving grace", 69: "Favourite of mine", 70: "Three score and ten",
	71: "Bang on the drum", 72: "Six dozen", 73: "Queen bee", 74: "Candy store",
	75: "Strive and strive", 76: "Trombones", 77: "Sunset strip", 78: "Heaven's gate",
	79: "One more time", 80: "Gandhi's breakfast", 81: "Stop and run", 82: "Straight on through",
	83: "Time for tea", 84: "Seven dozen", 85: "Staying alive", 86: "Between the sticks",
	87: "Torquay in Devon", 88: "Two fat ladies", 89: "Nearly there", 90: "Top of the shop",
}

var errNoNumbers = errors.New("no numbers remaining")

// Changed is broadcast whenever the caller state changes.
var Changed = mygo.NewEvent[State]("caller:changed")

// Caller holds game state.
type Caller struct {
	mu        sync.Mutex
	remaining []int
	called    []int
	current   *Call
	auto      bool
	interval  int
	stopAuto  chan struct{}
	rng       *rand.Rand
}

// NewCaller creates a caller with a fresh shuffled bag.
func NewCaller() *Caller {
	c := &Caller{rng: rand.New(rand.NewSource(time.Now().UnixNano()))}
	c.resetLocked()
	if c.interval == 0 {
		c.interval = 5000
	}
	return c
}

func (c *Caller) resetLocked() {
	c.remaining = make([]int, 0, 90)
	for i := 1; i <= 90; i++ {
		c.remaining = append(c.remaining, i)
	}
	c.rng.Shuffle(len(c.remaining), func(i, j int) {
		c.remaining[i], c.remaining[j] = c.remaining[j], c.remaining[i]
	})
	c.called = []int{}
	c.current = nil
}

// Reset starts a new game.
func (c *Caller) Reset() error {
	c.mu.Lock()
	c.stopAutoLocked()
	c.resetLocked()
	c.auto = false
	st := c.stateLocked()
	c.mu.Unlock()
	return Changed.Broadcast(st)
}

// CallNext draws the next number.
func (c *Caller) CallNext() (Call, error) {
	c.mu.Lock()
	if len(c.remaining) == 0 {
		c.mu.Unlock()
		return Call{}, errNoNumbers
	}
	n := c.remaining[0]
	c.remaining = c.remaining[1:]
	c.called = append(c.called, n)
	call := Call{Number: n, Phrase: phrases[n]}
	c.current = &call
	st := c.stateLocked()
	c.mu.Unlock()
	_ = Changed.Broadcast(st)
	return call, nil
}

// SetAuto enables/disables auto-call.
func (c *Caller) SetAuto(enabled bool, intervalMs int) error {
	c.mu.Lock()
	if intervalMs > 0 {
		c.interval = intervalMs
	}
	if c.interval == 0 {
		c.interval = 5000
	}
	if enabled == c.auto {
		c.auto = enabled
		st := c.stateLocked()
		c.mu.Unlock()
		return Changed.Broadcast(st)
	}
	c.auto = enabled
	if enabled {
		c.stopAuto = make(chan struct{})
		stop := c.stopAuto
		go c.autoLoop(stop)
	} else {
		c.stopAutoLocked()
	}
	st := c.stateLocked()
	c.mu.Unlock()
	return Changed.Broadcast(st)
}

func (c *Caller) stopAutoLocked() {
	if c.stopAuto != nil {
		close(c.stopAuto)
		c.stopAuto = nil
	}
}

func (c *Caller) autoLoop(stop chan struct{}) {
	for {
		c.mu.Lock()
		interval := time.Duration(c.interval) * time.Millisecond
		auto := c.auto
		remaining := len(c.remaining)
		c.mu.Unlock()
		if !auto || remaining == 0 {
			return
		}
		select {
		case <-time.After(interval):
		case <-stop:
			return
		}
		c.mu.Lock()
		if !c.auto {
			c.mu.Unlock()
			return
		}
		c.mu.Unlock()
		if _, err := c.CallNext(); err != nil {
			c.mu.Lock()
			c.auto = false
			c.stopAutoLocked()
			c.mu.Unlock()
			return
		}
	}
}

// State returns a snapshot.
func (c *Caller) State() State {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.stateLocked()
}

func (c *Caller) stateLocked() State {
	st := State{
		Called:    append([]int(nil), c.called...),
		Remaining: len(c.remaining),
		Auto:      c.auto,
		Interval:  c.interval,
	}
	if c.current != nil {
		cc := *c.current
		st.Current = &cc
	}
	if st.Called == nil {
		st.Called = []int{}
	}
	if st.Interval == 0 {
		st.Interval = 5000
	}
	return st
}

// AudioPath returns the relative path to the audio file for a number.
func (c *Caller) AudioPath(n int) string {
	return "audio/" + strconv.Itoa(n) + ".wav"
}
