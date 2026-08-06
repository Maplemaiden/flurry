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
3. `DEVLOG.md` — 按日简练开发记录
4. 本文 — 工程现状速览

## 架构（必要）

| 部分 | 路径 |
|------|------|
| 主进程（窗/托盘/IPC/专注计时） | `src/main/` |
| Preload API | `src/preload/` → `window.fluffy` |
| 共享类型/通道/默认值 | `src/shared/` |
| 桌宠浮窗 | `src/renderer/pet/` |
| 温暖小窝 | `src/renderer/home/` |
| 商店 / 背包 | `src/renderer/shop/`、`src/renderer/backpack/` |
| 帧动画 / 音频工具 | `src/renderer/shared/` |
| 正式美术 | `resources/art/`（Vite `publicDir`） |
| 插值帧动画 | `resources/frames/`（英文猫种目录 + `clip-manifest.json`） |
| 音频 | `resources/audio/`（`ambient` / `bgm` / `sfx`） |
| 托盘图标 | `resources/tray.png` |
| 本地状态 | `%APPDATA%/fluffy/fluffy/state.json`（mac 为对应 userData） |

多窗：透明置顶桌宠 + 普通小窝 + 商店 + 背包。托盘保活；日常入口是 **双击桌宠 → 快捷菜单**。

关键共享状态：`catSleeping`、`chatMessage`、`fishCoins`、`backpack`（桌宠气泡与小窝同步）。

## 当前交互（用户侧）

- 桌宠：双击开/关菜单；摸头感应区抚摸；拖身体移动；菜单含小窝 / 互动 / 商店 / 背包 / 静音
- 互动二级：梳毛、睡觉可用；喂养/游戏/学习打开背包对应分类选物
- 小窝：主入口「互动 / 学习陪伴 / 说说话 / 商店 / 背包 / 设置」；设置面板可改名、透明度、穿透、环境音等；「返回桌面」关小窝
- 说说话：底部输入条 + 预设提示；词库规则回复（非云端模型）
- 经济：抚摸/专注可得小魚乾；商店购买入背包
- 原则：不打扰、无惩罚、亲密度只增不减

## 已完成 / 未做

**已有：** P1–P3 主路径；优化版桌宠/小窝交互；商店/背包与小魚乾；插值帧动画（10 猫种）；正式 BGM/白噪音/音效；词库对话；专注计时；暖心事件；本地持久化；穿透逃生（Ctrl+Alt+P / 托盘）

**未做 / 弱：** 领养切换猫种帧、旅行、AI 对话、安装包与自动更新、完整 Win/Mac 打磨

## 已知坑

- Windows 托盘图标常藏在任务栏 `^` 里，勿只依赖托盘引导
- 点击穿透开启后桌宠完全点不到/拖不动；用 **Ctrl+Alt+P** 或托盘关闭。**每次启动会自动关掉穿透**
- 小窝遮罩层须用 `:not([hidden])` 控制 `display`，否则 `hidden` 会被 CSS 盖掉
- Windows 透明无边框窗可能冒出空标题栏残影；桌宠窗已设 `focusable: false` / `type: toolbar`，失焦时微抖重绘压制
- 托盘退出须走 `quitFlurry`（强制 destroy 窗）；勿只调 `app.quit()`，否则桌宠 `closable:false` 会导致进程残留
- 对话/气泡层 `z-index` 须高于小窝顶栏，否则叠字
- `resources/frames` 体积大（插值帧约 750MB）；推送/克隆需留意网络与磁盘

## 建议下一步

1. 按领养选择不同猫种帧（`CatSpritePlayer.setCatFolder` 已支持）
2. 加厚 `dialogue.ts` 词库 / 补冒烟清单
3. electron-builder 出 Windows 安装包
