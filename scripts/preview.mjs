// preview.mjs — 本地无头浏览器预览：跑模型 → 生成 preview.html（亮/暗两块）
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = dirname(dirname(fileURLToPath(import.meta.url)))
globalThis.window = {
  __ModuleLoader__: {
    load(def) {
      globalThis.__zcf = def.factory((n) => (n === "react" ? { createElement: () => ({}), useMemo: (f) => f() } : null))
    },
  },
}
await import(new URL("../lib/client.js", import.meta.url).href)
const t = globalThis.__zcf.__test

// 运行中：站1 done、站2 done、站3 running（1 药丸转圈）——对齐用户 demo-3 场景
const running = t.buildTimeline(
  { name: "workflow-ui-demo-3", phases: [{ title: "独立诊断并确认根因" }, { title: "实现修复并过门禁" }, { title: "验收并交付" }] },
  { status: "running", activePhase: "验收并交付", agents: [
    { label: "根因诊断员", phase: "独立诊断并确认根因", status: "done" },
    { label: "实现工程师", phase: "实现修复并过门禁", status: "done" },
    { label: "未命名子代理", phase: "实现修复并过门禁", status: "done" },
    { label: "代码评审员", phase: "实现修复并过门禁", status: "done" },
    { label: "文档补写员", phase: "验收并交付", status: "running" },
  ] },
)
// 已完成
const completed = t.buildTimeline(
  { name: "workflow-ui-demo-2", phases: [{ title: "侦察" }, { title: "汇总" }] },
  { status: "completed", agents: [
    { label: "侧板", phase: "侦察", status: "done" },
    { label: "弧线", phase: "侦察", status: "done" },
    { label: "汇总", phase: "汇总", status: "done" },
  ] },
)
// 工具行一行摘要（新形态）
const toolRow = t.renderTimelineHTML(t.modelFromToolCall({ phase: "result", isError: false, content: 'workflow "workflow-ui-demo-3" completed (5 agents).' }))

// 并行带：方案-解析 ∥ 方案-容错（alongside），fork/merge 抬轨
const banded = t.buildTimeline(
  { name: "banded-demo", phases: [{ title: "需求澄清" }, { title: "方案-解析" }, { title: "方案-容错" }, { title: "编码实现" }], alongside: [["方案-解析", "方案-容错"]] },
  { status: "running", activePhase: "编码实现", agents: [
    { label: "需求澄清员", phase: "需求澄清", status: "done" },
    { label: "方案-解析", phase: "方案-解析", status: "done" },
    { label: "方案-容错", phase: "方案-容错", status: "running" },
    { label: "编码员", phase: "编码实现", status: "pending" },
  ] },
)

// 循环弧 demo：修复→侦察 回边（faint）+ 侦察→评审 前向弧（落 running 站 → march）
const looped = t.buildTimeline(
  { name: "loop-demo", phases: [{ title: "侦察" }, { title: "实现" }, { title: "评审" }, { title: "修复" }], edges: [["侦察", "实现"], ["实现", "评审"], ["评审", "修复"], ["修复", "侦察"], ["侦察", "评审"]] },
  { status: "running", activePhase: "评审", agents: [
    { label: "侦察员", phase: "侦察", status: "done" },
    { label: "实现员", phase: "实现", status: "done" },
    { label: "评审员", phase: "评审", status: "running" },
    { label: "修复员", phase: "修复", status: "pending" },
  ] },
)

// 多药丸卡：9 个子代理挤同一站（真实单阶段并行形态）→ 折叠 + ＋N
const many = t.buildTimeline(
  { name: "many-pills-demo", phases: [{ title: "并行深挖" }, { title: "对抗核验" }, { title: "综合" }] },
  { status: "running", activePhase: "并行深挖", agents: [
    { label: "子任务-F", phase: "并行深挖", status: "running" },
    { label: "子任务-G", phase: "并行深挖", status: "done" },
    { label: "子任务-D", phase: "并行深挖", status: "done" },
    { label: "子任务-E", phase: "并行深挖", status: "done" },
    { label: "子任务-B", phase: "并行深挖", status: "done" },
    { label: "子任务-A", phase: "并行深挖", status: "done" },
    { label: "子任务-H", phase: "并行深挖", status: "done" },
    { label: "子任务-C", phase: "并行深挖", status: "done" },
    { label: "子任务-I", phase: "并行深挖", status: "failed" },
  ] },
)

