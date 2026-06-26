import { copyFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import type { Plugin } from 'vite'

/** Copies manifest + icons into dist after the popup bundle finishes. */
export function copyExtensionAssets(mode: string): Plugin {
  return {
    name: 'copy-extension-files',
    enforce: 'post',
    // Run after Vite copies `public/` so dev manifest is not overwritten.
    buildEnd() {
      const outDir = resolve(__dirname, 'dist')
      mkdirSync(outDir, { recursive: true })

      const manifestFile = mode === 'development' ? 'manifest.dev.json' : 'manifest.json'
      const manifestDir = mode === 'development' ? __dirname : resolve(__dirname, 'public')
      copyFileSync(
        resolve(manifestDir, manifestFile),
        resolve(outDir, 'manifest.json'),
      )

      try {
        copyFileSync(
          resolve(__dirname, 'public/vite.svg'),
          resolve(outDir, 'vite.svg'),
        )
      } catch {
        // Icon is optional
      }
    },
  }
}
