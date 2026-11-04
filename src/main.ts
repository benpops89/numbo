import { Caller, events } from "./mygo";
import "./style.css";

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

const numberEl = $("#number") as HTMLDivElement;
const phraseEl = $("#phrase") as HTMLDivElement;
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
let audioEl: HTMLAudioElement | null = null;
function getAudio(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = "auto";
  }
  return audioEl;
}
function playNumber(n: number) {
  if (n === lastPlayed) return;
  lastPlayed = n;
  const a = getAudio();
  a.src = `/audio/${n}.wav`;
  const p = a.play();
  if (p) p.catch((e) => console.error("audio play failed", n, e));
}

function render(state: any) {
  if (state.current) {
    numberEl.textContent = String(state.current.number);
    phraseEl.textContent = state.current.phrase;
    currentNumber = state.current.number;
    // play audio once per new number
    playNumber(state.current.number);
  } else {
    numberEl.textContent = "--";
    phraseEl.textContent = "Press \"Call next\" to start";
    currentNumber = null;
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

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !(e.target instanceof HTMLInputElement)) {
    e.preventDefault();
    callBtn.click();
  }
});

events.callerChanged.on((state) => render(state));

// initial
Caller.state().then(render).catch(console.error);