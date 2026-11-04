import { Caller, events } from "./mygo";
import "./style.css";

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

const numberEl = $("#number") as HTMLDivElement;
const phraseEl = $("#phrase") as HTMLDivElement;
const currentEl = $("#current") as HTMLDivElement;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
const remainingEl = $("#remaining") as HTMLSpanElement;
const gridEl = $("#grid") as HTMLDivElement;
const callBtn = $("#callBtn") as HTMLButtonElement;
const autoToggle = $("#autoToggle") as HTMLInputElement;
const intervalInput = $("#interval") as HTMLInputElement;
const resetBtn = $("#resetBtn") as HTMLButtonElement;

// Build grid 1..90
const cells: HTMLDivElement[] = [];
for (let n = 1; n <= 90; n++) {
  const c = document.createElement("div");
  c.className = "cell";
  c.textContent = String(n);
  c.dataset.n = String(n);
  cells.push(c);
  gridEl.appendChild(c);
}

let currentNumber: number | null = null;
let lastPlayed: number | null = null;
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
  // play a silent buffer to unlock
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

function render(state: any) {
  if (state.current) {
    numberEl.textContent = String(state.current.number);
    phraseEl.textContent = state.current.phrase;
    currentNumber = state.current.number;
    currentEl.classList.remove("hidden");
    playNumber(state.current.number);
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => currentEl.classList.add("hidden"), 2500);
  } else {
    numberEl.textContent = "--";
    phraseEl.textContent = "";
    currentNumber = null;
    if (hideTimer) clearTimeout(hideTimer);
    currentEl.classList.add("hidden");
  }
  remainingEl.textContent = `${state.remaining} remaining`;
  // grid
  const called = new Set<number>(state.called);
  cells.forEach((c, i) => {
    const n = i + 1;
    c.classList.toggle("called", called.has(n));
    c.classList.toggle("current", n === currentNumber);
  });
  autoToggle.checked = state.auto;
  if (state.intervalMs) intervalInput.value = String(Math.round(state.intervalMs / 1000));
  callBtn.disabled = state.remaining === 0;
}

callBtn.addEventListener("click", async () => {
  try {
    const c = await Caller.callNext();
    playNumber(c.number);
  } catch (e) { console.error(e); }
});
resetBtn.addEventListener("click", async () => {
  lastPlayed = null;
  await Caller.reset();
});
autoToggle.addEventListener("change", async () => {
  const enabled = autoToggle.checked;
  const sec = Math.max(1, parseInt(intervalInput.value || "5", 10));
  await Caller.setAuto(enabled, sec * 1000);
});
intervalInput.addEventListener("change", async () => {
  if (autoToggle.checked) {
    const sec = Math.max(1, parseInt(intervalInput.value || "5", 10));
    await Caller.setAuto(true, sec * 1000);
  }
});

window.addEventListener("pointerdown", () => unlockAudio(), { once: false });
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !(e.target instanceof HTMLInputElement)) {
    e.preventDefault();
    callBtn.click();
  }
});

events.callerChanged.on((state) => render(state));

// initial
Caller.state().then(render).catch(console.error);