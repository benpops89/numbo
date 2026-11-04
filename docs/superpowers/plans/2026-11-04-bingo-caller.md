# Bingo Caller Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 90-ball UK bingo number caller desktop app (MyGo) that speaks each number with its bingo phrase and shows a grid of called numbers.

**Architecture:** Web frontend (Vite/TS, vanilla CSS) + Go `Caller` service bound via `mygo.Bind`. Go owns game state (shuffled 90-bag, history, auto-call). Frontend renders display/grid/controls and plays pre-generated WAVs.

**Tech Stack:** Go 1.27.3, MyGo 0.7.4, Bun, Vite, TypeScript, ffmpeg/flite for audio.

**Spec:** docs/superpowers/specs/2026-11-04-bingo-caller-design.md

## Global Constraints

- Go 1.27.3+, Bun for frontend tooling, no cgo.
- 90-ball UK phrases, one canonical phrase per number.
- Audio files are pre-generated WAVs in `public/audio/<n>.wav`.
- Vanilla CSS, no UI framework.

## Review Focus

- Calling all 90 numbers then calling again must error, not panic or repeat.
- Reset must restore a full 90-number bag and clear history/current.
- Auto-call goroutine must stop when disabled or when all 90 called; must not leak.
- Concurrent `CallNext`/`SetAuto` must not race (mutex).
- Audio path for every number 1..90 must resolve to an existing file.

---

### Task 1: Caller game logic (Go) with tests

**Files:**
- Create: `caller.go`
- Create: `caller_test.go`
- Modify: `main.go`

**Interfaces:**
- Produces: `NewCaller() *Caller`, `(*Caller).CallNext() (Call, error)`, `(*Caller).Reset() error`, `(*Caller).SetAuto(enabled bool, intervalMs int) error`, `(*Caller).State() State`, `(*Caller).AudioPath(n int) string`, `Changed mygo.Event[State]`, types `Call`, `State`.

- [ ] **Step 1: Write failing test**

Create `caller_test.go`:
```go
package main

import "testing"

func TestCallNextNoRepeat(t *testing.T) {
	c := NewCaller()
	seen := map[int]bool{}
	for i := 0; i < 90; i++ {
		call, err := c.CallNext()
		if err != nil { t.Fatal(err) }
		if seen[call.Number] { t.Fatalf("repeat %d", call.Number) }
		seen[call.Number] = true
		if call.Phrase == "" { t.Fatalf("empty phrase %d", call.Number) }
	}
	if len(seen) != 90 { t.Fatal("not all numbers") }
	if _, err := c.CallNext(); err == nil { t.Fatal("expected error after 90") }
}

func TestReset(t *testing.T) {
	c := NewCaller()
	c.CallNext()
	c.CallNext()
	if err := c.Reset(); err != nil { t.Fatal(err) }
	st := c.State()
	if st.Current != nil { t.Fatal("current not cleared") }
	if len(st.Called) != 0 { t.Fatal("called not cleared") }
	if st.Remaining != 90 { t.Fatalf("remaining %d", st.Remaining) }
}

func TestAutoFlag(t *testing.T) {
	c := NewCaller()
	if err := c.SetAuto(true, 100); err != nil { t.Fatal(err) }
	if !c.State().Auto { t.Fatal("auto not enabled") }
	if err := c.SetAuto(false, 100); err != nil { t.Fatal(err) }
	if c.State().Auto { t.Fatal("auto not disabled") }
}

func TestAudioPath(t *testing.T) {
	c := NewCaller()
	for n := 1; n <= 90; n++ {
		if c.AudioPath(n) == "" { t.Fatalf("empty path %d", n) }
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./... -run TestCallNextNoRepeat -v`
Expected: FAIL (undefined NewCaller)

- [ ] **Step 3: Implement `caller.go`**

Implement Caller with mutex, shuffled remaining, called slice, current *Call, auto state, interval. Phrases map for 1..90. `CallNext` locks, pops, appends, sets current, unlocks, broadcasts State. `Reset` reshuffles, clears. `SetAuto` sets flags and starts/stops goroutine ticker. Goroutine stops when disabled or remaining empty. `State()` snapshot. `AudioPath(n)` returns `audio/<n>.wav`.

Include `phrases` map with canonical UK bingo calls.

- [ ] **Step 4: Run tests**

Run: `go test ./... -v`
Expected: PASS

- [ ] **Step 5: Update `main.go`**

Bind `NewCaller()`, set app name "Bingo Caller", window title, open window on ready. Remove Greeter/tick example code. Keep `Changed` event.

- [ ] **Step 6: Commit**

```bash
git add caller.go caller_test.go main.go
git commit -m "feat: add bingo caller game logic"
```

(Note: repo not yet git; initialize git first if needed.)

---

### Task 2: Audio generation script

**Files:**
- Create: `scripts/gen-audio.sh`
- Create: `public/audio/*.wav` (90 files)

**Interfaces:**
- Produces: files `public/audio/1.wav` .. `public/audio/90.wav`.

- [ ] **Step 1: Create script**

`scripts/gen-audio.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail
mkdir -p public/audio
# phrase lookup embedded via go? Use a tsv file instead.
```

Better: generate from a phrases TSV. Create `scripts/phrases.tsv` with number\tphrase. Then loop calling ffmpeg flite.

- [ ] **Step 2: Generate phrases.tsv**

Create `scripts/phrases.tsv` with 90 lines.

- [ ] **Step 3: Run script to generate WAVs**

Run: `bash scripts/gen-audio.sh`
Expected: 90 wav files.

- [ ] **Step 4: Commit**

---

### Task 3: Frontend UI

**Files:**
- Modify: `index.html`
- Modify: `src/main.ts`
- Modify: `src/style.css`
- Regenerate: `src/mygo.ts` via `bun run generate`

**Interfaces:**
- Consumes: `Caller` methods and `events.callerChanged` (event name `caller:changed`).

- [ ] **Step 1: Regenerate TS client**

Run: `bun run generate` (or `go run github.com/egoist/mygo/cmd/mygo generate .`)
Expected: `src/mygo.ts` updated with Caller.

- [ ] **Step 2: Rewrite index.html**

Big number display, phrase, grid, controls.

- [ ] **Step 3: Rewrite style.css**

Vanilla CSS styling.

- [ ] **Step 4: Rewrite main.ts**

Wire buttons, keyboard shortcut, auto toggle + interval, render grid, play audio on change.

- [ ] **Step 5: Typecheck**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

---

### Task 4: Dev smoke test

- [ ] **Step 1: Install deps**

Run: `bun install`

- [ ] **Step 2: Run dev**

Run: `bun run dev` (manual; verify window opens, calling works, audio plays)

- [ ] **Step 3: Build**

Run: `bun run build`
Expected: build succeeds.

---

### Self-review

Spec coverage: caller logic ✓, audio ✓, UI ✓, auto interval ✓, grid ✓. Phrase list ✓. Audio paths ✓ (Task 1 test + Review Focus). Auto goroutine ✓.
