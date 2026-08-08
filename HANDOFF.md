# Flurry 交接说明

轻量桌面宠物（Electron + TypeScript）。仓库：https://github.com/Maplemaiden/flurry

## 怎么跑

```bash
npm install
npm run dev          # 日常开发
npm run dev:test     # 带开发者测试面板与默认作弊
```

- `npm run typecheck` / `npm run build` 需保持通过。
- **主进程**（`src/main/**`）改动后必须重启 `npm run dev`；仅渲染进程多数可 HMR。
- 退出请用托盘（任务栏右下角 `^`）→ **退出 Flurry**，不要只关小窝窗。

## 文档优先级

1. `target_prompt.md` — 实现约束与验收（冲突时以此为准）
2. `桌宠游戏 MVP 策划方案(2).html` — 产品概念
3. `DEVLOG.md` — 按日简练开发记录
4. 本文 — 工程现状速览（给接手人）

## 架构

| 部分 | 路径 | 备注 |
|------|------|------|
| 主进程入口 / 生命周期 | `src/main/index.ts`、`lifecycle.ts` | `quitFlurry` 强制退出 |
| 窗 / 托盘 / IPC / 专注 | `src/main/windows/`、`tray.ts`、`ipc.ts`、`focus.ts`、`store.ts` | 四窗：pet / home / shop / backpack |
| Preload | `src/preload/` → `window.fluffy` | API 类型由 `FluffyApi` 导出 |
| 共享 | `src/shared/` | `types`、`channels`、`defaults`、`intimacy`、`shop-items` |
| 桌宠 | `src/renderer/pet/` | 行为机 `behavior.ts` |
| 小窝 | `src/renderer/home/` | 词库 `dialogue.ts`；设置面板 |
| 商店 / 背包 | `src/renderer/shop/`、`backpack/` | 商品定义在 `shared/shop-items.ts` |
| 帧动画 / 音频 | `src/renderer/shared/catSprites.ts`、`audio.ts` | 清单 `clip-manifest.json` |
| Vite public | `resources/`（`electron.vite.config.ts` → `publicDir`） | `/art` `/frames` `/audio` |
| 本地状态 | `%APPDATA%/fluffy/fluffy/state.json` | mac 为对应 userData |

多窗：透明置顶桌宠 + 普通小窝 + 商店 + 背包。托盘保活；日常入口是 **双击桌宠 → 快捷菜单**。

关键共享状态：`catSleeping`、`chatMessage`、`fishCoins`、`backpack`、`dailyCoins`（桌宠气泡与小窝同步）。

### 资源目录约定

| 路径 | 内容 |
|------|------|
| `resources/art/` | 小窝背景、旧版关键帧参考、道具/UI/托盘等静帧 |
| `resources/frames/` | 插值帧动画（10 猫种英文目录）；运行时默认 `01_gray_white_cat` |
| `resources/audio/ambient/` | 白噪音：`rain` / `fire` / `soft` 等 |
| `resources/audio/bgm/` | `desktop` / `home` / `focus` / `celebrate` |
| `resources/audio/sfx/` | 呼噜、轻喵、抚摸、吃饭、踩奶等 |
| `resources/tray.png` | 托盘图标 |

`clip-manifest.json` 有两份用途相同的拷贝：`resources/frames/`（资源侧）与 `src/renderer/shared/`（打包 import）。改帧文件名后需同步更新清单。

中文旧猫种目录名可通过 `legacyCatMap` 映射到英文帧目录（见 `catSprites.ts`）。

## 当前交互（用户侧）

- **桌宠：** 双击开/关菜单；摸头区抚摸；拖身体移动；菜单含小窝 / 互动 / 商店 / 背包 / 静音；贴边时菜单可左右翻转
- **互动二级：** 梳毛、睡觉直接触发；喂养 / 游戏 / 学习打开背包对应分类选物
- **小窝：** 「互动 / 学习陪伴 / 说说话 / 商店 / 背包 / 设置」；「返回桌面」关小窝
- **设置面板：** 改小猫名字、桌宠透明度、专注时长、环境音、静音、点击穿透
- **说说话：** 底部输入条 + 预设提示；词库规则回复（非云端模型）；回复可带行为钩子
- **经济：** 抚摸得小魚乾（冷却 + 每日上限）；专注自然结束奖励；商店购买入背包，使用触发反馈
- **原则：** 不打扰、无惩罚、亲密度只增不减；音效 / BGM 服从全局静音

