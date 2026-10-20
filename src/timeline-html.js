// ZCode 风格时间线 · HTML 字符串渲染面
// 九色脸（FACE_COLORS）+ 尾槽标记 + 站头 mono 元数据，规格见提取报告 §4.2/§4.3/§4.4
// 布局常量对齐 ZCode：PAD 8 / 站宽 168 / PITCH 192 / 灯心 +17；轨道只画到最后一站（无拖尾）

export const FACE_COLORS = ["#54B9A6", "#F19D38", "#6464EF", "#885CF5", "#3C82F6", "#ED712E", "#EB4699", "#5BC67A", "#EA4045"]

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

export function escapeHtml(x) {
  return String(x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])
}

function pill(p, i) {
  const mark =
    p.status === "running" ? `<span class="zcf-pillmark is-running" role="img" aria-label="运行中">${stateDot("ongoing")}</span>`
    : p.status === "done" ? ICON_CHECK
    : p.status === "failed" ? `<span class="zcf-pillmark is-failed">${ICON_CLOSE}</span>`
    : ""
  const st = p.status === "pending" ? "" : ` is-${p.status}`
  // 有子会话的药丸可点击跳转（childId 来自官方投影成员）
  const linkAttrs = p.childId ? ` is-link" data-child="${escapeHtml(p.childId)}" tabindex="0" title="打开子会话` : ""
  return `<span class="zcf-pill${st}${p.settled ? " is-settled" : ""}${linkAttrs}" role="listitem" style="--zcf-d:${i * 30}ms;--wf-avatar:${FACE_COLORS[p.avatar % 9]}">
    <span class="zcf-avatar" aria-hidden="true"></span>
    <span class="zcf-pillname">${escapeHtml(p.label)}</span>
    <span class="zcf-pillmark">${mark}</span>
  </span>`
}

function station(s, i, nextSeg, expandedSet) {
  const cls = s.status === "running" ? "running" : s.status === "done" ? "done" : s.status === "failed" ? "failed" : "pending"
  const visitedCls = s.visited ? " is-visited" : ""
  const meta = s.pills.length > 0 ? `<span class="zcf-station-meta">${s.meta}</span>` : ""
  // 出站的轨段长在本站头行末尾（名字/计数之后），延伸到下一站灯心——文字区域永远无线
  const seg = nextSeg ? `<span class="zcf-railseg${nextSeg === "faint" ? "" : " " + nextSeg}" aria-hidden="true"></span>` : ""
  const raiseCls = s.track ? ` zcf-raise-${Math.min(s.track, 2)}` : ""
  // 药丸 >5 折叠：前 5 常显 + ＋N 展开片（展开态按站名跨重渲染保留；隐藏药丸里有 running 时呼吸提示）
  const many = s.pills.length > 5
  const collapsed = many && !(expandedSet && expandedSet.has(s.title))
  const live = collapsed && s.pills.slice(5).some((p) => p.status === "running")
  const pillsHtml = s.pills.length
    ? `<div class="zcf-pills${collapsed ? " is-collapsed" : ""}" data-station="${escapeHtml(s.title)}" role="list">${s.pills.map(pill).join("")}${many ? `<button type="button" class="zcf-pillmore" aria-expanded="${collapsed ? "false" : "true"}"><span class="t-more">＋${s.pills.length - 5}</span><span class="t-less">收起</span>${live ? `<span class="zcf-chip-live" aria-hidden="true"></span>` : ""}</button>` : ""}</div>`
    : ""
  return `<div class="zcf-station${visitedCls}${raiseCls}" data-station-status="${cls}">
    <span class="zcf-lamp${cls === "running" ? " is-ongoing" : ""}">${stateDot(LAMP_STATE[cls] ?? "idle")}</span>
    <div class="zcf-station-head"><span class="zcf-station-name" title="${escapeHtml(s.title)}">${escapeHtml(s.title)}</span>${meta}${s.loopTarget ? `<span class="zcf-loop-badge" title="后序阶段回访此阶段">↩</span>` : ""}${seg}</div>
    ${pillsHtml}
  </div>`
}

