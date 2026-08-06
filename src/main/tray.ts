import { Menu, Tray, nativeImage, nativeTheme, globalShortcut } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import { quitFlurry, registerTrayDestroy } from './lifecycle'
import { getState, setState } from './store'
import { broadcastState } from './focus'
import { createHomeWindow } from './windows/homeWindow'
import { getPetWindow, setPetClickThrough } from './windows/petWindow'

let tray: Tray | null = null

/** 穿透锁死时的全局逃生快捷键 */
export const ESCAPE_ACCELERATOR = 'CommandOrControl+Alt+P'

function resolveTrayIcon(): Electron.NativeImage {
  const candidates = [
    join(__dirname, '../../resources/tray.png'),
    join(__dirname, '../../resources/art/05_托盘图标/猫爪_32.png'),
    join(__dirname, '../../resources/art/05_托盘图标/猫爪_16.png'),
    join(process.cwd(), 'resources/tray.png'),
    join(process.cwd(), 'resources/art/05_托盘图标/猫爪_32.png')
  ]

  for (const iconPath of candidates) {
    if (!existsSync(iconPath)) continue
    const img = nativeImage.createFromPath(iconPath)
    if (!img.isEmpty()) {
      return img.resize({ width: 16, height: 16 })
    }
  }

  // 兜底：画一个可见色块（避免空图标）
  const size = 16
  const buf = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - 7.5
      const dy = y - 8.5
      const inside = dx * dx + dy * dy < 49
      const o = (y * size + x) * 4
      if (inside) {
        buf[o] = 201
        buf[o + 1] = 150
        buf[o + 2] = 110
        buf[o + 3] = 255
      }
    }
  }
  return nativeImage.createFromBuffer(buf, { width: size, height: size })
}

/** 关闭穿透并打开小窝——保证用户不会被锁死 */
export function escapeClickThrough(): void {
  setPetClickThrough(false)
  const next = setState({
    settings: { ...getState().settings, clickThrough: false }
  })
  broadcastState(next)
  createHomeWindow()
  rebuildMenu()
}

function rebuildMenu(): void {
  if (!tray) return
  const state = getState()

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打开温暖小窝',
      click: () => createHomeWindow()
    },
    {
      label: '显示 / 隐藏桌宠',
      click: () => {
        const pet = getPetWindow()
        if (!pet) return
        if (pet.isVisible()) pet.hide()
        else pet.showInactive()
      }
    },
    { type: 'separator' },
    {
      label: state.settings.clickThrough ? '关闭点击穿透' : '开启点击穿透',
      click: () => {
        const enabled = !getState().settings.clickThrough
        setPetClickThrough(enabled)
        const next = setState({
          settings: { ...getState().settings, clickThrough: enabled }
        })
        broadcastState(next)
        rebuildMenu()
      }
    },
    {
      label: `紧急唤回（${ESCAPE_ACCELERATOR.replace('CommandOrControl', 'Ctrl')}）`,
      click: () => escapeClickThrough()
    },
    {
      label: state.settings.muted ? '取消静音' : '静音',
      click: () => {
        const next = setState({
          settings: { ...getState().settings, muted: !getState().settings.muted }
        })
        broadcastState(next)
        rebuildMenu()
      }
    },
    { type: 'separator' },
    {
      label: '退出 Flurry',
      click: () => {
        quitFlurry()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
}

export function registerEscapeShortcut(): void {
  globalShortcut.unregisterAll()
  const ok = globalShortcut.register(ESCAPE_ACCELERATOR, () => {
    escapeClickThrough()
  })
  if (!ok) {
    console.warn(`[fluffy] failed to register shortcut ${ESCAPE_ACCELERATOR}`)
  }
}

export function createTray(): Tray {
  if (tray) return tray

  void nativeTheme.shouldUseDarkColors

  const icon = resolveTrayIcon()
  tray = new Tray(icon)
  tray.setToolTip('Flurry — 右键菜单 · 穿透锁死时按 Ctrl+Alt+P 唤回')
  rebuildMenu()
  registerTrayDestroy(() => {
    if (tray) {
      tray.destroy()
      tray = null
    }
  })

  tray.on('click', () => {
    rebuildMenu()
    tray?.popUpContextMenu()
  })
  tray.on('right-click', () => {
    rebuildMenu()
    tray?.popUpContextMenu()
  })
  tray.on('double-click', () => createHomeWindow())

  return tray
}

export { rebuildMenu }
