// dsh-workflow-ui 客户端门面（模板：scripts/build.mjs 注入 CSS/MODEL/HTML 后产出 lib/client.js）
// 协议（子代理 B 契约 + dsh-client-ui-workflow-run 官方样例）：
//   window.__ModuleLoader__.load({id, factory(require)}) → {inject, apply(t)}
//   keyed 槽同名 key：priority 最低者渲染（官方默认 0），本插件用 -1 影子官方；崩溃自动 abdicate 回退官方
window.__ModuleLoader__.load({
  id: "dsh-workflow-ui",
  factory: (require) => {
    const React = require("react")
    const { createElement: h, useMemo, useState, useEffect, useRef } = React

    // 工作流时间线 · 样式（时间线/运动规格参考 ZCode 的公开呈现设计；状态点与图标为 DSH 官方 primitives 形制；token 映射 DSH --dsw-alias-*）
// 局部落地说 14 个 --color-* 语义 token，色值混合一律 color-mix(in oklab,…)
const CSS = `
.zcf-root {
  /* ZCode 语义 token → DSH 别名 token 落地 */
  --color-warning: var(--dsw-alias-state-warn-primary, #e8a33d);
  --color-success: var(--dsw-alias-state-success-primary, #3fb950);
  --color-destructive: var(--dsw-alias-state-error-primary, #e5484d);
  --color-idle: var(--dsw-alias-state-idle-primary, var(--dsw-alias-label-tertiary, #9a9aa3));
  --color-tertiary: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary, #8a8f98));
  --color-foreground: var(--dsw-alias-label-primary, inherit);
  --color-foreground-subtle: var(--dsw-alias-label-secondary, #8a8f98);
  --color-foreground-subtlest: color-mix(in oklab, var(--dsw-alias-label-secondary, #8a8f98) 72%, transparent);
  --color-border: var(--dsw-alias-border-l1, rgba(128,128,128,.28));
  --color-rail: var(--dsw-alias-border-l2, rgba(128,128,128,.45));
  --color-card: var(--dsw-alias-bg-layer-1, transparent);
  --color-surface: var(--dsw-alias-bg-layer-2, rgba(128,128,128,.07));
  --color-surface-hover: var(--dsw-alias-bg-overlay, rgba(128,128,128,.12));
  --color-workflow-trace: color-mix(in oklab, var(--dsw-alias-label-primary, #1a1a1a) 30%, transparent);
  --color-workflow-trace-strong: color-mix(in oklab, var(--dsw-alias-label-primary, #1a1a1a) 55%, transparent);
  /* 工作流局部运动 token（ZCode .wf-motion） */
  --wf-t-fast: 120ms; --wf-t-base: 160ms; --wf-t-enter: 200ms; --wf-t-ink: 320ms;
  --wf-ease: cubic-bezier(0.22, 0.61, 0.36, 1); --wf-beat: 1.6s;
  font: 12px/1.5 var(--dsw-font-sans, system-ui, sans-serif);
  color: var(--color-foreground);
}
/* ── 卡片（ZCode run 卡外框）── */
/* ── 工具行合并：workflow 调用行整体隐藏，时间线卡是对话中唯一入口 ── */
.zcf-toolview-empty { display: none; }
div[data-chat-call-id]:has(.zcf-toolview-empty) { display: none !important; }
.zcf-card { container: zcf / inline-size; display: flex; flex-direction: column; gap: 4px; border: 1px solid color-mix(in oklab, var(--color-border) 70%, transparent); border-radius: 12px; background: color-mix(in oklab, var(--color-card) 70%, transparent); padding: 6px 14px 8px; }
.zcf-compact { padding: 9px 14px; }
.zcf-head { display: flex; align-items: center; gap: 8px; min-width: 0; }
.zcf-head-icon { width: 14px; height: 14px; flex: none; color: var(--color-foreground-subtle); }
.zcf-kind { font-weight: 500; flex: none; }
.zcf-kind.is-running { color: var(--color-warning); }
.zcf-name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.zcf-detail { margin-left: auto; display: flex; align-items: center; gap: 8px; min-width: 0; font-variant-numeric: tabular-nums; color: var(--color-foreground-subtlest); white-space: nowrap; }
.zcf-runlamp { display: inline-flex; align-items: center; flex: none; }
.zcf-word-pending, .zcf-word-stopped { color: var(--color-foreground-subtle); }
.zcf-word-running { color: var(--color-warning); }
.zcf-word-completed { color: var(--color-success); }
.zcf-word-errored { color: var(--color-destructive); }
/* ── 画面：横向时间线，容器窄时自动换行；行尾/行首由组件实测接线（下折/引入）── */
.zcf-plot { overflow: visible; }
.zcf-strip { position: relative; display: flex; flex-flow: row wrap; gap: 24px; row-gap: 30px; width: 100%; align-items: flex-start; }
.zcf-station { position: relative; width: 168px; flex: none; }
/* 灯槽（对齐轨心 17,12）：dot 10px；ongoing spinner 14px 外扩定位补偿 */
.zcf-lamp { position: absolute; left: 12px; top: 7px; width: 10px; height: 10px; box-sizing: border-box; display: inline-flex; }
.zcf-lamp.is-ongoing { left: 10px; top: 5px; width: 14px; height: 14px; }
.zcf-band-svg { display: none; }
.zcf-arcs-svg { display: none; position: absolute; left: 0; top: 0; overflow: visible; pointer-events: none; }
@container zcf (min-width: 920px) {
  .zcf-strip { padding-top: calc(var(--zcf-raise, 0px) + var(--zcf-air, 0px)); flex-wrap: nowrap; }
  .zcf-raise-1 { transform: translateY(-44px); }
  .zcf-raise-2 { transform: translateY(-88px); }
  .zcf-band-svg { display: block; }
  .zcf-arcs-svg { display: block; }
}
/* ── StateDot（照抄官方 primitives：实心态 = 10px slot 内 6px currentColor core；ongoing = 1.5s 双动画 spinner）── */
.zcf-sd { position: relative; display: inline-block; flex: none; width: 10px; height: 10px; }
.zcf-sd::after { content: ""; position: absolute; inset: 20%; border-radius: 50%; background: currentColor; }
.zcf-sd[data-state="done"] { color: var(--color-success); }
.zcf-sd[data-state="error"] { color: var(--color-destructive); }
.zcf-sd[data-state="idle"] { color: var(--color-idle); }
.zcf-sd-spinner { flex: none; color: var(--color-tertiary); }
.zcf-sd-motion { transform-origin: center; animation: zcf-sd-spin 1.5s linear infinite; }
.zcf-sd-track, .zcf-sd-arc { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
.zcf-sd-track { opacity: 0.25; }
.zcf-sd-arc { stroke-dasharray: 12 150; animation: zcf-sd-dash 1.5s ease-in-out infinite; }
@keyframes zcf-sd-spin { to { transform: rotate(360deg); } }
@keyframes zcf-sd-dash { 0% { stroke-dasharray: 12 150; stroke-dashoffset: 0; } 50% { stroke-dasharray: 24 150; stroke-dashoffset: -6; } 100% { stroke-dasharray: 12 150; stroke-dashoffset: 0; } }
/* 到达本站的轨段：站头行内 flex 填充，margin-right 跨过 24px 间隙扎到下一站灯心；墨语义 faint/strong/march */
.zcf-railseg { flex: 1 1 0; height: 1px; margin-left: 8px; margin-right: -30px; background: var(--color-workflow-trace); }
.zcf-railseg.strong { background: var(--color-workflow-trace-strong); }
.zcf-railseg.march { height: 1.5px; background: linear-gradient(90deg, transparent, var(--color-warning) 80%); }
/* ── 换行衔接：行尾延伸到卡内容右缘；行首从卡内容左缘引入 ── */
.zcf-rowend .zcf-railseg { margin-right: calc(-1 * var(--zcf-rowext, 0px) - 2px); }
.zcf-rowstart .zcf-station-head::before { content: ""; order: -1; flex: none; align-self: center; width: var(--zcf-rowpre, 0px); height: 1px; margin-left: var(--zcf-rowpre-ml, 0px); margin-right: 6px; background: var(--color-workflow-trace); }
/* 并行带 fork/merge SVG */
.zcf-band-svg { position: absolute; overflow: visible; pointer-events: none; }
.zcf-band-ink { stroke: var(--color-workflow-trace); }
.zcf-band-ink.strong { stroke: var(--color-workflow-trace-strong); }
.zcf-band-ink.march { stroke: var(--color-warning); stroke-width: 1.5; }
/* ── 弧（非相邻边/回边）：1px 墨 + 三档 + 箭头 marker 染色 ── */
.zcf-arc-ink { stroke: var(--color-workflow-trace); stroke-width: 1; }
.zcf-arc-ink.strong { stroke: var(--color-workflow-trace-strong); }
.zcf-arc-ink.march { stroke: var(--color-warning); stroke-width: 1.5; }
.zcf-arc-mk.faint { fill: var(--color-workflow-trace); }
.zcf-arc-mk.strong { fill: var(--color-workflow-trace-strong); }
.zcf-arc-mk.march { fill: var(--color-warning); }
/* ── 站头 ── */
.zcf-station-head { display: flex; align-items: center; gap: 5px; height: 24px; padding-left: 26px; min-width: 0; }
.zcf-station-name { font-size: 12px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-foreground-subtle); }
.zcf-station.is-visited .zcf-station-name { color: var(--color-foreground); }
.zcf-station-meta { font-family: var(--dsw-font-mono, ui-monospace, monospace); font-size: 11px; font-variant-numeric: tabular-nums; color: var(--color-foreground-subtlest); flex: none; margin-left: -1px; }
/* ── 药丸列：32px 高、间距 6、依次落地 ── */
.zcf-pills { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; margin-top: 2px; padding-left: 8px; }
.zcf-pill { display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 10px 0 8px; border-radius: 999px; background: var(--color-surface); max-width: 160px; animation: zcf-arrive var(--wf-t-enter) var(--wf-ease) backwards; animation-delay: var(--zcf-d, 0ms); transition: background var(--wf-t-fast) var(--wf-ease); }
.zcf-pill:hover { background: var(--color-surface-hover); }
@keyframes zcf-arrive { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.zcf-avatar { width: 18px; height: 18px; border-radius: 6px; flex: none; background: var(--wf-avatar, var(--color-rail)); position: relative; }
.zcf-avatar::before, .zcf-avatar::after { content: ""; position: absolute; top: 6px; width: 2px; height: 2px; border-radius: 50%; background: #fff; }
.zcf-avatar::before { left: 4.5px; } .zcf-avatar::after { right: 4.5px; }
/* 表情（CSS 态，对齐 ZCode faceState）：running=计时扫视（张望+眨眼，药丸间负延迟去同步），done=弓眼 ∩，failed=垂眼 ∪ */
.zcf-pill.is-running .zcf-avatar::before, .zcf-pill.is-running .zcf-avatar::after { animation: zcf-glance 3.6s ease-in-out infinite; animation-delay: calc(-1 * var(--zcf-d, 0ms) * 11); }
@keyframes zcf-glance {
  0%, 10% { transform: translateX(0) scaleY(1); }
  14% { transform: translateX(0) scaleY(0.5); } 18% { transform: translateX(0) scaleY(1); }
  26%, 38% { transform: translateX(1.4px) scaleY(1); }
  46% { transform: translateX(1.4px) scaleY(0.5); } 50% { transform: translateX(1.4px) scaleY(1); }
  58%, 62% { transform: translateX(0) scaleY(1); }
  70%, 82% { transform: translateX(-1.4px) scaleY(1); }
  86% { transform: translateX(-1.4px) scaleY(0.5); } 90%, 100% { transform: translateX(0) scaleY(1); }
}
.zcf-pill.is-done .zcf-avatar::before, .zcf-pill.is-done .zcf-avatar::after { top: 7px; width: 4.5px; height: 2px; background: transparent; border-top: 1.3px solid #fff; border-radius: 50% 50% 0 0; box-sizing: border-box; }
.zcf-pill.is-done .zcf-avatar::before { left: 3.5px; } .zcf-pill.is-done .zcf-avatar::after { right: 3.5px; }
.zcf-pill.is-failed .zcf-avatar::before, .zcf-pill.is-failed .zcf-avatar::after { top: 6px; width: 4.5px; height: 2px; background: transparent; border-bottom: 1.3px solid #fff; border-radius: 0 0 50% 50%; box-sizing: border-box; }
.zcf-pill.is-failed .zcf-avatar::before { left: 3.5px; } .zcf-pill.is-failed .zcf-avatar::after { right: 3.5px; }
.zcf-pillname { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-foreground-subtle); }
.zcf-pill.is-settled .zcf-pillname { color: var(--color-foreground); }
.zcf-pillmark { width: 14px; height: 14px; flex: none; display: grid; place-items: center; color: var(--color-foreground-subtle); }
.zcf-pillmark.is-failed { color: var(--color-destructive); }
.zcf-dshicon { display: block; flex: none; }
/* 药丸折叠（站内 >5 时）：默认隐藏第 6 个起；＋N/收起 切换 */
.zcf-pills.is-collapsed .zcf-pill:nth-of-type(n+6) { display: none; }
.zcf-pillmore { box-sizing: border-box; display: inline-flex; align-items: center; height: 32px; padding: 0 12px; border: 1px dashed color-mix(in oklab, var(--color-border) 90%, transparent); border-radius: 16px; background: transparent; color: var(--color-foreground-subtle); font: inherit; font-size: 12px; cursor: pointer; }
.zcf-pillmore:hover { background: var(--color-surface-hover); }
.zcf-pillmore .t-less { display: none; }
.zcf-pills:not(.is-collapsed) .zcf-pillmore .t-more { display: none; }
.zcf-pills:not(.is-collapsed) .zcf-pillmore .t-less { display: inline; }
@media (prefers-reduced-motion: reduce) {
  .zcf-sd-motion, .zcf-sd-arc, .zcf-kind.is-running,
  .zcf-pill.is-running .zcf-avatar::before, .zcf-pill.is-running .zcf-avatar::after { animation: none; }
  .zcf-sd-arc { stroke-dasharray: 18 150; stroke-dashoffset: -3; }
  .zcf-pill { animation: none; }
  .zcf-root * { transition: none !important; }
}
`
let injected = false
function ensureStyles(doc) {
  if (injected || !doc) return
  const el = doc.createElement("style")
  el.id = "dsh-workflow-ui-styles"
  el.dataset.plugin = "dsh-workflow-ui"
  el.dataset.pluginCss = "dsh-workflow-ui/styles.css"
  el.textContent = CSS
  doc.head.appendChild(el)
  injected = true
}


    // 脚本静态扫描：从 workflow 脚本文本提取阶段序、alongside 组（parallel 块）、顺序边
// 对齐 ZCode 管线：analyzer → causalityGraph（只是搬到客户端、按需精简）

function scanScript(script) {
  if (typeof script !== "string" || script.length === 0) return { order: [], groups: [], edges: [] }
  // parallel(...) 块区间（括号配平，支持嵌套）
  const blocks = []
  const pre = /\bparallel\s*\(/g
  let m
  while ((m = pre.exec(script))) {
    let depth = 0
    const start = m.index + m[0].length - 1
    let end = start
    for (let i = start; i < script.length; i++) {
      const c = script[i]
      if (c === "(") depth++
      else if (c === ")") { depth--; if (depth === 0) { end = i + 1; break } }
    }
    blocks.push({ start, end })
  }
  const blockAt = (pos) => {
    for (let b = 0; b < blocks.length; b++) if (pos > blocks[b].start && pos < blocks[b].end) return b
    return -1
  }
  // phase 引用：phase('X') 与 agent(..., { phase: 'X' })
  const refs = []
  for (const rr of [/\bphase\s*\(\s*["']([^"']+)["']\s*\)/g, /phase\s*:\s*["']([^"']+)["']/g]) {
    let mm
    while ((mm = rr.exec(script))) refs.push({ title: mm[1], pos: mm.index })
  }
  refs.sort((a, b) => a.pos - b.pos)
  const order = []
  const seen = new Set()
  for (const r of refs) if (!seen.has(r.title)) { seen.add(r.title); order.push(r.title) }
  const groupOf = refs.map((r) => blockAt(r.pos))
  // alongside 组：同一 parallel 块内出现的不同 phase
  const byBlock = new Map()
  refs.forEach((r, i) => {
    const b = groupOf[i]
    if (b === -1) return
    if (!byBlock.has(b)) byBlock.set(b, new Set())
    byBlock.get(b).add(r.title)
  })
  const groups = [...byBlock.values()].map((s) => [...s]).filter((g) => g.length >= 2)
  // 顺序边：源顺序相邻引用，同组（alongside）不连
  const edges = []
  for (let i = 1; i < refs.length; i++) {
    const a = refs[i - 1].title, b = refs[i].title
    if (a === b) continue
    if (groupOf[i - 1] !== -1 && groupOf[i - 1] === groupOf[i]) continue
    edges.push([a, b])
  }
  // agent 引用：label + phase 配对（计划药丸占位的数据源）
  const agents = []
  const ra = /\bagent\s*\(/g
  let ma
  while ((ma = ra.exec(script))) {
    let depth = 0
    const s = ma.index + ma[0].length - 1
    let e = s
    for (; e < script.length; e++) {
      const c = script[e]
      if (c === "(") depth++
      else if (c === ")") { depth--; if (depth === 0) { e++; break } }
    }
    const body = script.slice(s, e)
    const label = body.match(/label\s*:\s*["']([^"']+)["']/)?.[1] ?? null
    const phase = body.match(/phase\s*:\s*["']([^"']+)["']/)?.[1] ?? null
    agents.push({ label, phase, pos: ma.index })
  }
  // 隐式 phase 继承：未写 phase 的 agent 继承其前方最近的 phase('X')
  let lastPhase = null
  const timeline = [
    ...refs.filter((r) => r.pos !== undefined).map((r) => ({ pos: r.pos, kind: "phase", title: r.title })),
    ...agents.map((a) => ({ pos: a.pos, kind: "agent", a })),
  ].sort((x, y) => x.pos - y.pos)
  for (const item of timeline) {
    if (item.kind === "phase") lastPhase = item.title
    else if (item.a.phase === null && lastPhase) item.a.phase = lastPhase
  }
  const plannedAgents = agents
    .filter((a) => a.label && a.phase)
    .map((a) => ({ label: a.label, phase: a.phase }))
  return { order, groups, edges, agents: plannedAgents }
}


    // ZCode 风格时间线 · 纯数据模型
// 状态折叠对齐 ZCode aggregateRunStatuses（报告 §2.3.4/§6.2）：
//   缺席≠pending；任一 running→running（优先于 failed）；有结算有排队→running；全排队→pending；全结算→有败 failed 否则 done
// run 词汇对齐 ZCode 五态：pending|running|completed|errored|stopped（报告 §6.1）

const RUN_WORDS = {
  pending: { word: "待运行", tone: "pending" },
  running: { word: "运行中", tone: "running" },
  completed: { word: "已完成", tone: "completed" },
  errored: { word: "失败", tone: "errored" },
  stopped: { word: "已停止", tone: "stopped" },
  cancelled: { word: "已取消", tone: "stopped" },
  interrupted: { word: "已中断", tone: "stopped" },
}
const PILL_WORDS = { pending: "待运行", running: "运行中", done: "已完成", failed: "失败", cancelled: "已取消", interrupted: "已中断" }

function normRunStatus(s) {
  switch (s) {
    case "running": return "running"
    case "completed": case "done": case "ok": return "completed"
    case "errored": case "failed": case "error": return "errored"
    case "cancelled": return "cancelled"
    case "interrupted": return "interrupted"
    case "stopped": case "killed": return "stopped"
    default: return "pending"
  }
}

/** 官方 chat node 投影 → 时间线模型；declared = {phases, alongside, edges, agents}（来自 meta store 的脚本扫描，可选）。
 *  声明 agents 作为计划药丸占位：未启动 = pending（对齐 ZCode 不变式「静态药丸与 pending 逐像素相同」），启动后按 (phase|label) 匹配真实状态。 */
function modelFromRunNode(node, declared) {
  const d = node?.data ?? {}
  const proj = []
  for (const ph of Array.isArray(d.phases) ? d.phases : []) {
    for (const mm of Array.isArray(ph.members) ? ph.members : []) {
      proj.push({ label: mm.label, phase: ph.phase ?? "未分阶段", status: mm.status })
    }
  }
  const declaredAgents = Array.isArray(declared?.agents) ? declared.agents : []
  const declaredPhases = Array.isArray(declared?.phases) ? declared.phases : []
  const alongside = Array.isArray(declared?.alongside) ? declared.alongside : []
  const statusByKey = new Map(proj.map((p) => [p.phase + "|" + p.label, p.status]))
  let agents
  if (declaredAgents.length > 0) {
    const used = new Set()
    agents = declaredAgents.map((da) => {
      const key = da.phase + "|" + da.label
      const st = statusByKey.get(key)
      const status = st !== undefined ? st : "pending"
      if (st !== undefined) used.add(key)
      return { label: da.label, phase: da.phase, status }
    })
    for (const p of proj) {
      const key = p.phase + "|" + p.label
      if (!used.has(key)) agents.push({ label: p.label, phase: p.phase, status: p.status })
    }
  } else {
    agents = proj
  }
  return buildTimeline({ name: d.name, phases: declaredPhases, alongside, edges: Array.isArray(declared?.edges) ? declared.edges : [] }, { status: d.status, agents })
}

/** workflow 工具调用 owner（tool.call.toolview）→ 时间线模型（argsRaw.meta.phases 静态阶段；解析失败降级为一行摘要） */
function modelFromToolCall(props) {
  const p = props ?? {}
  // 多路找 argsRaw：owner 直挂 / start 的 call / result 的 block.call / block.input 等
  const raw =
    p.argsRaw ?? p.call?.argsRaw ?? p.block?.argsRaw ?? p.block?.call?.argsRaw ??
    p.input?.argsRaw ?? p.block?.input?.argsRaw ?? null
  let meta = { name: "", phases: [] }
  try {
    const input = typeof raw === "string" ? JSON.parse(raw) : raw
    const m = input?.meta
    if (m && typeof m === "object") meta = { name: m.name ?? "", phases: Array.isArray(m.phases) ? m.phases : [] }
  } catch { /* 保持空，走降级 */ }
  if (!meta.name) {
    // 从结果文本兜底拿名字：workflow "xxx" completed …
    const text = `${p.content ?? ""} ${p.block?.content ?? ""} ${p.call?.content ?? ""}`
    const hit = text.match(/workflow\s+"([^"]+)"/)
    if (hit) meta.name = hit[1]
  }
  const status = p.phase === "result" ? (p.isError || p.block?.isError ? "errored" : "completed") : "running"
  return buildTimeline(meta, { status, agents: [] })
}

function foldNode(statuses) {
  // statuses: pill 状态数组（pending/running/done/failed/cancelled/interrupted）
  const anyRunning = statuses.includes("running")
  const anySettled = statuses.some(isSettled)
  const anyQueued = statuses.includes("pending")
  if (anyRunning) return "running"
  if (anySettled && anyQueued) return "running"
  if (anySettled) return statuses.includes("failed") ? "failed" : "done"
  if (statuses.length > 0) return "pending"
  return undefined // 缺席不是状态
}
function isSettled(s) {
  return s === "done" || s === "failed" || s === "cancelled" || s === "interrupted"
}

/**
 * buildTimeline(meta, run) → 横向时间线模型
 * meta: { name, phases: [{title}] }
 * run:  { status, activePhase?, agents: [{label, phase, status}] }
 */
function buildTimeline(meta, run = {}) {
  const declared = Array.isArray(meta?.phases) ? meta.phases : []
  const agents = Array.isArray(run?.agents) ? run.agents : []
  const seen = new Set(declared.map((p) => p.title))
  const extra = []
  for (const a of agents)
    if (a.phase && !seen.has(a.phase)) { seen.add(a.phase); extra.push({ title: a.phase }) }

  const runStatus = normRunStatus(run?.status)
  const runActive = runStatus === "pending" || runStatus === "running"

  // 头像色按全局首现序分配（ZCode：avatarIndex 按 lane@ordinal 全局首现）
  let faceSeq = 0
  const stations = [...declared, ...extra].map((p) => {
    const mine = agents.filter((a) => a.phase === p.title)
    const folded = foldNode(mine.map((a) => normPill(a.status)))
    // stationStatus 顺序规则（§6.2）
    let status
    if (folded === "running" || folded === "failed") status = folded // 硬事实先说
    else if (p.title === run?.activePhase && runActive) status = "running"
    else if (p.title === run?.activePhase && !runActive) status = runStatus === "completed" ? "done" : "failed"
    else if (folded) status = folded
    else status = "pending"
    const pills = mine.map((a) => {
      const st = normPill(a.status)
      const settled = isSettled(st)
      return { label: a.label ?? "agent", status: st, avatar: faceSeq++ % 9, settled }
    })
    return { title: p.title, status, visited: status !== "pending", pills, meta: `${pills.filter((x) => x.settled).length}/${pills.length}` }
  })

  const total = stations.reduce((n, s) => n + s.pills.length, 0)
  const settled = stations.reduce((n, s) => n + s.pills.filter((x) => x.settled).length, 0)
  const rw = RUN_WORDS[runStatus]
  // 进入 running 站的那段轨是 march（报告 §3.7 第 12 步简化版）
  for (let i = 0; i < stations.length; i++) {
    const s = stations[i]
    s.seg = s.status === "running" ? "march" : i > 0 && stations[i - 1].visited && s.visited ? "strong" : "faint"
  }
  // ── alongside 带分配（报告 §3.2 简化版）：并查集连通 → 区间 → 区间内成员按序上轨 ──
  let maxTrack = 0
  const alongside = Array.isArray(meta?.alongside) ? meta.alongside : []
  if (alongside.length > 0) {
    const idxByTitle = new Map(stations.map((s, i) => [s.title, i]))
    const parent = stations.map((_, i) => i)
    const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])))
    for (const g of alongside) {
      const ids = g.map((t) => idxByTitle.get(t)).filter((v) => v !== undefined)
      for (let k = 1; k < ids.length; k++) {
        const a = find(ids[0]), b = find(ids[k])
        if (a !== b) parent[b] = a
      }
    }
    const bands = new Map()
    stations.forEach((s, i) => {
      if (!idxByTitle.has(s.title)) return
      const r = find(i)
      if (!bands.has(r)) bands.set(r, [])
      bands.get(r).push(i)
    })
    var bandRanges = []
    for (const members of bands.values()) {
      if (members.length < 2) continue
      const lo = Math.min(...members), hi = Math.max(...members)
      members.forEach((idx, t) => { stations[idx].track = t })
      bandRanges.push({ lo, hi })
    }
    maxTrack = stations.reduce((n, s) => Math.max(n, s.track ?? 0), 0)
  }
  // ── 弧（报告 §3.3/§3.4 简化版）：非相邻边在轨道上方空气里飞；to<from 为回边（循环）──
  // 道位：跨度短者落低道；与已放弧在站索引闭区间上相交才上推（无关弧同高、嵌套弧内低外高）
  const arcs = []
  const edges = Array.isArray(meta?.edges) ? meta.edges : []
  if (edges.length > 0 && stations.length > 1) {
    const idx2 = new Map(stations.map((s, i) => [s.title, i]))
    const cand = []
    for (const pair of edges) {
      if (!Array.isArray(pair) || pair.length < 2) continue
      const ia = idx2.get(pair[0]), ib = idx2.get(pair[1])
      if (ia === undefined || ib === undefined || ia === ib || Math.abs(ia - ib) === 1) continue // 相邻边已由轨段/带表达
      cand.push({ lo: Math.min(ia, ib), hi: Math.max(ia, ib), fwd: ib > ia })
    }
    cand.sort((x, y) => x.hi - x.lo - (y.hi - y.lo)) // 跨度升序（载荷序破平靠稳定排序）
    const placed = []
    for (const c of cand) {
      let lane = 0
      while (placed.some((p) => p.lane === lane && !(p.hi < c.lo || p.lo > c.hi))) lane++
      c.lane = lane
      placed.push(c)
    }
    for (const c of placed) {
      const from = c.fwd ? c.lo : c.hi // 流向：前向左→右；回边右→左
      const to = c.fwd ? c.hi : c.lo
      const src = stations[from], dst = stations[to]
      const strong = src.visited && dst.visited // 前向：两端 visited；回边：源 visited（rounds 简化）
      const march = dst.status === "running" && src.visited // 落入 running 站且源走过 → march
      arcs.push({ from, to, lane: c.lane, loop: !c.fwd, ink: march ? "march" : strong ? "strong" : "faint" })
    }
  }
  const arcLanes = arcs.reduce((n, a) => Math.max(n, a.lane + 1), 0)
  const allAgents = stations.flatMap((s) => s.pills)
  return {
    name: meta?.name ?? "workflow", status: runStatus, word: rw.word, tone: rw.tone,
    stations,
    progress: total > 0 ? { settled, total } : null,
    phaseCount: stations.length,
    agentsTotal: allAgents.length,
    agentsRunning: allAgents.filter((p) => p.status === "running").length,
    maxTrack,
    bands: bandRanges ?? [],
    arcs,
    arcLanes,
    declaredCount: Array.isArray(meta?.phases) ? meta.phases.length : 0,
  }
}