function head(m) {
  // ZCode 形态：种类词内嵌状态；紧凑模式（无站点）只留身份（图标+名），状态交给运行卡
  const hasStations = (m.stations?.length ?? 0) > 0
  const runLamp = m.status === "running" ? "running" : m.status === "completed" ? "done" : m.status === "errored" ? "failed" : "pending"
  const prog = m.progress ? `${m.progress.settled}/${m.progress.total}` : `${m.agentsTotal}`
  const agents = m.status === "running" ? `${prog} 子代理 · ${m.agentsRunning} 工作中` : `${m.agentsTotal} 个子代理`
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

export function renderTimelineHTML(m, opts = {}) {
  // 无站点 → ZCode 工具行式一行摘要（不画空轨道）
  if (!m.stations || m.stations.length === 0) {
    return `<div class="zcf-root"><div class="zcf-card zcf-compact">${head(m)}</div></div>`
  }
  const maxT = m.maxTrack || 0
  // 空气层：弧最低道再留 12px 灯半径余量（报告 §3.5 行布局的 air 简化版）
  const air = m.arcLanes > 0 ? 42 + 14 * (m.arcLanes - 1) : 0
  const stripStyle = ` style="--zcf-raise:${maxT * 44}px${air ? `;--zcf-air:${air}px` : ""}" data-arcs="${escapeHtml(JSON.stringify(m.arcs ?? []))}"`
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
    <svg class="zcf-arcs-wrap" fill="none" aria-hidden="true"></svg>
    ${svgs}
    ${m.stations.map((s, i) => station(s, i, m.stations[i + 1]?.seg, opts.expanded)).join("")}
  </div></div></div></div>`
}

/** 正交折线路径 + 圆角拐点（pts 为轴对齐路标点序列） */
export function orthPath(pts, r = 6) {
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length - 1; i++) {
    const px = pts[i - 1][0], py = pts[i - 1][1]
    const cx = pts[i][0], cy = pts[i][1]
    const nx = pts[i + 1][0], ny = pts[i + 1][1]
    const d1x = Math.sign(cx - px), d1y = Math.sign(cy - py)
    const d2x = Math.sign(nx - cx), d2y = Math.sign(ny - cy)
    const len1 = Math.abs(cx - px) + Math.abs(cy - py)
    const len2 = Math.abs(nx - cx) + Math.abs(ny - cy)
    const rr = Math.max(0, Math.min(r, len1 / 2, len2 / 2))
    d += ` L ${cx - d1x * rr} ${cy - d1y * rr} Q ${cx} ${cy} ${cx + d2x * rr} ${cy + d2y * rr}`
  }
  const last = pts[pts.length - 1]
  return d + ` L ${last[0]} ${last[1]}`
}

/** 弧层布局总控：宽屏 = 静态层（CSS 管），交还样式表；窄屏单排 = 静态层 + air/raise 内联 padding；
 *  窄屏多排 = 动态边缘走廊层。stationEls 按模型顺序。 */
export function layoutArcLayers(strip, stationEls, m) {
  const wrapSvg = strip.querySelector(":scope > .zcf-arcs-wrap")
  const staticSvg = strip.querySelector(":scope > .zcf-arcs-svg")
  if (!wrapSvg || !staticSvg) return
  const arcs = m && Array.isArray(m.arcs) ? m.arcs : []
  const card = strip.closest(".zcf-card")
  const wide = ((card?.clientWidth ?? 9999) - 28) >= 920
  if (wide) { // 交给样式表（容器查询 ≥920 显示静态层、隐藏动态层）
    wrapSvg.style.display = "none"
    staticSvg.style.display = ""
    strip.style.paddingTop = ""
    return
  }
  const multi = stationEls.length > 1 && stationEls.some((st) => st.offsetTop !== stationEls[0].offsetTop)
  if (multi) { // 动态边缘走廊
    staticSvg.style.display = "none"
    strip.style.paddingTop = "30px" // 行 0 上方的走廊空气（RO 幂等重测）
    const W = strip.clientWidth, H = strip.offsetHeight
    const trackOf = (st) => { const mm = /zcf-raise-(\d)/.exec(st.className); return mm ? +mm[1] : 0 }
    const pos = stationEls.map((st) => { const t = trackOf(st); return { x: st.offsetLeft + 17, y: st.offsetTop + 12 - 44 * t, top: st.offsetTop - 44 * t } })
    let defs = "<defs>" + ["faint", "strong", "march"].map((k) => `<marker id="zcf-wmk-${k}" viewBox="0 0 8 8" markerWidth="6" markerHeight="6" refX="7" refY="4" orient="auto-start-reverse"><path class="zcf-arc-mk ${k}" d="M0,0.5 L7,4 L0,7.5 Z"/></marker>`).join("") + "</defs>"
    const paths = []
    for (const a of arcs) {
      const p1 = pos[a.from], p2 = pos[a.to]
      let d
      if (p1.top === p2.top) {
        const ly = p1.top - 26 - 14 * a.lane
        d = orthPath([[p1.x, p1.y - 5], [p1.x, ly], [p2.x, ly], [p2.x, p2.y - 5]], 8)
      } else {
        const edgeX = a.loop ? 4 + 5 * a.lane : W - 4 - 5 * a.lane // 干线走预留的 18px 外带
        d = orthPath(
          [[p1.x, p1.y - 5], [p1.x, rowTop(a.from) - 16], [edgeX, rowTop(a.from) - 16], [edgeX, rowTop(a.to) - 16], [p2.x, rowTop(a.to) - 16], [p2.x, p2.y - 5]],
          6,
        )
      }
      paths.push(`<path class="zcf-arc-ink ${a.ink}" marker-end="url(#zcf-wmk-${a.ink})" d="${d}"/>`)
    }
    function rowTop(i) { return pos[i].top }
    wrapSvg.setAttribute("width", W)
    wrapSvg.setAttribute("height", H)
    wrapSvg.setAttribute("viewBox", `0 0 ${W} ${H}`)
    wrapSvg.innerHTML = defs + paths.join("")
    wrapSvg.style.display = "block"
    return
  }
  // 窄屏单排：静态层几何依旧成立，补上 air/raise 内联 padding
  if (arcs.length > 0) {
    const airPx = m.arcLanes > 0 ? 42 + 14 * (m.arcLanes - 1) : 0
    staticSvg.style.display = "block"
    wrapSvg.style.display = "none"
    strip.style.paddingTop = (airPx + (m.maxTrack || 0) * 44) + "px"
  } else {
    staticSvg.style.display = ""
    wrapSvg.style.display = "none"
    strip.style.paddingTop = ""
  }
}
