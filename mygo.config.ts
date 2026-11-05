import { defineConfig } from "mygo-cli";

export default defineConfig({
  name: "numbo",
  identifier: "com.example.numbo",
  version: "0.2.0",
  // `mygo dev` runs devCommand and loads devUrl; `mygo build` runs
  // buildCommand and embeds frontendDist into the app.
  devUrl: "http://localhost:5173",
  devCommand: "bun run dev:web",
  buildCommand: "bun run build:web",
  frontendDist: "dist",
  bindings: "src/mygo.ts",
  out: "build",
  linux: {
    command: "numbo",
    maintainer: "Ben <ben@example.com>",
    comment: "Numbo – a playful 90-ball bingo caller that speaks the numbers",  
    categories: ["Game", "Utility"],
  },
});