function normPill(s) {
  switch (s) {
    case "running": return "running"
    case "done": case "completed": case "ok": return "done"
    case "failed": case "errored": case "error": return "failed"
    case "cancelled": return "cancelled"
    case "interrupted": return "interrupted"
    default: return "pending"
  }
}


    // ZCode 风格时间线 · HTML 字符串渲染面
// 九色脸（FACE_COLORS）+ 尾槽标记 + 站头 mono 元数据，规格见提取报告 §4.2/§4.3/§4.4
// 布局常量对齐 ZCode：PAD 8 / 站宽 168 / PITCH 192 / 灯心 +17；轨道只画到最后一站（无拖尾）

const FACE_COLORS = ["#54B9A6", "#F19D38", "#6464EF", "#885CF5", "#3C82F6", "#ED712E", "#EB4699", "#5BC67A", "#EA4045"]

const PAD = 8, PITCH = 192, LAMP_X = 17

// ── DSH 官方图标（path 照抄 @deepseek-ai/dsh-client-ui-primitives 0.1.0-rc.6：16 viewBox / 1px Regular / currentColor）──
const DSH_ICON = (inner, size, cls = "zcf-dshicon") => `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke-width="1" aria-hidden="true">${inner}</svg>`
const P = (d) => `<path d="${d}" stroke="currentColor"/>`
const PF = (d) => `<path d="${d}" fill="currentColor"/>`
// IconListPenOutline（工作流卡头，官方"计划"图标 = 文档 + 行 + 笔）
const ICON_PLAN = DSH_ICON(
  P("M4.9375 5.90295H11.0625") + P("M4.9375 9.02991H8.27841") +
  PF("M12.5 1.32617C13.3039 1.32617 14 1.95171 14 2.77637V7.61328L13 8.68164V2.77637C13 2.55186 12.8007 2.32617 12.5 2.32617H3.5C3.1993 2.32617 3 2.55186 3 2.77637V13.2246C3.00044 13.4489 3.19963 13.6738 3.5 13.6738H8.32812L7.39258 14.6738H3.5C2.69637 14.6738 2.00042 14.0489 2 13.2246V2.77637C2 1.95171 2.69613 1.32617 3.5 1.32617H12.5Z") +
  PF("M8.97212 14.3693C9.17511 14.5723 9.37811 14.7753 9.5811 14.9783C9.67012 14.8953 9.75914 14.8123 9.84815 14.7293C11.4505 13.2352 13.0528 11.7411 14.6551 10.247C14.7441 10.164 14.8331 10.081 14.9221 9.99803C14.5989 9.6748 14.2756 9.35157 13.9524 9.02834C13.8694 9.11736 13.7864 9.20637 13.7034 9.29539C12.2093 10.8977 10.7152 12.5 9.22113 14.1023C9.13813 14.1913 9.05513 14.2803 8.97212 14.3693Z") +
  PF("M11.6323 13.7841C11.6323 14.0395 11.6323 14.295 11.6323 14.5504C11.6812 14.5523 11.7301 14.5543 11.779 14.5562C12.659 14.5913 13.539 14.6263 14.419 14.6614C14.4679 14.6633 14.5168 14.6653 14.5657 14.6672C14.5657 14.3339 14.5657 14.0006 14.5657 13.6672C14.5168 13.6692 14.4679 13.6711 14.419 13.6731C13.539 13.7081 12.659 13.7432 11.779 13.7841Z"), 14, "zcf-dshicon zcf-head-icon")
