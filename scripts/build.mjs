// build.mjs — 装配 lib/client.js：facade 模板 + CSS + MODEL + HTML（剥离 import/export）
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const read = (p) => readFileSync(join(root, "src", p), "utf8")

const strip = (src) =>
  src
    .split("\n")
    .filter((l) => !/^\s*import\s/.test(l) && !/^\s*export\s*\{/.test(l))
    .join("\n")
    .replace(/^export\s+(function|const|let)/gm, "$1")

const cssBlock = strip(read("timeline-styles.js"))
const scanBlock = strip(read("script-scan.js"))
const modelBlock = strip(read("timeline-model.js"))
const htmlBlock = strip(read("timeline-html.js"))

const out = read("client-facade.js")
  .replace("/*@CSS_INJECT@*/", cssBlock)
  .replace("/*@SCAN_INJECT@*/", scanBlock)
  .replace("/*@MODEL_INJECT@*/", modelBlock)
  .replace("/*@HTML_INJECT@*/", htmlBlock)

for (const marker of ["/*@CSS_INJECT@*/", "/*@SCAN_INJECT@*/", "/*@MODEL_INJECT@*/", "/*@HTML_INJECT@*/"]) {
  if (out.includes(marker)) throw new Error(`marker not replaced: ${marker}`)
}
if (!out.includes("zcf-sd-spinner") || !out.includes("zcf-arc-ink") || !out.includes("FACE_COLORS") || !out.includes("buildTimeline") || !out.includes("scanScript")) throw new Error("assembly incomplete")
const cssStart = out.indexOf("const CSS = `")
const cssEnd = out.indexOf("`", cssStart + 12)
const css = out.slice(cssStart + 12, cssEnd)
const open = (css.match(/\{/g) || []).length, close = (css.match(/\}/g) || []).length
if (open !== close) throw new Error(`CSS braces unbalanced: ${open} open vs ${close} close`)
writeFileSync(join(root, "lib", "client.js"), out)
console.log("built lib/client.js", out.length, "bytes")
