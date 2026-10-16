// smoke.mjs — dsh-workflow-ui 渲染冒烟测试（假 ModuleLoader + 假 slots/react）
globalThis.window = {
  __ModuleLoader__: {
    load(def) {
      globalThis.__zcf = def.factory((n) => (n === "react" ? {
        createElement: () => ({}),
        useMemo: (f) => f(),
        useState: (v) => [v, () => {}],
        useEffect: (f) => { f() }, // 真正执行 effects（上次漏了导致 stash bug 溜过冒烟）
      } : null))
    },
  },
}
await import(new URL("../lib/client.js", import.meta.url).href)
const t = globalThis.__zcf.__test

// 1) 工具行降级：紧凑一行 + 名字从结果文本兜底
const c = t.renderTimelineHTML(t.modelFromToolCall({ phase: "result", isError: false, content: 'workflow "demo-x" completed (2 agents).' }))
console.log("compact:", c.includes("zcf-compact") && !c.includes("zcf-railseg"), "| name:", (c.match(/zcf-name">([^<]*)</) || [])[1])

// 2) 两站三药丸（运行中）：头部形态 + 轨段墨
const m = t.buildTimeline(
  { name: "d2", phases: [{ title: "侦察" }, { title: "汇总" }] },
  { status: "running", activePhase: "汇总", agents: [
    { label: "a", phase: "侦察", status: "done" },
    { label: "b", phase: "侦察", status: "done" },
    { label: "c", phase: "汇总", status: "running" },
  ] },
)
const h = t.renderTimelineHTML(m)
console.log("kind:", (h.match(/zcf-kind[^>]*>([^<]*)</) || [])[1], "| detail:", (h.match(/zcf-detail">\s*<span>([^<]*)</) || [])[1])
console.log("railseg:", h.includes('zcf-railseg march'), "| no global rail:", !h.includes('zcf-rail"'), "| meta 2/2:", h.includes("2/2"))

// 3) run 节点投影：中断态
const m3 = t.modelFromRunNode({ data: { name: "x", status: "interrupted", phases: [{ phase: "A", members: [{ label: "a", status: "running" }] }] } })
console.log("interrupted:", m3.status, m3.word, "| station:", m3.stations[0].status)

// 4) meta store 管线：stash（含计划药丸 + 边）→ metaFor → 带分配 + 占位药丸 + 回边弧
t.stashMeta("stashed", {
  phases: [{ title: "需求澄清" }, { title: "方案-解析" }, { title: "方案-容错" }, { title: "编码实现" }],
  alongside: [["方案-解析", "方案-容错"]],
  edges: [["需求澄清", "方案-解析"], ["方案-容错", "编码实现"], ["编码实现", "需求澄清"]],
  agents: [
    { label: "需求澄清员", phase: "需求澄清" },
    { label: "方案-解析", phase: "方案-解析" },
    { label: "方案-容错", phase: "方案-容错" },
    { label: "编码员", phase: "编码实现" },
  ],
})
const m4 = t.modelFromRunNode(
  { data: { name: "stashed", status: "running", phases: [
    { phase: "需求澄清", members: [{ label: "需求澄清员", status: "completed" }] },
    { phase: "方案-解析", members: [{ label: "方案-解析", status: "completed" }] },
    { phase: "方案-容错", members: [{ label: "方案-容错", status: "running" }] },
  ] } },
  t.metaFor("stashed"),
)
console.log("stashed: maxTrack:", m4.maxTrack, "| bands:", JSON.stringify(m4.bands), "| tracks:", m4.stations.map((s) => s.title + ":t" + (s.track ?? 0) + "(" + s.pills.map((p) => p.status).join("/") + ")").join(","))
console.log("planned placeholder 编码员 pending:", m4.stations[3].pills[0]?.status === "pending")
const h4 = t.renderTimelineHTML(m4)
console.log("band svg:", h4.includes("zcf-band-svg"), "| raised cls:", h4.includes("zcf-raise-1"), "| march ink:", h4.includes("zcf-band-ink march"))
console.log("loop arc:", m4.arcs.length === 1 && m4.arcs[0].loop && m4.arcs[0].from === 3 && m4.arcs[0].to === 0, "| arc svg:", h4.includes("zcf-arc-ink"), "| mk:", h4.includes("zcf-mk-"))

// 5) 弧道分配：跨度短者低道，闭区间相交上推（A→C 与 B→D 相交；E→A 回边最长最高）
const m5 = t.buildTimeline(
  { name: "d5", phases: [{ title: "A" }, { title: "B" }, { title: "C" }, { title: "D" }, { title: "E" }], edges: [["A", "C"], ["B", "D"], ["E", "A"]] },
  { status: "pending", agents: [] },
)
console.log("lanes:", m5.arcs.map((a) => a.from + ">" + a.to + ":L" + a.lane + (a.loop ? "(loop)" : "")).join(" "), "| arcLanes:", m5.arcLanes)

// 6) scanScript：串行 2 phase + parallel 内 2 phase（alongside 组 + 边不连组内）
const script = "phase('A')\nconst x = await parallel([\n  () => agent('1', { label: 'a', phase: 'B' }),\n  () => agent('2', { label: 'b', phase: 'C' }),\n])\nphase('D')"
const scan = t.scanScript(script)
console.log("scan order:", scan.order.join(","), "| groups:", JSON.stringify(scan.groups), "| edges:", JSON.stringify(scan.edges))

// 7) 药丸折叠：同站 >5 药丸 → is-collapsed + ＋N 展开片
const m7 = t.buildTimeline(
  { name: "d7", phases: [{ title: "并行深挖" }, { title: "综合" }] },
  { status: "running", activePhase: "并行深挖", agents: ["A", "B", "C", "D", "E", "F", "G", "H"].map((L, i2) => ({ label: L + " 任务", phase: "并行深挖", status: i2 < 6 ? "done" : i2 === 6 ? "running" : "pending" })) },
)
const h7 = t.renderTimelineHTML(m7)
console.log("collapse:", h7.includes("zcf-pills is-collapsed"), "| chip ＋3:", h7.includes("＋3"), "| t-less:", h7.includes("t-less"))
console.log("DONE")
