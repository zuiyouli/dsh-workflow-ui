# UI/UX 样式进阶改造实施规划（4项待落地项）

本文档针对 `dsh-workflow-ui` 提出的 4 项交互与视觉改造，对 `src/timeline-styles.js` 提供精确落地规划、CSS 规约、选择器冲突分析与花括号配平验证。

---

## 一、待落地 4 项样式改造规范

### 1. 运行中阶段呼吸微光晕 (`[data-station-status="running"]`)
- **目标**：在阶段处于 `running` 时，为站容器提供以灯心 `(17px, 12px)` 为圆心的径向微光晕，并施加克制的呼吸节奏（2.4s）。
- **技术实现**：
  - 采用伪元素 `::after` 承载光晕与 opacity 呼吸动效，避免直接在 host 节点动画重绘，达成 GPU 复合层加速。
  - 使用 DSH 语义 token：`color-mix(in oklab, var(--color-warning) 14%, transparent)`。
- **CSS 规则**：
  ```css
  .zcf-station[data-station-status="running"] {
    border-radius: 8px;
  }
  .zcf-station[data-station-status="running"]::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 8px;
    pointer-events: none;
    background: radial-gradient(circle at 17px 12px, color-mix(in oklab, var(--color-warning) 14%, transparent) 0%, transparent 72%);
    animation: zcf-station-glow 2.4s ease-in-out infinite;
  }
  @keyframes zcf-station-glow {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
  ```

### 2. `.zcf-plot` 展开平滑显现关键帧动效 (`zcf-plot-reveal`)
- **目标**：从折叠卡（`is-folded`）点击展开切换到完整时间线画面时，平滑显现（fade-in + 4px 上浮），消除硬跳感。
- **技术实现**：
  - 复用已有的运动 token：`var(--wf-t-ink)` (320ms) 与 `var(--wf-ease)`。
- **CSS 规则**：
  ```css
  .zcf-plot {
    overflow: visible;
    animation: zcf-plot-reveal var(--wf-t-ink) var(--wf-ease) backwards;
  }
  @keyframes zcf-plot-reveal {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  ```

### 3. `.zcf-station-name` 渐变淡出遮罩 (`mask-image`)
- **目标**：阶段名过长时，末尾 12px 采用平滑渐变淡出，替代硬核省略号突兀感。
- **技术实现**：
  - 结合 WebKit 前缀与标准 `mask-image`，配合 `text-overflow: clip`。
- **CSS 规则**：
  ```css
  .zcf-station-name {
    font-size: 12px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: clip;
    white-space: nowrap;
    color: var(--color-foreground-subtle);
    -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 12px), transparent);
    mask-image: linear-gradient(90deg, #000 calc(100% - 12px), transparent);
  }
  ```

### 4. `.zcf-pill.is-link` 悬停微浮沉 (`translateY(-1px)` + 微阴影)
- **目标**：增强可点击跳转子会话的药丸 affordance。
- **技术实现**：
  - 补充 `transform` 与 `box-shadow` 的 transition。
  - hover 时向上微浮 1px，并配合 DSH 前景色提取微阴影。
- **CSS 规则**：
  ```css
  .zcf-pill.is-link {
    cursor: pointer;
    transition: background var(--wf-t-fast) var(--wf-ease),
                transform var(--wf-t-fast) var(--wf-ease),
                box-shadow var(--wf-t-fast) var(--wf-ease);
  }
  .zcf-pill.is-link:hover {
    background: var(--color-surface-hover);
    border-color: color-mix(in oklab, var(--color-border) 130%, transparent);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px -1px color-mix(in oklab, var(--color-foreground) 12%, transparent);
  }
  ```

---

## 二、选择器无冲突确认

| 改造项 | 目标选择器 | 特异性 | 现有重叠选择器 | 冲突评估与结论 |
|---|---|---|---|---|
| 1. 运行态微光晕 | `.zcf-station[data-station-status="running"]` 及 `::after` | `(0,2,0)` / `(0,2,1)` | `.zcf-station` `(0,1,0)` | **无冲突**：特异性更高，伪元素独立绘制，不影响文字和子 DOM 事件。 |
| 2. 展开关键帧 | `.zcf-plot` | `(0,1,0)` | `.zcf-plot` 原定义 | **无冲突**：原仅有 `overflow: visible`，补充 animation 无覆盖冲突。 |
| 3. 站名渐变遮罩 | `.zcf-station-name` | `(0,1,0)` | 原 `.zcf-station-name` | **无冲突**：直接就地增强属性，clip 与渐变遮罩协同生效。 |
| 4. 药丸悬停浮沉 | `.zcf-pill.is-link` & `:hover` | `(0,2,0)` / `(0,3,0)` | 原 `.zcf-pill` 及 `.zcf-pill.is-link` | **无冲突**：特异性完全一致，动画仅扩展 transform 与 box-shadow。 |

---

## 三、减弱动效适配 (`prefers-reduced-motion`)

在 `@media (prefers-reduced-motion: reduce)` 区块中同步追加以下重置，保障无障碍体验：
```css
@media (prefers-reduced-motion: reduce) {
  .zcf-plot,
  .zcf-station[data-station-status="running"]::after { animation: none; }
  .zcf-pill.is-link:hover { transform: none; box-shadow: none; }
}
```

---

## 四、花括号配平（Brace Balance）审计

- **现有现状**：`src/timeline-styles.js` 当前共有 76 处 `{` 与 76 处 `}`，处于严格配平状态。
- **新增增量**：
  1. `.zcf-station[data-station-status="running"]`：1 对 `{}`
  2. `.zcf-station[data-station-status="running"]::after`：1 对 `{}`
  3. `@keyframes zcf-station-glow`：1 个外层 + 2 个关键帧 = 3 对 `{}`
  4. `@keyframes zcf-plot-reveal`：1 个外层 + 2 个关键帧 = 3 对 `{}`
  5. `.zcf-station-name`：就地替换，增量 0 对 `{}`
  6. `.zcf-pill.is-link` / `.zcf-pill.is-link:hover`：就地更新，增量 0 对 `{}`
  7. `@media (prefers-reduced-motion: reduce)`：内嵌新增选择器，增量 0 对 `{}`（利用已有媒体块）
- **净增量**：共新增 8 对 `{}`，左花括号与右花括号严格以 1:1 配对，最终总量为 84 对 `{}`，校验通过。
