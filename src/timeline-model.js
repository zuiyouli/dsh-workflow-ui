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

export function normRunStatus(s) {
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
export function modelFromRunNode(node, declared) {
  const d = node?.data ?? {}
  const proj = []
  for (const ph of Array.isArray(d.phases) ? d.phases : []) {
    for (const mm of Array.isArray(ph.members) ? ph.members : []) {
      proj.push({ label: mm.label, phase: ph.phase ?? "未分阶段", status: mm.status, childId: mm.childId ?? null })
    }
  }
  const declaredAgents = Array.isArray(declared?.agents) ? declared.agents : []
  const declaredPhases = Array.isArray(declared?.phases) ? declared.phases : []
  const alongside = Array.isArray(declared?.alongside) ? declared.alongside : []
  const statusByKey = new Map(proj.map((p) => [p.phase + "|" + p.label, p]))
  let agents
  if (declaredAgents.length > 0) {
    const used = new Set()
    agents = declaredAgents.map((da) => {
      const key = da.phase + "|" + da.label
      const p = statusByKey.get(key)
      const status = p ? p.status : "pending"
      if (p) used.add(key)
      return { label: da.label, phase: da.phase, status, childId: p?.childId ?? null }
    })
    for (const p of proj) {
      const key = p.phase + "|" + p.label
      if (!used.has(key)) agents.push({ label: p.label, phase: p.phase, status: p.status, childId: p.childId ?? null })
    }
  } else {
    agents = proj
  }
  return buildTimeline({ name: d.name, phases: declaredPhases, alongside, edges: Array.isArray(declared?.edges) ? declared.edges : [] }, { status: d.status, agents })
}

/** workflow 工具调用 owner（tool.call.toolview）→ 时间线模型（argsRaw.meta.phases 静态阶段；解析失败降级为一行摘要） */
export function modelFromToolCall(props) {
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
export function buildTimeline(meta, run = {}) {
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
      return { label: a.label ?? "agent", status: st, avatar: faceSeq++ % 9, settled, childId: a.childId ?? null }
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
  // 回边目标站标记：换行模式下弧不可见，用徽标提示“此阶段会被后序回访”
  for (const a of arcs) if (a.loop) stations[a.to].loopTarget = true
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
