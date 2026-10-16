// workflow-ui.test.mjs — 模型/扫描/渲染单元测试（node --test，直连 src 纯模块）
import test from "node:test"
import assert from "node:assert/strict"
import { scanScript } from "../src/script-scan.js"
import { buildTimeline, normRunStatus, modelFromRunNode, modelFromToolCall } from "../src/timeline-model.js"
import { renderTimelineHTML } from "../src/timeline-html.js"

test("normRunStatus maps the five run words", () => {
  assert.equal(normRunStatus("running"), "running")
  assert.equal(normRunStatus("completed"), "completed")
  assert.equal(normRunStatus("ok"), "completed")
  assert.equal(normRunStatus("failed"), "errored")
  assert.equal(normRunStatus("cancelled"), "cancelled")
  assert.equal(normRunStatus("interrupted"), "interrupted")
  assert.equal(normRunStatus("stopped"), "stopped")
  assert.equal(normRunStatus(undefined), "pending")
})

test("scanScript: order, alongside groups, cross-group edges", () => {
  const s = scanScript("phase('A')\nconst x = await parallel([\n  () => agent('1', { label: 'a', phase: 'B' }),\n  () => agent('2', { label: 'b', phase: 'C' }),\n])\nphase('D')")
  assert.deepEqual(s.order, ["A", "B", "C", "D"])
  assert.deepEqual(s.groups, [["B", "C"]])
  assert.deepEqual(s.edges, [["A", "B"], ["C", "D"]])
  assert.equal(s.agents.length, 2)
})

test("scanScript: implicit phase inheritance for agents", () => {
  const s = scanScript("phase('X')\nagent('p', { label: 'l1' })")
  assert.deepEqual(s.agents, [{ label: "l1", phase: "X" }])
})

test("station fold: running beats failed; all settled with failed -> failed", () => {
  const m1 = buildTimeline({ name: "t", phases: [{ title: "A" }] }, { status: "running", agents: [
    { label: "a", phase: "A", status: "done" },
    { label: "b", phase: "A", status: "failed" },
    { label: "c", phase: "A", status: "running" },
  ] })
  assert.equal(m1.stations[0].status, "running")
  const m2 = buildTimeline({ name: "t", phases: [{ title: "A" }] }, { status: "completed", agents: [
    { label: "a", phase: "A", status: "done" },
    { label: "b", phase: "A", status: "failed" },
  ] })
  assert.equal(m2.stations[0].status, "failed")
})

