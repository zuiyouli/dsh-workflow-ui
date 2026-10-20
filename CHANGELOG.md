# Changelog

## 0.2.0 — 2026-10-20

Second release: verified on DSH 0.2.1-rc.2, working child-session navigation,
and the plugin now ships its own agent preset.

### Added

- Bundled agent preset "Workflow 编排": installing the plugin adds the preset
  to the roster automatically (uninstalling removes it) — no manual preset
  setup needed.
- Arcs at any width: narrow single-row cards keep the static arc layer with
  inline air/raise, instead of dropping arcs below 920px.

### Fixed

- Pill click now actually opens the child session: `openSession` is injected
  into the slot props per the 0.2.1 contract, the subagent mode is resolved at
  click time via the sessions store, and an address-mode fallback keeps the
  navigation working when the projection is unavailable. Render-time store
  calls no longer crash the tree into the official fallback.
- The stock "正在调用工具 · workflow" running header no longer leaks above the
  run card (turn-process chat node hidden for workflow calls).
- Entrance animations play once per card instead of replaying on every live
  re-render (anti-flicker boot class).

### Changed

- Wrap mode draws only same-row arcs — cross-row edge trunks are gone (they
  turned into spaghetti on complex runs); loop information stays on the `↩`
  badge.
- Compat verified on DSH 0.2.1-rc.2 (slot topology unchanged, bundle loads,
  live run renders); range `>=0.1.0-rc.5 <0.3.0` unchanged.
- README is Chinese-first with fresh wide + wrap screenshots; English moved
  to README.en.md.

## 0.1.0 — 2026-10-15

First public release.

- Station pill overflow collapses behind a `+N` expander (single-phase runs
  with many agents); expansion persists across live re-renders, with a pulse
  dot when a hidden pill is still running.
- Wrap-mode arcs: below 920px the card re-flows to multiple rows and arcs are
  re-drawn dynamically from measured geometry — same-row pairs fly the classic
  arc above the row, cross-row pairs route through row-gap corridors and
  left/right edge trunks (loops left, forward right, lanes staggered); loop
  targets show a `↩` badge.
- Horizontal workflow timeline replacing the stock `workflow` tool card and
  `workflow-run` chat node: rail + phase stations + agent pills, march ink,
  three-tier edge ink (faint/strong/march).
- Client-side script scanning: declared phases, `parallel()` alongside bands
  with fork/merge tracks, forward skip arcs and loop (return) arcs with lane
  assignment — planned stations render before the run reaches them.
- Status dots and iconography follow DSH official
  `dsh-client-ui-primitives` (StateDot spinner/core, ListPen header icon,
  Check/Close marks).
- Agent faces with glance/blink motion; `prefers-reduced-motion` honored
  across the whole card.
- Wrap mode under 920px container width; wide single-row mode with arcs above.
