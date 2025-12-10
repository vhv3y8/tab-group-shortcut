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
    sourcemap: !isProduction,
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
      assetsInlineLimit: 0, // no inline base64 for asset files
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

// File system operations

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

const contentMaterialIcons = [
  "tab-light.svg",
  "tab-dark.svg",
  "fold-light.svg",
  "fold-dark.svg",
]

async function copyContentScriptAssetsAndUpdateManifest() {
  const assetsDir = path.resolve(commonConfig.root, "assets/icons/material")
  const outDir = path.resolve(commonConfig.root, commonConfig.build.outDir)
  // copy files
  await Promise.all(
    [contentMaterialIcons]
      .flat(Infinity)
      .map((fileName) =>
        fs.copyFile(
          path.resolve(assetsDir, fileName),
          path.resolve(outDir, fileName),
        ),
      ),
  )
  // add to web accessibles
  await updateManifest((manifest) => {
    manifest["web_accessible_resources"][0].resources.push(
      ...contentMaterialIcons,
    )
    return manifest
  })
}

async function addJsSourceMapAccessibleForDev() {
  await updateManifest((manifest) => {
    const jsSourceMapResource = "*.js.map"
    manifest["web_accessible_resources"][0].resources.push(jsSourceMapResource)
    return manifest
  })
}

async function updateManifest(updateHook) {
  const builtManifestPath = path.resolve(
    commonConfig.root,
    commonConfig.build.outDir,
    "manifest.json",
  )
  // get manifest
  let builtManifest = await fs
    .readFile(builtManifestPath, "utf8")
    .then((txt) => JSON.parse(txt))
  // run hook
  builtManifest = updateHook(builtManifest)
  // save manifest
  await fs.writeFile(
    builtManifestPath,
    JSON.stringify(builtManifest, null, 2),
    "utf8",
  )
}

async function copyLicenseFiles() {
  const outDir = path.resolve(commonConfig.root, commonConfig.build.outDir)
  const wholeLicensesFolder = "licenses"
  // copy third party license notices
  const thirdPatyLicenseHome = path.resolve(commonConfig.root, "assets")
  await fs.copyFile(
    path.resolve(thirdPatyLicenseHome, "LICENSE"),
    path.resolve(outDir, "NOTICE"),
  )
  await fs.cp(
    path.resolve(thirdPatyLicenseHome, wholeLicensesFolder),
    path.resolve(outDir, wholeLicensesFolder),
    { recursive: true },
  )
  // copy license of this software
  await fs.copyFile(path.resolve("LICENSE"), path.resolve(outDir, "LICENSE"))
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
  { foldpopup: "src/content-script/fold/foldpopup.html" },
  { "foldpopup-style": "src/content-script/fold/foldpopup-style.css" },
]

async function run() {
  // before
  logInfo("emptying out dir...", "before")
  await emptyOutDir()
  logInfo("done", "before")

  // build
  for (const jsInput of jsEntries) {
    logInfo(jsInput)
    await build(createJsConfig(jsInput))
  }
  for (const htmlInput of htmlEntries) {
    logInfo(JSON.stringify(htmlInput))
    await build(createHtmlConfig(htmlInput))
  }

  // after
  logInfo(
    "copy content script assets and add to manifest web accessibles",
    "after",
  )
  await copyContentScriptAssetsAndUpdateManifest()
  logInfo("done", "after")

  if (isProduction) {
    logInfo("copying license files", "production")
    await copyLicenseFiles()
    logInfo("done", "production")

    logInfo("zipping extension...", "production")
    await createExtensionZip()
    logInfo("done", "production")
  } else {
    logInfo("adding *.js.map to manifest web accessibles...", "dev")
    await addJsSourceMapAccessibleForDev()
    logInfo("done", "dev")
  }
}

// run build
run()