test("alongside band: raised track, band range, planned placeholder stays pending", () => {
  const declared = {
    phases: [{ title: "需求澄清" }, { title: "方案-解析" }, { title: "方案-容错" }, { title: "编码实现" }],
    alongside: [["方案-解析", "方案-容错"]],
    agents: [
      { label: "需求澄清员", phase: "需求澄清" },
      { label: "方案-解析", phase: "方案-解析" },
      { label: "方案-容错", phase: "方案-容错" },
      { label: "编码员", phase: "编码实现" },
    ],
  }
  const m = modelFromRunNode({ data: { name: "t", status: "running", phases: [
    { phase: "需求澄清", members: [{ label: "需求澄清员", status: "completed", childId: "sess-abc" }] },
    { phase: "方案-解析", members: [{ label: "方案-解析", status: "completed" }] },
    { phase: "方案-容错", members: [{ label: "方案-容错", status: "running" }] },
  ] } }, declared)
  assert.equal(m.maxTrack, 1)
  assert.deepEqual(m.bands, [{ lo: 1, hi: 2 }])
  assert.equal(m.stations[3].pills[0]?.status, "pending") // 编码实现未启动 → 计划占位
  assert.equal(m.stations[0].pills[0]?.childId, "sess-abc") // childId 透传（子会话跳转）
  const h = renderTimelineHTML(m)
  assert.ok(h.includes('data-child="sess-abc"'))
  assert.ok(h.includes("zcf-pill is-link"))

test("arcs: adjacent edges skipped, loop arc flagged, lanes pushed up on overlap", () => {
  const m = buildTimeline(
    { name: "t", phases: ["A", "B", "C", "D", "E"].map((t) => ({ title: t })), edges: [["A", "C"], ["B", "D"], ["E", "A"]] },
    { status: "pending", agents: [] },
  )
  assert.deepEqual(m.arcs.map((a) => [a.from, a.to, a.lane, a.loop]), [[0, 2, 0, false], [1, 3, 1, false], [4, 0, 2, true]])
  assert.equal(m.arcLanes, 3)
})

test("render: header form, DSH StateDot spinner, march railseg", () => {
  const m = buildTimeline({ name: "d2", phases: [{ title: "侦察" }, { title: "汇总" }] }, { status: "running", activePhase: "汇总", agents: [
    { label: "a", phase: "侦察", status: "done" },
    { label: "c", phase: "汇总", status: "running" },
  ] })
  const h = renderTimelineHTML(m)
  assert.match(h, /zcf-kind[^>]*>工作流运行中</)
  assert.match(h, /zcf-detail">\s*<span>2 个阶段 · 1\/2 子代理 · 1 工作中</)
  assert.ok(h.includes("zcf-railseg march"))
  assert.ok(h.includes("zcf-sd-spinner")) // running 灯 = DSH spinner 弧
  assert.ok(h.includes('data-state="done"'))
  assert.ok(!h.includes('zcf-rail"')) // 无全局拖尾轨
})

test("render: loop arc svg with marker, 6px rounded band join", () => {
  const m = modelFromRunNode({ data: { name: "t", status: "running", phases: [
    { phase: "侦察", members: [{ label: "a", status: "completed" }] },
    { phase: "评审", members: [{ label: "b", status: "running" }] },
  ] } }, {
    phases: [{ title: "侦察" }, { title: "实现" }, { title: "评审" }, { title: "修复" }],
    edges: [["侦察", "实现"], ["实现", "评审"], ["评审", "修复"], ["修复", "侦察"], ["侦察", "评审"]],
    agents: [],
  })
  const h = renderTimelineHTML(m)
  assert.ok(h.includes("zcf-arcs-svg"))
  assert.ok(h.includes("zcf-arc-ink march")) // 侦察→评审 落 running 站
  assert.ok(h.includes("zcf-mk-")) // marker defs
  assert.match(h, /Q \d+ \d+ \d+ \d+/) // 圆角拐点（Q 曲线）
  assert.equal(m.stations[0].loopTarget, true) // 回边目标站 → 徽标（换行模式提示）
  assert.ok(h.includes("zcf-loop-badge"))
})

test("pill overflow: >5 pills collapse behind a +N chip", () => {
  const m = buildTimeline({ name: "d7", phases: [{ title: "并行深挖" }] }, { status: "running", agents:
    ["A", "B", "C", "D", "E", "F", "G", "H"].map((L, i) => ({ label: L + " 任务", phase: "并行深挖", status: i < 6 ? "done" : i === 6 ? "running" : "pending" })) })
  const h = renderTimelineHTML(m)
  assert.ok(h.includes("zcf-pills is-collapsed"))
  assert.ok(h.includes("＋3"))
  assert.ok(h.includes("t-less"))
  assert.ok(h.includes("zcf-chip-live")) // 隐藏药丸里有 running → 呼吸提示
})

test("modelFromRunNode: interrupted projection keeps station running", () => {
  const m = modelFromRunNode({ data: { name: "x", status: "interrupted", phases: [{ phase: "A", members: [{ label: "a", status: "running" }] }] } })
  assert.equal(m.status, "interrupted")
  assert.equal(m.word, "已中断")
  assert.equal(m.stations[0].status, "running")
})

test("modelFromToolCall: compact fallback with name from result text", () => {
  const m = modelFromToolCall({ phase: "result", isError: false, content: 'workflow "demo-x" completed (2 agents).' })
  const h = renderTimelineHTML(m)
  assert.ok(h.includes("zcf-compact"))
  assert.ok(!h.includes("zcf-railseg"))
  assert.match(h, /zcf-name">demo-x</)
})
