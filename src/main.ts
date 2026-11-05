import { Caller, events } from "./mygo";
import "./style.css";

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

// Screens
const homeEl = $("#home") as HTMLDivElement;
const gameEl = $("#game") as HTMLDivElement;

// Home
const manualTile = $("#manualTile") as HTMLButtonElement;
const autoTile = $("#autoTile") as HTMLButtonElement;
const intervalDown = $("#intervalDown") as HTMLButtonElement;
const intervalUp = $("#intervalUp") as HTMLButtonElement;
const intervalVal = $("#intervalVal") as HTMLSpanElement;

// Game
const numberEl = $("#number") as HTMLDivElement;
const phraseEl = $("#phrase") as HTMLDivElement;
const currentEl = $("#current") as HTMLDivElement;
const gridEl = $("#grid") as HTMLDivElement;
const callBtn = $("#callBtn") as HTMLButtonElement;
const playPauseBtn = $("#playPauseBtn") as HTMLButtonElement;
const playIcon = $("#playIcon");
const pauseIcon = $("#pauseIcon");
const resetBtn = $("#resetBtn") as HTMLButtonElement;
const homeBtn = $("#homeBtn") as HTMLButtonElement;

let mode: "manual" | "auto" = "auto";
let interval = 5;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let lastPlayed: number | null = null;
let autoRunning = false;

// ---- Audio (Web Audio API) ----
let audioCtx: AudioContext | null = null;
const audioBuffers = new Map<number, AudioBuffer>();
let audioUnlocked = false;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioCtx;
}

async function loadBuffer(n: number): Promise<AudioBuffer | null> {
  if (audioBuffers.has(n)) return audioBuffers.get(n)!;
  try {
    const res = await fetch(`/audio/${n}.wav`);
    const arr = await res.arrayBuffer();
    const buf = await getCtx().decodeAudioData(arr);
    audioBuffers.set(n, buf);
    return buf;
  } catch (e) {
    console.error("load audio failed", n, e);
    return null;
  }
}

function unlockAudio() {
  if (audioUnlocked) return;
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume();
  const buf = ctx.createBuffer(1, 1, 22050);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start(0);
  audioUnlocked = true;
}

async function playNumber(n: number) {
  if (n === lastPlayed) return;
  lastPlayed = n;
  unlockAudio();
  const ctx = getCtx();
  if (ctx.state === "suspended") await ctx.resume();
  const buf = await loadBuffer(n);
  if (!buf) return;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start(0);
}

// ---- Grid ----
const cells: HTMLDivElement[] = [];
for (let n = 1; n <= 90; n++) {
  const c = document.createElement("div");
  c.className = "cell";
  c.textContent = String(n);
  cells.push(c);
  gridEl.appendChild(c);
}

// ---- Rendering ----
function render(state: any) {
  const called = new Set<number>(state.called);
  cells.forEach((c, i) => {
    const n = i + 1;
    c.classList.toggle("called", called.has(n));
    c.classList.toggle("current", state.current != null && n === state.current.number && !(state as any)._done);
  });
  if (state.current && !autoRunning) {
    // update card on manual change
  }
  if (state.current) {
    numberEl.textContent = String(state.current.number);
    phraseEl.textContent = state.current.phrase;
    currentEl.classList.remove("hidden");
    currentEl.classList.remove("pop");
    void currentEl.offsetWidth; // restart animation
    currentEl.classList.add("pop");
    playNumber(state.current.number);
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => currentEl.classList.add("hidden"), 2500);
  } else {
    numberEl.textContent = "--";
    phraseEl.textContent = "";
    currentEl.classList.add("hidden");
  }
}

// ---- Screens ----
function showHome() {
  gameEl.classList.add("hidden");
  homeEl.classList.remove("hidden");
  stopAuto();
}

function showGame() {
  homeEl.classList.add("hidden");
  gameEl.classList.remove("hidden");
  playPauseBtn.classList.toggle("hidden", mode === "manual");
  unlockAudio();
  return Promise.resolve();
}

async function startAuto() {
  autoRunning = true;
  pauseIcon.classList.remove("hidden");
  playIcon.classList.add("hidden");
  await Caller.setAuto(true, interval * 1000);
}

function stopAuto() {
  if (!autoRunning) return;
  autoRunning = false;
  playIcon.classList.remove("hidden");
  pauseIcon.classList.add("hidden");
  Caller.setAuto(false, interval * 1000);
}

// ---- Home interactions ----
manualTile.addEventListener("click", () => {
  mode = "manual";
  showGame();
});

autoTile.addEventListener("click", (e) => {
  if ((e.target as HTMLElement).closest(".stepper")) return; // stepper clicks don't start
  mode = "auto";
  showGame().then(startAuto);
});

intervalDown.addEventListener("click", (e) => {
  e.stopPropagation();
  interval = Math.max(1, interval - 1);
  intervalVal.textContent = `${interval}s`;
});
intervalUp.addEventListener("click", (e) => {
  e.stopPropagation();
  interval = Math.min(60, interval + 1);
  intervalVal.textContent = `${interval}s`;
});

// ---- Game interactions ----
callBtn.addEventListener("click", async () => {
  unlockAudio();
  const c = await Caller.callNext();
  playNumber(c.number);
});

playPauseBtn.addEventListener("click", () => {
  if (autoRunning) stopAuto();
  else startAuto();
});

resetBtn.addEventListener("click", async () => {
  lastPlayed = null;
  await Caller.reset();
  if (mode === "auto" && autoRunning) await startAuto();
});

homeBtn.addEventListener("click", async () => {
  lastPlayed = null;
  await Caller.reset();
  showHome();
});

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !(e.target instanceof HTMLInputElement) && gameEl.classList.contains("hidden") === false) {
    e.preventDefault();
    if (mode === "manual") callBtn.click();
  }
});

events.callerChanged.on((state) => {
  // sync play/pause icon from state.auto if backend tells
  if (typeof state.auto === "boolean" && mode === "auto") {
    autoRunning = state.auto;
    pauseIcon.classList.toggle("hidden", !state.auto);
    playIcon.classList.toggle("hidden", state.auto);
  }
  render(state);
});

// initial state
Caller.state().then((state) => render(state)).catch(console.error);