// IconCheckOutlineRegular / IconCloseOutlineRegular（药丸结算标记）
const ICON_CHECK = DSH_ICON(P("M2.25 8.5L5.49732 11.7473C5.90519 12.1552 6.57263 12.1344 6.95426 11.7018L13.75 4"), 12)
const ICON_CLOSE = DSH_ICON(P("M2.5 2.5L13.5 13.5") + P("M13.5 2.5L2.5 13.5"), 12)
// StateDot（官方状态点：done/warning/error/idle = 10px slot 6px core；ongoing = 14px 双圆 spinner）
function stateDot(state) {
  if (state === "ongoing") {
    return `<svg class="zcf-sd-spinner" data-state="ongoing" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><g class="zcf-sd-motion"><circle class="zcf-sd-track" cx="12" cy="12" r="9.5"/><circle class="zcf-sd-arc" cx="12" cy="12" r="9.5"/></g></svg>`
  }
  return `<span class="zcf-sd" data-state="${state}"></span>`
}
const LAMP_STATE = { running: "ongoing", done: "done", failed: "error", pending: "idle" }

function escapeHtml(x) {
  return String(x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])
}

function PILL_WORD(st) {
  return { pending: "待运行", running: "运行中", done: "已完成", failed: "失败", cancelled: "已取消", interrupted: "已中断" }[st] ?? "待运行"
}

