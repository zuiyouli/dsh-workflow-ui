# 前端显示与交互进阶优化建议（UI/UX Proposals）

针对 `dsh-workflow-ui` 现有实现，从**视觉精致度（Polish）**、**态势感知（Situational Awareness）**、**微交互（Micro-interactions）** 与 **极限场景容错（Edge Layouts）** 四个维度提炼以下具体建议。

---

## 一、 态势感知与视线聚焦（让眼睛 0.1 秒抓住重点）

### 1. 当前活动阶段的微光晕（Active Phase Ambient Glow）
- **现状**：阶段处于 `running` 时，仅靠站头 14px StateDot 双圆转动与进站轨段 march 虚线识别；在换行或长工作流中，视觉重心容易被周围五颜六色的药丸分散。
- **建议**：
  - 给 `[data-station-status="running"]` 的站容器增加一层极其克制的呼吸光晕：
    ```css
    .zcf-station[data-station-status="running"] {
      background: radial-gradient(circle at 17px 12px, color-mix(in oklab, var(--color-warning) 8%, transparent) 0%, transparent 70%);
      border-radius: 8px;
    }
    ```
  - 静态/完成阶段无底色，运行阶段自然浮起，视线瞬间定位。

### 2. 蓝图规划态 vs 真实下发态的视觉分层（Speculative Blueprint）
- **现状**：通过静态脚本扫描出来的“未来阶段/药丸”与真实下发但排队中的 `pending` 药丸样式完全一致。
- **建议**：
  - 尚未被真实运行时 `node.data.phases` 确认的静态扫描站，站名加虚线下划线或轻微半透明（`opacity: 0.72`），药丸边框采用细虚线（`dashed`）。
  - 当真实事件流到达该阶段时，平滑渐变为实线。用户一眼能分清：“这是计划中的蓝图”还是“系统已经排队的任务”。

---

## 二、 信息密度与数据可视化（Dataviz Enhancements）

### 3. 站头微型分段进度条（Phase Segment Mini-bar）
- **现状**：站头仅显示 `2/5` 这类单色计数。
- **建议**：
  - 在计数器下方或站名右侧，增加一个 3px 高的微型分段条（Segment Bar），按比例拼接颜色：
    - 绿色（已完成）
    - 橙色条纹脉冲（运行中）
    - 红色（失败）
    - 浅灰（未开始）
  - 极大提升多 agent 阶段的吞吐感知，不用数药丸。

### 4. 阶段耗时微标（Phase Duration Badge）
- **现状**：耗时仅在折叠摘要中展示全局总耗时。
- **建议**：
  - 若阶段内首个 agent 启动到最后一个 agent 结算有时间差，在站头元数据区（或 hover tooltip）展示微型耗时胶囊（如 `38s`）。
  - 帮助用户秒识“哪个阶段是工作流的耗时瓶颈”（如根因分析耗时 2m，修复仅用 15s）。

---

## 三、 微动效与交互质感（Micro-interactions & Tactility）

### 5. 卡片折叠/展开的平滑高度过渡（Smooth Accordion Transition）
- **现状**：v0.3.0 的折叠卡与展开卡采用 DOM 替换（`zcf-recap` 与 `zcf-plot` 分支渲染），切换时瞬间硬跳。
- **建议**：
  - 采用现代 CSS Grid 0fr ↔ 1fr 过渡技巧或微动画：
    ```css
    .zcf-plot-wrapper {
      display: grid;
      grid-template-rows: 1fr;
      transition: grid-template-rows 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease;
    }
    .zcf-card.is-folded .zcf-plot-wrapper {
      grid-template-rows: 0fr;
      opacity: 0;
    }
    ```
  - 点击折叠/展开时有丝滑抽屉拉伸感，不再生硬闪现。

### 6. 子代理药丸的立体微浮沉与悬停卡（Pill Hover Card / Tooltip）
- **现状**：药丸鼠标悬停仅有原生系统的 `title="打开子会话"` 提示。
- **建议**：
  - `.zcf-pill.is-link:hover` 增加 `transform: translateY(-1px)` 与轻微边框提亮。
  - 浮层显示微型快捷卡：展示子代理角色完整名、所属阶段、耗时或最后输出摘要，强化“可点击进入工作现场”的可负担性（Affordance）。

---

## 四、 极端排版与边界容错（Edge Cases & Defensiveness）

### 7. 站名过长自动渐变遮罩（Fade Mask vs Hard Ellipsis）
- **现状**：站名在 168px 下使用单行 `overflow: hidden; text-overflow: ellipsis;`。
- **建议**：
  - 当阶段名很长时，省略号容易遮挡末尾关键词（如“方案设计-容错处理”截成“方案设计-…”）。
  - 可支持两行自动换行（`line-clamp: 2`，最大高度 34px），使站名可读性更强；若单行，右端增加 12px 的渐变淡出遮罩（`-webkit-mask-image: linear-gradient(...)`），比硬截断更加自然。

### 8. 弧线与轨道的暗色高对比度调优（Dark Theme Luminance Tuning）
- **现状**：暗色模式下 `var(--color-border)` 在部分低对比度显示器上微弱难见，弧线的 `faint` 墨水层可能会显得发灰发脏。
- **建议**：
  - 在暗色模式下给 `zcf-arc-ink.faint` 和轨段施加微弱的荧光饱和度校正（使用 `oklch` 或透明度分层），保持“暗而不沉，亮而不刺”。

---

## 优先级落地建议矩阵

| 建议项 | 改造代价 | 视觉提升度 | 建议排期 |
|---|---|---|---|
| **1. 运行阶段微光晕** | 极低（纯 CSS） | ★★★★★ | 已实施 (v0.3.x) |
| **5. 折叠抽屉平滑过渡** | 低（CSS Grid/容器）| ★★★★☆ | 显现动效已实施 (v0.3.x) |
| **3. 站头微型分段进度条** | 中（SVG/HTML 拼接） | ★★★★☆ | v0.4.0 |
| **2. 蓝图虚线分层** | 中（模型标记+CSS） | ★★★☆☆ | v0.4.0 |
| **6. 药丸悬停详情与微浮沉** | 中（Tooltip/交互） | ★★★★☆ | 悬停微浮沉已实施 (v0.3.x) |
| **7. 站名过长自动渐变遮罩** | 极低（纯 CSS） | ★★★☆☆ | 已实施 (v0.3.x) |
| **4. 阶段瓶颈耗时标** | 需上游时间戳细化 | ★★★☆☆ | 待上游支持 |
