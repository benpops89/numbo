import { defineConfig } from "mygo-cli";

export default defineConfig({
  name: "bingo",
  identifier: "com.example.bingo",
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
    maintainer: "Ben <ben@example.com>",
    comment: "90-ball bingo caller that speaks the numbers and their calls",
    categories: ["Game", "Utility"],
  },
});