function pill(p, i) {
  const mark =
    p.status === "running" ? `<span class="zcf-pillmark is-running" role="img" aria-label="运行中">${stateDot("ongoing")}</span>`
    : p.status === "done" ? ICON_CHECK
    : p.status === "failed" ? `<span class="zcf-pillmark is-failed">${ICON_CLOSE}</span>`
    : ""
  const st = p.status === "pending" ? "" : ` is-${p.status}`
  return `<span class="zcf-pill${st}${p.settled ? " is-settled" : ""}" role="listitem" style="--zcf-d:${i * 30}ms;--wf-avatar:${FACE_COLORS[p.avatar % 9]}">
    <span class="zcf-avatar" aria-hidden="true"></span>
    <span class="zcf-pillname">${escapeHtml(p.label)}</span>
    <span class="zcf-pillmark">${mark}</span>
  </span>`
}

function station(s, i, nextSeg) {
  const cls = s.status === "running" ? "running" : s.status === "done" ? "done" : s.status === "failed" ? "failed" : "pending"
  const visitedCls = s.visited ? " is-visited" : ""
  const meta = s.pills.length > 0 ? `<span class="zcf-station-meta">${s.meta}</span>` : ""
  // 出站的轨段长在本站头行末尾（名字/计数之后），延伸到下一站灯心——文字区域永远无线
  const seg = nextSeg ? `<span class="zcf-railseg${nextSeg === "faint" ? "" : " " + nextSeg}" aria-hidden="true"></span>` : ""
  const raiseCls = s.track ? ` zcf-raise-${Math.min(s.track, 2)}` : ""
  // 药丸 >5 折叠：前 5 常显 + ＋N 展开片（点击切换 is-collapsed；全计划占位仍在 DOM）
  const many = s.pills.length > 5
  const pillsHtml = s.pills.length ? `<div class="zcf-pills${many ? " is-collapsed" : ""}" role="list">${s.pills.map(pill).join("")}${many ? `<button type="button" class="zcf-pillmore" aria-expanded="false"><span class="t-more">＋${s.pills.length - 5}</span><span class="t-less">收起</span></button>` : ""}</div>` : ""
  return `<div class="zcf-station${visitedCls}${raiseCls}" data-station-status="${cls}">
    <span class="zcf-lamp${cls === "running" ? " is-ongoing" : ""}">${stateDot(LAMP_STATE[cls] ?? "idle")}</span>
    <div class="zcf-station-head"><span class="zcf-station-name" title="${escapeHtml(s.title)}">${escapeHtml(s.title)}</span>${meta}${seg}</div>
    ${pillsHtml}
  </div>`
}

