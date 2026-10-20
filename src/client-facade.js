// dsh-workflow-ui 客户端门面（模板：scripts/build.mjs 注入 CSS/MODEL/HTML 后产出 lib/client.js）
// 协议（子代理 B 契约 + dsh-client-ui-workflow-run 官方样例）：
//   window.__ModuleLoader__.load({id, factory(require)}) → {inject, apply(t)}
//   keyed 槽同名 key：priority 最低者渲染（官方默认 0），本插件用 -1 影子官方；崩溃自动 abdicate 回退官方
window.__ModuleLoader__.load({
  id: "dsh-workflow-ui",
  factory: (require) => {
    const React = require("react")
    const { createElement: h, useMemo, useState, useEffect, useRef } = React

    /*@CSS_INJECT@*/

    /*@SCAN_INJECT@*/

    /*@MODEL_INJECT@*/

    /*@HTML_INJECT@*/

    // ── meta store：工具行（隐形）把脚本 meta 存这里，运行卡订阅消费 ──
    const metaStore = { byName: new Map(), listeners: new Set() }
    // 药丸折叠展开态（按站名跨重渲染保留——事件流每次更新都全量重渲染 innerHTML）
    const expandedPills = new Set()
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
      const osRef = useRef(null)
      const sidRef = useRef(null)
      const modelRef = useRef(null)
      osRef.current = props?.openSession
      sidRef.current = props?.sessionId
      // 0.2.1 契约：mode 在点击时传 "unknown"，由 uiWorkspace 按子会话目录身份自行解析
      modelRef.current = null // 渲染期先置空，下方 useMemo 后立即回填
      useEffect(() => {
        const bump = () => setTick((x) => x + 1)
        metaStore.listeners.add(bump)
        return () => metaStore.listeners.delete(bump)
      }, [])
      // 入场动画只播一次：挂载加 zcf-boot，~1s 后移除（事件流重渲染不再重播动画 → 防闪烁）
      useEffect(() => {
        const root = rootRef.current
        if (!root || !root.classList) return
        root.classList.add("zcf-boot")
        const t = setTimeout(() => root.classList.remove("zcf-boot"), 900)
        return () => clearTimeout(t)
      }, [])
      // 药丸交互：根节点上挂一次委托（innerHTML 重渲染不丢监听）——折叠片切换 + 子会话跳转
      useEffect(() => {
        const root = rootRef.current
        if (!root || !root.addEventListener) return
        const open = (link) => {
          const id = link.dataset.child
          const os = osRef.current
          if (!id || typeof os !== "function") return
          // 0.2.1：mode 传 "unknown" = 由 uiWorkspace 按子会话目录身份自行解析（传猜测值会触发 subagent/unauthorized）
          try { os({ parentSessionId: sidRef.current, childSessionId: id, mode: "unknown" }) } catch { try { os(id) } catch { /* 跳转失败静默 */ } }
        }
        const onClick = (e) => {
          const link = e.target && e.target.closest ? e.target.closest(".zcf-pill.is-link") : null
          if (link) { open(link); return }
          const b = e.target && e.target.closest ? e.target.closest(".zcf-pillmore") : null
          if (!b) return
          const wrap = b.closest(".zcf-pills")
          if (!wrap) return
          const collapsed = wrap.classList.toggle("is-collapsed")
          const key = wrap.dataset.station
          if (key) { if (collapsed) expandedPills.delete(key); else expandedPills.add(key) }
          b.setAttribute("aria-expanded", collapsed ? "false" : "true")
        }
        const onKey = (e) => {
          if (e.key !== "Enter" && e.key !== " ") return
          const link = e.target && e.target.closest ? e.target.closest(".zcf-pill.is-link") : null
          if (!link) return
          e.preventDefault()
          open(link)
        }
        root.addEventListener("click", onClick)
        root.addEventListener("keydown", onKey)
        return () => { root.removeEventListener("click", onClick); root.removeEventListener("keydown", onKey) }
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
          layoutArcLayers(strip, stations, modelRef.current)
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(strip)
        return () => ro.disconnect()
      }, [props?.node, tick])
      const [err, setErr] = useState(null)
      const model = useMemo(() => {
        try {
          const m = modelFromRunNode(node, metaFor(node?.data?.name))
          modelRef.current = m
          return { ok: true, m }
        } catch (e) {
          modelRef.current = null
          return { ok: false, m: { name: node?.data?.name ?? "?", status: "pending", word: "", tone: "pending", stations: [], progress: null, phaseCount: 0, agentsTotal: 0, agentsRunning: 0, maxTrack: 0, bands: [] }, err: String(e) }
        }
      }, [node, tick])
      if (model.ok === false) {
        return h("div", { style: { padding: "6px 10px", fontSize: "12px", color: "var(--color-foreground-subtle)" } }, "workflow-ui 渲染降级: " + (model.err ?? "?"))
      }
      return h("div", { ref: rootRef, dangerouslySetInnerHTML: { __html: renderTimelineHTML(model.m, { expanded: expandedPills }) } })
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
    let applyCtx = null // 供 slot inject 闭包取宿主服务（uiWorkspace）

    return {
      inject: ["slots"],
      apply(t) {
        applyCtx = t
        ensureStyles(typeof document !== "undefined" ? document : null)
        const slots = t?.get?.("slots")
        if (!slots) return
        slots.inject(CHAT_NODE_SLOT, () =>
          slots.register(
            {
              name: CHAT_NODE_SLOT,
              id: "workflow-ui-run",
              key: "workflow-run",
              priority: -1,
              // 官方同款：openSession 由槽位系统经 inject 注入组件 props（0.2.1 起组件内无法从别处取得）
              inject: () => ({
                openSession: (target) => {
                  const ws = applyCtx && typeof applyCtx.get === "function" ? applyCtx.get("uiWorkspace") : null
                  const api =
                    ws && typeof ws.openSession === "function" ? ws.openSession.bind(ws)
                    : ws && ws.default && typeof ws.default.openSession === "function" ? ws.default.openSession.bind(ws.default)
                    : null
                  if (!api) throw new Error("uiWorkspace.openSession unavailable")
                  return api(target)
                },
              }),
            },
            WorkflowRunTimeline,
          ),
        )
        slots.inject(TOOLVIEW_SLOT, () =>
          slots.register({ name: TOOLVIEW_SLOT, id: "workflow-ui-tool", key: "workflow", priority: -1 }, WorkflowToolRow),
        )
      },
      __test: { buildTimeline, modelFromRunNode, modelFromToolCall, renderTimelineHTML, stashMeta, metaFor, scanScript },
    }
  },
})
