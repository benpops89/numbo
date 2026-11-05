import { useState, useEffect } from "preact/hooks";
import { mode, interval } from "./state";

export function Home(_props: { path?: string }) {
  const [showInterval, setShowInterval] = useState(false);

  const start = (m: "manual" | "auto") => {
    mode.value = m;
    location.hash = "#/game";
  };

  const onKey = (m: "manual" | "auto") => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (m === "manual") start(m);
      else setShowInterval(true);
    }
  };

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowInterval(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  const startAuto = () => {
    setShowInterval(false);
    start("auto");
  };

  return (
    <div id="home" class="screen">
      <img src="./logo.png" class="brand-logo" alt="" />
      <h1 class="brand">NUMBO</h1>
      <div class="tiles">
        <div class="tile" data-mode="manual" role="button" tabIndex={0} onClick={() => start("manual")} onKeyDown={onKey("manual")}>
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          <span class="tile-title">Manual</span>
        </div>
        <div class="tile" data-mode="auto" role="button" tabIndex={0} onClick={() => setShowInterval(true)} onKeyDown={onKey("auto")}>
          <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
          <span class="tile-title">Auto</span>
        </div>
      </div>

      {showInterval ? (
        <div class="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowInterval(false); }}>
          <div class="modal-card small">
            <div class="modal-label">Call a number every</div>
            <input
              type="range"
              min={1}
              max={30}
              value={interval.value}
              onInput={(e) => { interval.value = parseInt((e.target as HTMLInputElement).value, 10); }}
              style={{ width: "100%", accentColor: "var(--accent)" }}
            />
            <div class="modal-value">{interval.value}s</div>
            <button class="modal-start" onClick={startAuto}>Start</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
