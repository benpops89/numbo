import { render } from "preact";
import { App } from "./app";
import "./style.css";

// Entry: default to #/ (home) on first load.
if (!location.hash) location.hash = "#/";

const root = document.createElement("div");
root.id = "app";
document.body.innerHTML = "";
document.body.appendChild(root);
render(<App />, root);