// 抽 CSS：从渲染模块同源 styles 文件拿（构建后 CSS 在 lib/client.js 里，直接抓 <style> 内容不可行——改从 styles 模块引入）
const stylesSrc = await import(new URL("../src/timeline-styles.js", import.meta.url).href)

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body { margin: 0; font-family: system-ui, sans-serif; }
.wrap { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.wrap.dark { background: #1c1c1c; }
/* 模拟 DSH 暗色 token（真机由 dsh-client-ui-theme 提供） */
.dark-sim {
  --dsw-alias-label-primary: #ececf1;
  --dsw-alias-label-secondary: #9a9aa3;
  --dsw-alias-border-l1: rgba(255,255,255,.14);
  --dsw-alias-border-l2: rgba(255,255,255,.26);
  --dsw-alias-bg-layer-1: #242428;
  --dsw-alias-bg-layer-2: #2c2c31;
  --dsw-alias-bg-overlay: #35353b;
  --dsw-alias-state-warn-primary: #f0a83c;
  --dsw-alias-state-success-primary: #46c05e;
  --dsw-alias-state-error-primary: #e5484d;
}
</style><style>${stylesSrc.CSS}</style></head>
<body>
<div class="wrap">${t.renderTimelineHTML(running)}</div>
<div class="wrap">${t.renderTimelineHTML(many)}</div>
<div class="wrap">${t.renderTimelineHTML(looped)}</div>
<div class="wrap">${t.renderTimelineHTML(banded)}</div>
<div class="wrap">${t.renderTimelineHTML(completed)}</div>
<div class="wrap">${toolRow}</div>
<div class="wrap dark"><div class="dark-sim">${t.renderTimelineHTML(running)}<div class="wrap" style="padding:12px 0 0">${t.renderTimelineHTML(banded)}</div></div></div>
<script>
(function () {
  function zcfMeasure(root) {
    var strip = root.querySelector(".zcf-strip"); if (!strip) return
    var stations = [].slice.call(strip.querySelectorAll(":scope > .zcf-station"))
    var prevTop = null
    stations.forEach(function (st) {
      st.classList.remove("zcf-rowend", "zcf-rowstart")
      st.style.removeProperty("--zcf-rowext"); st.style.removeProperty("--zcf-rowpre"); st.style.removeProperty("--zcf-rowpre-ml")
      var top = st.offsetTop
      var i = stations.indexOf(st); var next = stations[i + 1]
      var isEnd = next ? next.offsetTop !== top : false
      var isStart = prevTop !== null && prevTop !== top
      if (isEnd) { st.classList.add("zcf-rowend"); var extra = Math.max(0, strip.clientWidth - (st.offsetLeft + st.offsetWidth) - 2); st.style.setProperty("--zcf-rowext", extra + "px") }
      if (isStart) { st.classList.add("zcf-rowstart"); var lampX = st.offsetLeft + 17; st.style.setProperty("--zcf-rowpre", Math.max(0, lampX - 4) + "px"); st.style.setProperty("--zcf-rowpre-ml", -(st.offsetLeft - 2) + "px") }
      prevTop = top
    })
  }
  function zcfAll() { document.querySelectorAll(".zcf-card").forEach(zcfMeasure) }
  window.addEventListener("load", zcfAll)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(zcfAll)
  window.addEventListener("resize", zcfAll)
})()
</script>
</body></html>`
const out = join(root, "docs", "preview", "preview.html")
mkdirSync(dirname(out), { recursive: true }) // CI 全新检出无 docs/preview（已 gitignore）
writeFileSync(out, html)
console.log("wrote", out)
