import { Router, type Location } from "preact-router";
import { Home } from "./game/Home";
import { Game } from "./game/Game";
import "./style.css";

// Hash history for preact-router: works in the webview regardless of protocol.
const hashLocation = (): Location => {
  const raw = location.hash.slice(1) || "/";
  const q = raw.indexOf("?");
  return { pathname: q === -1 ? raw : raw.slice(0, q), search: q === -1 ? "" : raw.slice(q) };
};

const hashHistory = {
  location: hashLocation(),
  push(path: string) {
    location.hash = "#" + path;
  },
  replace(path: string) {
    location.replace("#" + path);
  },
  listen(cb: (loc: Location) => void): () => void {
    const f = () => cb(hashLocation());
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  },
};

export function App() {
  return (
    <Router history={hashHistory}>
      <Home path="/" />
      <Game path="/game" />
    </Router>
  );
}
