# Changelog

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
