# Publishing runbook (maintainer notes)

Everything up to the push is already done in this repo (files, tests, CI, commit).
The remaining steps need your GitHub credentials.

## 1. Create the GitHub repository

Create a **public** repo named `dsh-workflow-ui` under your account
(https://github.com/new — no README/gitignore init). If your GitHub handle is
not `lijiefeng`, also fix the URLs in `package.json` (`repository`, `bugs`,
`homepage`), both READMEs and the YAML in step 4.

## 2. Push

```bash
git remote add origin https://github.com/zuiyouli/dsh-workflow-ui.git
git push -u origin main
```

CI (`.github/workflows/ci.yml`) runs `npm run check` + preview on every push.

## 3. Repo settings

- Topics: add `dsh-plugin` (the catalog discovers plugins by this topic).
- Optional: Settings → Social preview → upload `docs/social-preview.png`.

## 4. Curated market submission (awesome-dsh-plugin)

Fork https://github.com/awesome-dsh-plugin/awesome-dsh-plugin, add
`data/plugins/zuiyouli__dsh-workflow-ui.yml`:

```yaml
url: https://github.com/zuiyouli/dsh-workflow-ui
name: zuiyouli/dsh-workflow-ui
category: workflow
description:
  en: 'In-conversation workflow run timeline for DSH Web: a horizontal rail with phase stations, agent pills, loop arcs and parallel bands replaces the stock workflow tool card and workflow-run chat node. Planned stations render before the run starts via client-side script scanning; status dots and icons follow DSH official primitives.'
  zh: 对话内工作流运行时间线：横向轨道 + 阶段站 + 子代理药丸 + 循环弧线 + 并行带，替换官方 workflow 工具卡与 workflow-run 聊天节点。客户端脚本扫描让计划站在开跑前全部渲染；状态点与图标对齐 DSH 官方 primitives。
```

Open the PR. The catalog auto-discovers `docs/screenshot.png` and reads
stars/compatibility from the repo; `npm run check` (CI) is what reviewers look
for. After merge, the install line becomes:

```bash
dsh plugin --profile web add github:zuiyouli/dsh-workflow-ui
```

## 5. Later releases

Tag versions (`git tag v0.1.0 && git push --tags`) and create a GitHub Release
per change; the market picks the version from releases. Run `npm run check`
before every tag (also enforced by `prepublishOnly` if you ever publish to npm).
