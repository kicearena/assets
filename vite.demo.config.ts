import { defineConfig } from "vite";
import { kiceAssets } from "./src/vite.js";
export default defineConfig({
  root: "demo",
  plugins: [kiceAssets()],
  build: { outDir: "../demo-dist", emptyOutDir: true },
});