## 关键模块速查

| 需求 | 从哪改 |
|------|--------|
| 托盘退出 / 进程残留 | `src/main/lifecycle.ts` → `quitFlurry`；托盘项在 `tray.ts` |
| 桌宠蓝条残影 | `petWindow.ts`（`focusable:false`、`type:'toolbar'`、`suppressPetPhantomTitleBar`） |
| 穿透与逃生 | `tray.ts` / `petWindow.ts`；快捷键 **Ctrl+Alt+P** |
| 行为动画切换 | `pet/behavior.ts` + `shared/catSprites.ts` |
| BGM / 音效 | `shared/audio.ts`；资源在 `resources/audio/` |
| 商店商品与效果 | `shared/shop-items.ts` |
| 词库对话 | `home/dialogue.ts` |
| 小窝设置 UI | `home/index.html` + `home/styles.css`（`.home__settings-panel`） |
| 开发者测试 | `shared/testMode.ts`、`main/testMode.ts`；`npm run dev:test` |

## 开发者测试模式

仅 **`npm run dev:test`**（`FLUFFY_TEST=1`）启动时生效；主进程写入 `settings.testMode` 及默认作弊开关。正式 build 不暴露入口。

| 开关 / 按钮 | 效果 |
|-------------|------|
| 无限小魚乾 | 购买不扣费；商店余额显示 ∞ |
| 跳过每日上限 | 抚摸得币无冷却/上限；专注奖励不受限 |
| 专注 10 秒 | `startFocus` 用 10s 替代分钟计时 |
| 跳过领养 | 直接 `onboardingDone` + 默认猫 |
| +999 币 / 填满背包 / 清空背包 | 经济 & 背包快捷填充 |
| 庆祝 / 暖心 / 迎接 | 写 `pendingPetEvent` |
| 重置存档 | 回到 `DEFAULT_STATE`，保留测试开关 |

IPC：`fluffy:test-action`（preload → `window.fluffy.testAction`）。经济相关判断见 `hasInfiniteCoins` / `skipsEconomyCaps`（`shared/testMode.ts`）。

## 已完成 / 未做

**已有：** P1–P3 主路径；优化版桌宠/小窝交互；商店/背包与小魚乾；插值帧（10 猫种）；正式 BGM/白噪音/音效；词库对话；专注计时；暖心事件；本地持久化；设置改名；穿透逃生；托盘可靠退出；**开发者测试模式（dev:test）**

**未做 / 弱：** 领养时切换猫种帧（API 已有 `setCatFolder`）、旅行、AI 对话、安装包与自动更新、完整 Win/Mac 打磨、部分商店分类仍偏占位

## 已知坑

- Windows 托盘图标常藏在任务栏 `^` 里；日常退出也从这里进，勿只依赖任务栏按钮（桌宠 `skipTaskbar`）
- 点击穿透开启后桌宠完全点不到/拖不动；用 **Ctrl+Alt+P** 或托盘关闭。**每次启动会自动关掉穿透**
- 小窝遮罩层须用 `:not([hidden])` 控制 `display`，否则 `hidden` 会被 CSS 盖掉
- Windows 透明无边框窗可能冒出空标题栏残影；已有压制，若复现优先查是否又对桌宠窗 `show()`/`focus()` 了
- **退出必须走 `quitFlurry`**：桌宠 `closable:false` + 托盘保活会让裸 `app.quit()` 失败并残留进程（快捷键注册失败、终端假死多为残留实例）
- 对话/气泡层 `z-index` 须高于小窝顶栏，否则叠字
- 商店左栏不要用 `filter: blur` 包文字，会发糊
- `resources/frames` 约 750MB；克隆/推送需留意网络与磁盘。已删除本地冗余源目录 `flurry-main-optimized-1.1/`、`动画/`、`音乐/`（勿再提交）

## 建议下一步

1. 领养流程按性格/外观调用 `CatSpritePlayer.setCatFolder` 切换帧
2. 加厚 `dialogue.ts` 词库 / 补冒烟清单
3. electron-builder 出 Windows 安装包（注意 frames 体积，可考虑压缩或按猫种分包）
