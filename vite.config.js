import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    emptyOutDir: true,
    outDir: "dist",
    sourcemap: false,
    target: "es2022",
  },
});
