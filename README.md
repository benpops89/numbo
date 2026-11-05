<div align="center">

# 🎱 Numbo

*Two little ducks, twenty-two 🦆🦆 — Numbo calls the numbers so you can keep dabbing.*

**A desktop 90-ball bingo caller built with Go, MyGo and Preact.**

[![Go](https://img.shields.io/badge/Go-1.27-00ADD8?style=flat-square&logo=go&logoColor=white)](https://go.dev)
[![MyGo](https://img.shields.io/badge/MyGo-0.7-e94560?style=flat-square)](https://mygo.egoist.dev/)
[![Preact](https://img.shields.io/badge/Preact-11-673AB8?style=flat-square&logo=preact&logoColor=white)](https://preactjs.com)
[![License](https://img.shields.io/badge/License-MIT-ffd166?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20macOS%20%7C%20Windows-4c566a?style=flat-square)](#installing)

</div>

---

Numbo is a desktop 90-ball bingo caller. It speaks each number aloud with its
traditional bingo call, shows a grid of everything that's been called, and runs
the game hands-free. Players mark physical cards.

## ✨ Features

- 🗣️ **Calls every number with its phrase** — *"Two little ducks, 22"*, *"Two
  fat ladies, 88"* — using pre-generated voice audio
- 🏠 **Home screen** — pick manual mode, or auto mode with the call interval
  on a slider
- 🎛️ **Media-style controls** — play/pause, reset and home in a clean icon bar
- 🔢 **Big call card** — the current number pops onto the grid, then fades
  away after a couple of seconds
- 📊 **Called grid** — all 90 numbers at a glance, highlighted as they're
  called
- 🖥️ **Tray icon** — reset or quit without leaving your seat

## 🎮 How it works

Number draws live in Go: a shuffled bag of 90, an auto-call loop with a
configurable interval, and every state change broadcast to the UI over MyGo's
typed IPC. The frontend is Preact with vanilla CSS — the current number floats
over a compact grid of the 90 balls, gold as they're called.

## 🛠️ Building from source

Requirements: **Go 1.27+**, **Bun**, **ffmpeg** (with the flite filter) and
**WebKitGTK**.

```sh
# 1. generate the call audio (90 wav files)
bash scripts/gen-audio.sh

# 2. install frontend deps
bun install

# 3. develop with live reload
bun run dev

# 4. package for Linux (.deb, PKGBUILD, install script)
bun run build
```

## 📦 Installing

On Linux:

```sh
sudo dpkg -i build/linux-amd64/numbo_*_amd64.deb
```

Then launch **Numbo** from your app launcher, or run `numbo` in a terminal.

## 🙏 Credits

- [MyGo](https://mygo.egoist.dev/) by [@egoist](https://github.com/egoist) —
  the desktop app framework this is built on
- Bingo call phrases from the traditional UK 90-ball canon
- Voice audio generated with
  [Flite](http://www.festvox.org/flite/) via ffmpeg

---

<div align="center">

**Built with [Superpowers](https://github.com/obra/superpowers) 🦸 and AI** —
designed, planned and implemented end-to-end with the Superpowers skill system;
human in the loop, agent at the wheel.

![Powered by AI](https://img.shields.io/badge/Powered%20by-Superpowers%20%2B%20AI-8e2de2?style=for-the-badge)

</div>
