# Flurry

轻量级桌面宠物（Windows / macOS · Electron + TypeScript）。

在屏幕角落放一团毛茸茸的小生命：不打扰、记得你、安静陪着你。

仓库：https://github.com/Maplemaiden/flurry

## 理念

- **碎片化的治愈** — 互动只需几秒到几分钟
- **不打扰的陪伴** — 无强制弹窗，被注意时才回应
- **双向情感流动** — 你照顾它，它也轻轻照顾你的情绪

## 当前进度（MVP 可玩）

- 透明置顶桌宠：双击菜单、摸头抚摸、拖拽移动、自主行为
- 温暖小窝：领养、互动、学习陪伴、说说话、设置
- 商店 / 背包 / 小魚乾经济
- 插值帧动画（10 猫种资源已入库，默认灰白猫）
- 正式 BGM / 白噪音 / 音效
- 词库对话、专注计时、暖心事件、本地持久化

## 快速开始

```bash
npm install
npm run dev
```

其他脚本：

```bash
npm run dev:test    # 开发者测试模式（无限币、跳过上限、10 秒专注等）
npm run build       # 生产构建
npm run typecheck   # TypeScript 检查
```

**注意**

- 主进程改动后需重启 `npm run dev`
- 退出请用托盘（任务栏 `^`）→ **退出 Flurry**，不要只关小窝窗
- 点击穿透开启后桌宠不可点，可用 **Ctrl+Alt+P** 或托盘唤回

### 日常操作

| 操作 | 说明 |
|------|------|
| 双击桌宠 | 打开 / 关闭快捷菜单 |
| 拖头部 | 抚摸 |
| 拖身体 | 移动位置 |
| 小窝 → 设置 | 改名、透明度、环境音、穿透等 |
| 托盘 | 开小窝 / 显隐桌宠 / 退出 |

## 开发者测试模式

用 `npm run dev:test` 启动（设置 `FLUFFY_TEST=1`），小窝 **设置** 底部会出现 **开发者测试** 面板：

- 无限小魚乾、跳过每日上限、专注 10 秒
- 跳过领养、填满背包、触发庆祝/暖心/迎接、重置存档等

正式 `npm run build` 不含测试入口。详见 `HANDOFF.md`。

## 技术栈

| 层 | 选型 |
|----|------|
| 桌面壳 | Electron 35 + electron-vite + TypeScript |
| 桌宠窗 | 无边框透明置顶，支持拖拽 / 点击穿透 |
| 渲染 | HTML / CSS / TS（pet / home / shop / backpack） |
| 动画 | `resources/frames` 插值帧 + `clip-manifest.json` |
| 音频 | `resources/audio`（ambient / bgm / sfx） |
| 持久化 | `%APPDATA%/fluffy/fluffy/state.json` |

不引入完整游戏引擎；轻量桌宠 + 多窗口 + 托盘保活是核心。

## 目录结构

```
src/
  main/                 # 主进程：窗口、托盘、IPC、存储、专注计时
    windows/            # pet / home / shop / backpack
    lifecycle.ts        # quitFlurry 可靠退出
    testMode.ts         # 开发者测试（FLUFFY_TEST=1）
  preload/              # contextBridge → window.fluffy
  shared/               # 类型、通道、默认值、商店、testMode
  renderer/
    pet/                # 桌面宠物
    home/               # 温暖小窝
    shop/               # 小魚乾杂货铺
    backpack/           # 背包
    shared/             # catSprites、audio、clip-manifest
resources/
  art/                  # 静帧美术、小窝背景
  frames/               # 插值帧（约 750MB）
  audio/                # 音频资源
  tray.png
```

## 文档

| 文件 | 用途 |
|------|------|
| `HANDOFF.md` | 工程交接、架构、已知坑、改哪里 |
| `DEVLOG.md` | 按日开发记录 |
| `target_prompt.md` | 实现约束与验收（冲突时以此为准） |
| `桌宠游戏 MVP 策划方案(2).html` | 产品概念 |

## 许可证

私有项目（`UNLICENSED`）。未另行声明前请勿公开分发。
