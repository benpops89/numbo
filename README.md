# Numbo

> Two little ducks, twenty-two 🦆🦆 — Numbo calls the numbers so you can keep dabbing.

Numbo is a desktop 90-ball bingo caller. It speaks each number aloud with its
traditional bingo call, shows a grid of what's been called, and runs the game
hands-free in auto or manual mode. Players mark physical cards.

## Features

- 🗣️ **Calls every number with its phrase** — "Two little ducks, 22", "Two fat
  ladies, 88" — using pre-generated voice audio.
- 🏠 **Home screen** — pick manual mode, or auto mode with the call interval on
  a slider.
- 🎶 **Media-style controls** — play/pause, reset, and home at the bottom of
  the game screen.
- 🔢 **Big call card** — the current number pops onto the grid in a large card,
  then fades after a couple of seconds.
- 📊 **Called grid** — all 90 numbers at a glance, highlighted as they're
  called.

## Building from source

Requirements: Go 1.27+, Bun, ffmpeg (with the flite filter), WebKitGTK.

```sh
# generate the call audio
bash scripts/gen-audio.sh

# develop with live reload
bun install && bun run dev

# package for Linux (.deb, AppImage-style dirs, install script)
bun run build
```

## Installing

On Linux:

```sh
sudo dpkg -i build/linux-amd64/numbo_*_amd64.deb
```

Then launch **Numbo** from your app launcher, or run `numbo` in a terminal.

## Tech

- [MyGo](https://mygo.egoist.dev/) — desktop app framework, Go backend with a
  web frontend in the system webview.
- Go owns the game: a shuffled 90-number bag, the auto-call loop, and state
  broadcast to the UI.
- Preact + preact-router for the frontend, vanilla CSS.

## License

MIT
EOF
