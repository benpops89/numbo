import { signal } from "@preact/signals";
import type { Call, State as CallerState } from "../mygo";
import { Caller, events } from "../mygo";

export type Mode = "manual" | "auto";

export const mode = signal<Mode>("auto");
export const interval = signal(5);
export const caller = signal<CallerState | null>(null);
export const lastPlayed = signal<number | null>(null);

export function applyState(state: CallerState) {
  caller.value = state;
  const c: Call | null = state.current;
  if (c && c.number !== lastPlayed.value) {
    lastPlayed.value = c.number;
    playNumber(c.number);
  }
}

events.callerChanged.on(applyState);

Caller.state()
  .then((s) => applyState(s))
  .catch(console.error);

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

export function unlockAudio() {
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

export function playNumber(n: number) {
  unlockAudio();
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume();
  void loadBuffer(n).then((buf) => {
    if (!buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  });
}

// ---- Game actions ----
export async function startAuto() {
  await Caller.setAuto(true, interval.value * 1000);
}

export async function stopAuto() {
  await Caller.setAuto(false, interval.value * 1000);
}

export function callNext() {
  unlockAudio();
  return Caller.callNext()
    .then((c) => {
      if (c.number !== lastPlayed.value) {
        lastPlayed.value = c.number;
        playNumber(c.number);
      }
    })
    .catch(console.error);
}

export function resetGame() {
  lastPlayed.value = null;
  return Caller.reset();
}

export async function goHome() {
  if (mode.value === "auto") await stopAuto().catch(() => {});
  await resetGame();
  mode.value = "manual"; // reset for next entry
  location.hash = "#/";
}
