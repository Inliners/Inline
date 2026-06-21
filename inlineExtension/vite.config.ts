import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { copyFileSync, mkdirSync } from "fs";

// Popup build: bundles index.html + React popup UI into dist/
export default defineConfig({
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  plugins: [
    react(),
    {
      name: "copy-extension-files",
      closeBundle() {
        mkdirSync(resolve(__dirname, "dist"), { recursive: true });
        copyFileSync(
          resolve(__dirname, "public/manifest.json"),
          resolve(__dirname, "dist/manifest.json"),
        );
        try {
          copyFileSync(
            resolve(__dirname, "public/vite.svg"),
            resolve(__dirname, "dist/vite.svg"),
          );
        } catch {
          // Icon is optional
        }
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
      output: {
        assetFileNames: "assets/[name]-[hash].[ext]",
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
      },
    },
  },
});
