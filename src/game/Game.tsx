import { useState, useEffect, useRef } from "preact/hooks";
import { caller, mode, callNext, startAuto, stopAuto, goHome, resetGame } from "./state";

const CELLS = Array.from({ length: 90 }, (_, i) => i + 1);

export function Game(_props: { path?: string }) {
  const state = caller.value;
  const current = state?.current ?? null;
  const called = state ? new Set(state.called) : new Set<number>();
  const [paused, setPaused] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mode.value === "auto") {
      void startAuto();
    }
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!current) return;
    setShowCard(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowCard(false), 2500);
  }, [current?.number]);

  const cellClasses = (n: number) => {
    const cls = ["cell"];
    if (called.has(n)) cls.push("called");
    if (current && n === current.number) cls.push("current");
    return cls.join(" ");
  };

  const togglePlayPause = async () => {
    if (pauseMode() === 'continue') {
      await startAuto();
      setPaused(false);
    } else if (pauseMode() === 'stop') {
      await stopAuto();
      setPaused(true);
    } else {
      await callNext();
      if (exhausted) setPaused(true);
    }
  };

  const onReset = async () => {
    await resetGame();
    if (mode.value === "auto" && !paused) await startAuto();
  };

  const exhausted = state ? state.remaining === 0 : false;
  const pauseMode = () => {
    if (mode.value !== "auto") return 'call';
    if (paused) return 'continue';
    if (exhausted) return 'exhausted';
    return 'stop';
  };

  return (
    <div id="game" class="screen">
      <section id="grid" aria-label="Called numbers">
        {CELLS.map((n) => (
          <div key={n} class={cellClasses(n)}>{n}</div>
        ))}
      </section>
      <div id="current" class={showCard ? "pop" : "hidden"}>
        <div id="number">{current ? current.number : "--"}</div>
      </div>
      <div class="media">
        <button class="iconbtn" title="Home" onClick={() => void goHome()}>
          <svg viewBox="0 0 24 24"><path d="M12 3l9 8h-3v9h-4v-6h-4v6H6v-9H3z" /></svg>
        </button>
        <button
          class="iconbtn big"
          title={pauseMode() === "stop" ? "Pause" : pauseMode() === "continue" ? "Play" : "Call next"}
          onClick={() => void togglePlayPause()}
        >
          {pauseMode() === "stop" ? (
            <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
        <button class="iconbtn" title="Reset" onClick={() => void onReset()}>
          <svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7a5 5 0 11-5 5H5a7 7 0 107-7z" /></svg>
        </button>
      </div>
    </div>
  );
}
