import { defineConfig } from "vite"
import zipPack from "vite-plugin-zip-pack"
import manifest from "./public/manifest.json"

export default defineConfig({
  build: {
    outDir: "dist",
    assetsDir: ".",
    rollupOptions: {
      input: ["src/content.js", "src/background.js"],
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
  plugins: [
    zipPack({
      inDir: "dist",
      outDir: ".",
      outFileName: `${manifest.name}-${manifest.version}.zip`,
    }),
  ],
})
