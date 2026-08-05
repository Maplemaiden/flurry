# Flurry 交接说明

轻量桌面宠物（Electron + TypeScript）。仓库：https://github.com/Maplemaiden/flurry

## 怎么跑

```bash
npm install
npm run dev
```

`typecheck` / `build` 需保持通过。主进程改动后要重启 `npm run dev`。

## 文档优先级

1. `target_prompt.md` — 实现约束与验收（冲突时以此为准）
2. `桌宠游戏 MVP 策划方案(2).html` — 产品概念
3. 本文 — 工程现状速览

## 架构（必要）

| 部分 | 路径 |
|------|------|
| 主进程（窗/托盘/IPC/专注计时） | `src/main/` |
| Preload API | `src/preload/` → `window.fluffy` |
| 共享类型/通道 | `src/shared/` |
| 桌宠浮窗 | `src/renderer/pet/` |
| 温暖小窝 | `src/renderer/home/` |
| 本地状态 | `%APPDATA%/fluffy/state.json`（mac 为对应 userData） |

双窗：透明置顶桌宠 + 普通小窝窗。托盘仍在，但日常入口是 **单击桌宠 → 快捷菜单**。

## 当前交互（用户侧）

- 桌宠：单击菜单；拖拽移动；菜单可开小窝 / 摸摸 / 静音
- 小窝：领养、喂养、睡觉、陪学、梳毛、专注、说说话、设置；「返回桌面」关小窝
- 说说话：全屏层；「返回小窝」只关对话，不关小窝
- 原则：不打扰、无惩罚、亲密度只增不减；动画/音效多为占位

## 已完成 / 未做

**已有：** P1–P3 主路径骨架（桌宠行为、小窝照顾、专注计时、词库对话、暖心事件、本地持久化）

**未做 / 弱：** 正式美术与音效、多猫、旅行、AI 对话、安装包与自动更新、完整 Win/Mac 打磨

## 已知坑

- 系统托盘图标在 Windows 常藏在 `^` 里；穿透锁死时可用 **Ctrl+Alt+P** 紧急唤回（关穿透并开小窝）
- 小窝遮罩层必须用 `:not([hidden])` 控制 `display`，否则 `hidden` 会被 CSS 盖掉
- 对话层 `z-index` 必须高于小窝顶栏，否则标题叠字
- 点击穿透开启后桌宠完全点不到/拖不动；用托盘或 **Ctrl+Alt+P** 关闭。每次启动会自动关掉穿透，避免残留状态。

## 美术资源

正式素材在 `resources/art/`（由「小猫咪」目录合并）。桌宠/小窝默认使用 `02_猫咪/01_灰白坐姿猫` 帧动画；托盘图标为 `resources/tray.png`。

## 建议下一步

1. 按领养选择不同猫种帧（目前固定默认灰白猫）
2. 压缩专注默认时长的调试体验 / 补冒烟清单
3. electron-builder 出 Windows 安装包
