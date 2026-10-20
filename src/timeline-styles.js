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
/* 0.2.1+：运行中的流程头（“正在调用工具 · workflow”）是独立 turn-process 节点，不在 callRow 内——
   按 turn 容器联合隐藏（仅限含 workflow 调用的 turn，其它工具的流程行不受影响） */
[data-chat-turn]:has(.zcf-toolview-empty) [data-chat-flow-kind="turn-process"] { display: none !important; }
.zcf-card { container: zcf / inline-size; display: flex; flex-direction: column; gap: 4px; border: 1px solid color-mix(in oklab, var(--color-border) 70%, transparent); border-radius: 12px; background: color-mix(in oklab, var(--color-card) 70%, transparent); padding: 6px 14px 8px; }
.zcf-compact { padding: 9px 14px; }
.zcf-head { display: flex; align-items: center; gap: 8px; min-width: 0; }
.zcf-head-icon { width: 14px; height: 14px; flex: none; color: var(--color-foreground-subtle); }
.zcf-kind { font-weight: 500; flex: none; }
.zcf-kind.is-running { color: var(--color-warning); }
.zcf-name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.zcf-detail { margin-left: auto; display: flex; align-items: center; gap: 8px; min-width: 0; font-variant-numeric: tabular-nums; color: var(--color-foreground-subtlest); white-space: nowrap; }
.zcf-runlamp { display: inline-flex; align-items: center; flex: none; }
/* ── v0.3.0 完成态折叠：摘要 + 折叠按钮 ── */
.zcf-fold { appearance: none; border: none; background: transparent; color: var(--color-foreground-subtle); width: 24px; height: 24px; margin-left: 2px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; flex: none; }
.zcf-fold:hover { background: color-mix(in oklab, var(--color-foreground) 8%, transparent); color: var(--color-foreground); }
.zcf-fold .zcf-chev { transition: transform 160ms ease; }
.zcf-fold[aria-expanded="true"] .zcf-chev { transform: rotate(180deg); }
.zcf-card.is-folded { padding: 9px 14px; }
.zcf-fail-bits { color: var(--color-destructive); }
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
/* 换行模式动态弧层：JS 测量后填充，仅多排时显示 */
.zcf-arcs-wrap { display: none; position: absolute; left: 0; top: 0; overflow: visible; pointer-events: none; }
.zcf-arcs-wrap path { fill: none; }
@container zcf (min-width: 920px) {
  .zcf-arcs-wrap { display: none !important; }
}
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
.zcf-pill { display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 10px 0 8px; border-radius: 999px; background: var(--color-surface); max-width: 160px; transition: background var(--wf-t-fast) var(--wf-ease); }
/* 入场动画只播一次：zcf-boot 由组件挂载时加上、~1s 后移除——事件流重渲染不重播（防闪烁） */
.zcf-boot .zcf-pill { animation: zcf-arrive var(--wf-t-enter) var(--wf-ease) backwards; animation-delay: var(--zcf-d, 0ms); }
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
/* 折叠片呼吸点：隐藏药丸里有 running 时提示下方有活动 */
.zcf-chip-live { width: 6px; height: 6px; border-radius: 50%; background: var(--color-warning); flex: none; animation: zcf-chip-pulse 1.2s ease-in-out infinite; }
@keyframes zcf-chip-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.35; transform: scale(0.8); } }
/* 药丸 → 子会话跳转（childId 存在时） */
.zcf-pill.is-link { cursor: pointer; }
.zcf-pill.is-link:hover { background: var(--color-surface-hover); border-color: color-mix(in oklab, var(--color-border) 130%, transparent); }
.zcf-pill.is-link:focus-visible { outline: 1px solid var(--color-foreground-subtle); outline-offset: 1px; }
/* 回边目标站徽标：仅换行模式显示（宽屏模式弧线本身可见） */
.zcf-loop-badge { flex: none; margin-left: 2px; padding: 0 3px; border: 1px dashed color-mix(in oklab, var(--color-border) 90%, transparent); border-radius: 4px; font-size: 10px; line-height: 13px; color: var(--color-foreground-subtlest); }
@container zcf (min-width: 920px) {
  .zcf-loop-badge { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .zcf-sd-motion, .zcf-sd-arc, .zcf-kind.is-running,
  .zcf-pill.is-running .zcf-avatar::before, .zcf-pill.is-running .zcf-avatar::after { animation: none; }
  .zcf-sd-arc { stroke-dasharray: 18 150; stroke-dashoffset: -3; }
  .zcf-pill { animation: none; }
  .zcf-root * { transition: none !important; }
}
`
let injected = false
export function ensureStyles(doc) {
  if (injected || !doc) return
  const el = doc.createElement("style")
  el.id = "dsh-workflow-ui-styles"
  el.dataset.plugin = "dsh-workflow-ui"
  el.dataset.pluginCss = "dsh-workflow-ui/styles.css"
  el.textContent = CSS
  doc.head.appendChild(el)
  injected = true
}
export { CSS }
