import { defineConfig } from "vite";
import { resolve } from "path";
import { copyExtensionAssets } from "./vite.extensionCopy";

// Background service worker build: produces a single IIFE at dist/background.js
export default defineConfig(({ mode }) => ({
  plugins: [copyExtensionAssets(mode)],
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/background/background.ts"),
      name: "InlineBackground",
      formats: ["iife"],
      fileName: () => "background.js",
    },
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
}));
