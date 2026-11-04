package main

import "testing"

func TestCallNextNoRepeat(t *testing.T) {
	c := NewCaller()
	seen := map[int]bool{}
	for i := 0; i < 90; i++ {
		call, err := c.CallNext()
		if err != nil {
			t.Fatal(err)
		}
		if seen[call.Number] {
			t.Fatalf("repeat %d", call.Number)
		}
		seen[call.Number] = true
		if call.Phrase == "" {
			t.Fatalf("empty phrase %d", call.Number)
		}
	}
	if len(seen) != 90 {
		t.Fatal("not all numbers")
	}
	if _, err := c.CallNext(); err == nil {
		t.Fatal("expected error after 90")
	}
}

func TestReset(t *testing.T) {
	c := NewCaller()
	c.CallNext()
	c.CallNext()
	if err := c.Reset(); err != nil {
		t.Fatal(err)
	}
	st := c.State()
	if st.Current != nil {
		t.Fatal("current not cleared")
	}
	if len(st.Called) != 0 {
		t.Fatal("called not cleared")
	}
	if st.Remaining != 90 {
		t.Fatalf("remaining %d", st.Remaining)
	}
}

func TestAutoFlag(t *testing.T) {
	c := NewCaller()
	if err := c.SetAuto(true, 100); err != nil {
		t.Fatal(err)
	}
	if !c.State().Auto {
		t.Fatal("auto not enabled")
	}
	if err := c.SetAuto(false, 100); err != nil {
		t.Fatal(err)
	}
	if c.State().Auto {
		t.Fatal("auto not disabled")
	}
}

func TestAudioPath(t *testing.T) {
	c := NewCaller()
	for n := 1; n <= 90; n++ {
		if c.AudioPath(n) == "" {
			t.Fatalf("empty path %d", n)
		}
	}
}
