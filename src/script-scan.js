// 脚本静态扫描：从 workflow 脚本文本提取阶段序、alongside 组（parallel 块）、顺序边
// 对齐 ZCode 管线：analyzer → causalityGraph（只是搬到客户端、按需精简）

export function scanScript(script) {
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
