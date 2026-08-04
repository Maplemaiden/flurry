import { Menu, Tray, nativeImage, app, nativeTheme } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import { getState, setState } from './store'
import { broadcastState } from './focus'
import { createHomeWindow } from './windows/homeWindow'
import { getPetWindow, setPetClickThrough } from './windows/petWindow'

let tray: Tray | null = null

function resolveTrayIcon(): Electron.NativeImage {
  const candidates = [
    join(__dirname, '../../resources/tray.png'),
    join(process.cwd(), 'resources/tray.png')
  ]

  for (const iconPath of candidates) {
    if (!existsSync(iconPath)) continue
    const img = nativeImage.createFromPath(iconPath)
    if (!img.isEmpty()) {
      // Windows 托盘常用 16×16
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
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
}

export function createTray(): Tray {
  if (tray) return tray

  // 避免被系统配色弄成“看不见”
  void nativeTheme.shouldUseDarkColors

  const icon = resolveTrayIcon()
  tray = new Tray(icon)
  tray.setToolTip('Flurry — 右键或左键打开菜单')
  rebuildMenu()

  // Windows：左键经常点不到右键菜单，两边都弹出
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
