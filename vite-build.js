import { build } from "vite"
import tailwindcss from "@tailwindcss/vite"
import nested from "postcss-nested"

import manifest from "./public/manifest.json" with { type: "json" }
import fs from "node:fs/promises"
import * as fsSync from "node:fs"
import path from "node:path"
import archiver from "archiver"

const isProduction = process.env.MODE === "production"
logInfo(
  `process.env.MODE = ${process.env.MODE} / isProduction = ${isProduction}`,
  "info",
)

// Config

const commonConfig = {
  define: {
    __DEV: !isProduction,
  },
  root: "src",
  build: {
    outDir: "../dist2",
    rollupOptions: {
      output: {},
    },
  },
  logLevel: "silent",
}

function createHtmlConfig(input) {
  return deepMerge(commonConfig, {
    publicDir: "../public", // files in this folder gets copied into outDir during build.
    build: {
      assetsDir: ".", // puts assets into 'outDir/assetsDir'
      target: "es2022", // to use top-level await
      rollupOptions: {
        input,
        output: {
          assetFileNames: "[name].[ext]",
          entryFileNames: "[name].js",
        },
      },
    },
    css: {
      postcss: {
        plugins: [
          // don't know why but css gets unnested without this too
          nested(),
        ],
      },
    },
    plugins: [tailwindcss()],
  })
}

function createJsConfig(input) {
  return deepMerge(commonConfig, {
    build: {
      inlineDynamicImports: true,
      rollupOptions: {
        input,
        output: {
          // to fix content script, service worker file names
          entryFileNames: "[name].js",
        },
      },
    },
  })
}

// Utils

function logInfo(anything, type = "build") {
  console.log(`[${type}] ${anything}`)
}

function deepMerge(original = {}, toMerge = {}) {
  const isObj = (x) => x && typeof x === "object" && !Array.isArray(x)
  const out = { ...original }
  for (const k in toMerge) {
    const v = toMerge[k]
    const t = out[k]
    if (isObj(t) && isObj(v)) out[k] = deepMerge(t, v)
    else if (Array.isArray(t) && Array.isArray(v)) out[k] = [...t, ...v]
    else out[k] = v
  }
  return out
}

// Setting emptyOutDir at vite config empties folder at every build() run
async function emptyOutDir() {
  const outDir = path.resolve(commonConfig.root, commonConfig.build.outDir)
  try {
    await fs.mkdir(outDir, { recursive: true })
  } catch {}
  const items = await fs.readdir(outDir)

  for (const item of items) {
    const full = path.join(outDir, item)
    const s = await fs.stat(full)

    if (s.isDirectory()) {
      await fs.rm(full, { recursive: true, force: true })
    } else {
      await fs.rm(full, { force: true })
    }
  }
}

async function createExtensionZip() {
  const archive = archiver("zip", {
    zlib: {
      level: 9,
    },
  })
  const fsOuput = fsSync.createWriteStream(
    `${manifest.name.toLowerCase().replaceAll(" ", "-")}-${manifest.version}.zip`,
  )
  archive.pipe(fsOuput)
  archive.directory("dist2", false)
  return archive.finalize()
}

// Build

const jsEntries = ["src/content-script/content.js", "src/service-worker.js"]
const htmlEntries = [
  { home: "src/pages/home/index.html" },
  { tutorial: "src/pages/tutorial/index.html" },
  { options: "src/pages/options/index.html" },
  { update_notes: "src/pages/update_notes/index.html" },
]

async function run() {
  logInfo("emptying out dir once...", "preprocess")
  await emptyOutDir()
  logInfo("done", "preprocess")

  for (const jsInput of jsEntries) {
    logInfo(jsInput)
    await build(createJsConfig(jsInput))
  }
  for (const htmlInput of htmlEntries) {
    logInfo(htmlInput)
    await build(createHtmlConfig(htmlInput))
  }

  if (isProduction) {
    logInfo("zipping extension...", "production")
    await createExtensionZip()
    logInfo("done", "production")
  }
}

// run build
run()
