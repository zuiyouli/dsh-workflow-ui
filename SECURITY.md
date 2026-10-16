# Security Policy

## Scope

`dsh-workflow-ui` is a **presentation-only** client plugin for the DeepSeek Harness web GUI.

- It consumes DSH's existing durable workflow event projections **read-only** and keeps no parallel state, database, or session store.
- It makes **no network requests** and collects **no telemetry**.
- It registers two keyed UI slots (`conversation.chat.node` / `tool.call.toolview`) with `priority: -1` and abdicates back to the official renderers on any internal error; it never patches host services.

## Data handling

All rendering happens locally in the browser tab from data the GUI already holds. Nothing is written outside the plugin's own injected `<style data-plugin>` element.

## Iconography note

Status dots and icon glyphs reproduce the shapes of DSH's official `dsh-client-ui-primitives` (StateDot, ListPen, Check, Close) so the card blends with the host UI. They are static SVG paths with no executable content.

## Reporting

Open a [GitHub issue](https://github.com/zuiyouli/dsh-workflow-ui/issues) for anything suspicious. Please do not include session content or workflow scripts in reports.
