import { defineConfig } from "vite";

// GitHub Pages serves project sites from /<repo-name>/, so the production
// build needs that as its base path. Local dev keeps root "/".
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/jersey-test/" : "/",
}));
