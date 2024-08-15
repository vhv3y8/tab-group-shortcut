import { defineConfig } from "vite"

import zipPack from "vite-plugin-zip-pack"
import manifest from "./public/manifest.json"

export default defineConfig(({ mode }) => {
  return {
    root: "src",
    publicDir: "../public", // files in this folder gets copied into outDir during build.
    build: {
      outDir: "../dist",
      assetsDir: ".", // puts assets into 'outDir/assetsDir'
      target: "es2022", // to use top-level await
      rollupOptions: {
        input: {
          content: "src/content.js",
          background: "src/background.js",
          description: "src/description/index.html",
          options: "src/options/options.html",
        },
        output: {
          entryFileNames: "[name].js", // applied to js files
          assetFileNames: "[name].[ext]", // applied to css files
        },
      },
    },
    plugins:
      mode === "production"
        ? [
            zipPack({
              inDir: "dist",
              outDir: ".",
              outFileName: `${manifest.name}-${manifest.version}.zip`,
            }),
          ]
        : [],
  }
})
