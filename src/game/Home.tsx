import { mode, interval } from "./state";

export function Home(_props: { path?: string }) {
  const step = (d: number) => {
    interval.value = Math.min(60, Math.max(1, interval.value + d));
  };
  const start = (m: "manual" | "auto") => {
    mode.value = m;
    location.hash = "#/game";
  };
  return (
    <div id="home" class="screen">
      <h1 class="brand">BINGO CALLER</h1>
      <div class="tiles">
        <div class="tile" data-mode="manual" role="button" tabIndex={0} onClick={() => start("manual")}>
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          <span class="tile-title">Manual</span>
          <span class="tile-sub">Press for each call</span>
        </div>
        <div class="tile" data-mode="auto" role="button" tabIndex={0} onClick={() => start("auto")}>
          <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
          <span class="tile-title">Auto</span>
          <span class="stepper">
            <span class="stepbtn" onClick={(e) => { e.stopPropagation(); step(-1); }}>−</span>
            <span class="stepval">{interval.value}s</span>
            <span class="stepbtn" onClick={(e) => { e.stopPropagation(); step(1); }}>+</span>
          </span>
          <span class="tile-sub">between calls</span>
        </div>
      </div>
    </div>
  );
}