function head(m) {
  // ZCode 形态：种类词内嵌状态；紧凑模式（无站点）只留身份（图标+名），状态交给运行卡
  const hasStations = (m.stations?.length ?? 0) > 0
  const runLamp = m.status === "running" ? "running" : m.status === "completed" ? "done" : m.status === "errored" ? "failed" : "pending"
  const agents = m.status === "running" ? `${m.agentsRunning} 个子代理工作中` : `${m.agentsTotal} 个子代理`
  const detail = hasStations ? `${m.phaseCount} 个阶段 · ${agents}` : ""
  const kind = hasStations ? `工作流${escapeHtml(m.word)}` : "工作流"
  return `<div class="zcf-head">
    ${ICON_PLAN}
    <span class="zcf-kind${hasStations && m.status === "running" ? " is-running" : ""}">${kind}</span>
    <span class="zcf-name">${escapeHtml(m.name)}</span>
    <span class="zcf-detail">
      ${detail ? `<span>${detail}</span>` : ""}
      ${hasStations ? `<span class="zcf-runlamp">${stateDot(LAMP_STATE[runLamp] ?? "idle")}</span>` : ""}
    </span>
  </div>`
}

function renderTimelineHTML(m) {
  // 无站点 → ZCode 工具行式一行摘要（不画空轨道）
  if (!m.stations || m.stations.length === 0) {
    return `<div class="zcf-root"><div class="zcf-card zcf-compact">${head(m)}</div></div>`
  }
  const maxT = m.maxTrack || 0
  // 空气层：弧最低道再留 12px 灯半径余量（报告 §3.5 行布局的 air 简化版）
  const air = m.arcLanes > 0 ? 42 + 14 * (m.arcLanes - 1) : 0
  const stripStyle = ` style="--zcf-raise:${maxT * 44}px${air ? `;--zcf-air:${air}px` : ""}"`
  // 轨心 y（strip 坐标）：空气 + 抬升 − 轨道偏移 + 灯心 12
  const railY = (i) => air + maxT * 44 - 44 * (m.stations[i].track ?? 0) + 12
  // ── 弧 SVG（报告 §4.2：8px 圆角拐点 + 箭头 marker；pointer-events-none 防吞悬停）──
  let arcSvg = ""
  if (Array.isArray(m.arcs) && m.arcs.length > 0) {
    const W = m.stations.length * 192 - 24 + 8
    const laneY = (k) => air + maxT * 44 - 26 - 14 * k // 弧道：最低道离轨心 26（ARC_BASE），道距 14（ARC_LANE）
    const paths = m.arcs.map((a) => {
      const xa = a.from * 192 + 17, xb = a.to * 192 + 17
      const ya = railY(a.from) - 7, yb = railY(a.to) - 9 // 起飞 = 源行 −7，落地 = 目标行 −9
      const ly = laneY(a.lane)
      const s1 = xb > xa ? 8 : -8
      const d = `M ${xa} ${ya} V ${ly + 8} Q ${xa} ${ly} ${xa + s1} ${ly} H ${xb - s1} Q ${xb} ${ly} ${xb} ${ly + 8} V ${yb}`
      return `<path class="zcf-arc-ink ${a.ink}" marker-end="url(#zcf-mk-${a.ink})" d="${d}"/>`
    }).join("")
    const mk = (id) => `<marker id="zcf-mk-${id}" viewBox="0 0 8 8" markerWidth="6" markerHeight="6" refX="7" refY="4" orient="auto-start-reverse"><path class="zcf-arc-mk ${id}" d="M0,0.5 L7,4 L0,7.5 Z"/></marker>`
    arcSvg = `<svg class="zcf-arcs-svg" width="${W}" height="${air + maxT * 44 + 160}" viewBox="0 0 ${W} ${air + maxT * 44 + 160}" fill="none" aria-hidden="true"><defs>${mk("faint")}${mk("strong")}${mk("march")}</defs>${paths}</svg>`
  }
  // 并行带 fork/merge SVG（报告 §3.3/§4.2：fork 站左 -16、merge 下站左 -10、轨距 44；拐点 6px 圆角）
  let svgs = ""
  if (maxT > 0 && Array.isArray(m.bands)) {
    const y0 = 12
    const oy = maxT * 44 + 2
    for (const b of m.bands) {
      const ox = Math.max(4, b.lo * 192 - 16) - 2
      const joinX = (b.hi + 1) * 192 - 10
      const paths = []
      for (let i = b.lo; i <= b.hi; i++) {
        const s = m.stations[i]
        const t = s.track ?? 0
        if (t === 0) continue
        const lampX = i * 192 + 17
        const y = 12 - 44 * t + oy
        const yy = y0 + oy
        const inkCls = s.status === "running" ? "march" : s.visited ? "strong" : ""
        const fx = Math.max(4, b.lo * 192 - 16) - ox
        // fork：竖上 → 6px 圆角 → 横到灯
        paths.push(`<path class="zcf-band-ink ${inkCls}" d="M ${fx} ${yy} L ${fx} ${y + 6} Q ${fx} ${y} ${fx + 6} ${y} L ${lampX - 4 - ox} ${y}" fill="none"/>`)
        // merge：横出 → 6px 圆角 → 竖下汇入主线
        paths.push(`<path class="zcf-band-ink ${inkCls}" d="M ${i * 192 + 168 - ox} ${y} L ${joinX - ox - 6} ${y} Q ${joinX - ox} ${y} ${joinX - ox} ${y + 6} L ${joinX - ox} ${yy}" fill="none"/>`)
      }
      svgs += `<svg class="zcf-band-svg" style="left:${ox}px;top:-${oy}px;width:${joinX - ox + 4}px;height:${oy + 16}px" viewBox="0 0 ${joinX - ox + 4} ${oy + 16}" fill="none" aria-hidden="true">${paths.join("")}</svg>`
    }
  }
  return `<div class="zcf-root"><div class="zcf-card">${head(m)}<div class="zcf-plot"><div class="zcf-strip"${stripStyle}>
    ${arcSvg}
    ${svgs}
    ${m.stations.map((s, i) => station(s, i, m.stations[i + 1]?.seg)).join("")}
  </div></div></div></div>`
}


    // ── meta store：工具行（隐形）把脚本 meta 存这里，运行卡订阅消费 ──
    const metaStore = { byName: new Map(), listeners: new Set() }
    function stashMeta(name, meta) {
      if (!name || !meta) return
      metaStore.byName.set(name, meta)
      metaStore.listeners.forEach((f) => { try { f() } catch {} })
    }
    function metaFor(name) { return metaStore.byName.get(name) ?? null }

    function WorkflowRunTimeline(props) {
      const node = props?.node
      const [tick, setTick] = useState(0)
      const rootRef = useRef(null)
      useEffect(() => {
        const bump = () => setTick((x) => x + 1)
        metaStore.listeners.add(bump)
        return () => metaStore.listeners.delete(bump)
      }, [])
      // 药丸折叠片：根节点上挂一次点击委托（innerHTML 重渲染不丢监听）
      useEffect(() => {
        const root = rootRef.current
        if (!root || !root.addEventListener) return
        const onClick = (e) => {
          const b = e.target && e.target.closest ? e.target.closest(".zcf-pillmore") : null
          if (!b) return
          const wrap = b.closest(".zcf-pills")
          if (!wrap) return
          const collapsed = wrap.classList.toggle("is-collapsed")
          b.setAttribute("aria-expanded", collapsed ? "false" : "true")
        }
        root.addEventListener("click", onClick)
        return () => root.removeEventListener("click", onClick)
      }, [])
      // 换行接线：实测每站所在行，行尾站延伸到卡内容右缘 + 下折箭头；行首站从卡内容左缘引入
      useEffect(() => {
        const root = rootRef.current
        if (!root) return
        const strip = root.querySelector(".zcf-strip")
        if (!strip) return
        const measure = () => {
          const stations = [...strip.querySelectorAll(":scope > .zcf-station")]
          let prevTop = null
          stations.forEach((st) => {
            st.classList.remove("zcf-rowend", "zcf-rowstart")
            st.style.removeProperty("--zcf-rowext")
            st.style.removeProperty("--zcf-rowpre")
            st.style.removeProperty("--zcf-rowpre-ml")
            const top = st.offsetTop
            const next = stations[stations.indexOf(st) + 1]
            const isEnd = next ? next.offsetTop !== top : false
            const isStart = prevTop !== null && prevTop !== top
            if (isEnd) {
              st.classList.add("zcf-rowend")
              const extra = Math.max(0, strip.clientWidth - (st.offsetLeft + st.offsetWidth) - 2)
              st.style.setProperty("--zcf-rowext", extra + "px")
            }
            if (isStart) {
              st.classList.add("zcf-rowstart")
              const lampX = st.offsetLeft + 17
              st.style.setProperty("--zcf-rowpre", Math.max(0, lampX - 4) + "px")
              st.style.setProperty("--zcf-rowpre-ml", -(st.offsetLeft - 2) + "px")
            }
            prevTop = top
          })
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(strip)
        return () => ro.disconnect()
      }, [props?.node, tick])
      const [err, setErr] = useState(null)
      const model = useMemo(() => {
        try {
          return { ok: true, m: modelFromRunNode(node, metaFor(node?.data?.name)) }
        } catch (e) {
          return { ok: false, m: { name: node?.data?.name ?? "?", status: "pending", word: "", tone: "pending", stations: [], progress: null, phaseCount: 0, agentsTotal: 0, agentsRunning: 0, maxTrack: 0, bands: [] }, err: String(e) }
        }
      }, [node, tick])
      if (model.ok === false) {
        return h("div", { style: { padding: "6px 10px", fontSize: "12px", color: "var(--color-foreground-subtle)" } }, "workflow-ui 渲染降级: " + (model.err ?? "?"))
      }
      return h("div", { ref: rootRef, dangerouslySetInnerHTML: { __html: renderTimelineHTML(model.m) } })
    }

    // 工具行 = 隐形数据源：显示空标记（CSS :has 隐藏整行），挂载时解析 argsRaw 并 stash。
    // 流式期整包 JSON 未写完 → 部分解析（正则抽 name/phases，边写边补站 = ZCode 草稿笔行为）；dispatch 完成后整包复扫定格全量计划。
    function partialMeta(raw) {
      if (typeof raw !== "string") return null
      const name = raw.match(/"name"\s*:\s*"([^"]+)"/)?.[1]
      if (!name) return null
      const seg = raw.match(/"phases"\s*:\s*\[([\s\S]*?)(?:\]|$)/)?.[1] ?? ""
      const phases = []
      for (const mm of seg.matchAll(/"title"\s*:\s*"([^"]+)"/g)) phases.push({ title: mm[1] })
      return { name, phases }
    }
    function WorkflowToolRow(props) {
      const p = props ?? {}
      const raw = p.argsRaw ?? p.call?.argsRaw ?? p.block?.argsRaw ?? p.block?.call?.argsRaw ?? p.input?.argsRaw ?? p.block?.input?.argsRaw ?? null
      useEffect(() => {
        try {
          let input = null
          let srcField = "none"
          try { input = typeof raw === "string" ? JSON.parse(raw) : raw; if (raw != null) srcField = "parsed-raw" } catch { input = null }
          let meta = input && typeof input === "object" ? input.meta : null
          let script = input && typeof input === "object" && typeof input.script === "string" ? input.script : ""
          if ((!meta || !meta.name) && typeof raw === "string") {
            const pm = partialMeta(raw)
            if (pm) { meta = pm; script = raw; srcField = "partial" } // 流式半截：整段 raw 当脚本扫（phase 引用可见即可）
          }
          if (meta && typeof meta === "object" && meta.name) {
            const scan = scanScript(script)
            const phases = scan.order.length ? scan.order.map((t) => ({ title: t })) : Array.isArray(meta.phases) ? meta.phases : []
            stashMeta(meta.name, { phases, alongside: scan.groups, agents: scan.agents, edges: scan.edges })
          }
        } catch { /* 静默：运行卡退化为投影序 */ }
      }, [raw])
      return h("div", { className: "zcf-toolview-empty" })
    }

    // 注册（契约：同 key priority 最低者渲染；官方默认 0）
    const CHAT_NODE_SLOT = "conversation.chat.node"
    const TOOLVIEW_SLOT = "tool.call.toolview"

    return {
      inject: ["slots"],
      apply(t) {
        ensureStyles(typeof document !== "undefined" ? document : null)
        const slots = t?.get?.("slots")
        if (!slots) return
        slots.inject(CHAT_NODE_SLOT, () =>
          slots.register({ name: CHAT_NODE_SLOT, id: "workflow-ui-run", key: "workflow-run", priority: -1 }, WorkflowRunTimeline),
        )
        slots.inject(TOOLVIEW_SLOT, () =>
          slots.register({ name: TOOLVIEW_SLOT, id: "workflow-ui-tool", key: "workflow", priority: -1 }, WorkflowToolRow),
        )
      },
      __test: { buildTimeline, modelFromRunNode, modelFromToolCall, renderTimelineHTML, stashMeta, metaFor, scanScript },
    }
  },
})
