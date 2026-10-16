// crop-preview.mjs — 只保留 banded 卡输出 banded-only.html
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
const root = dirname(dirname(fileURLToPath(import.meta.url)))
let h = readFileSync(join(root, "docs", "preview", "preview.html"), "utf8")
// 砍掉第一个 wrap（running）与 dark 段，仅留 banded
h = h.slice(0, h.lastIndexOf('<div class="wrap dark">'))
h = h.replace(/<div class="wrap">[\s\S]*?<div class="wrap">/, '<div class="wrap">')
writeFileSync(join(root, "docs", "preview", "banded-only.html"), h)
console.log("ok", h.length)
