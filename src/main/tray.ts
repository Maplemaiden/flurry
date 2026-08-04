import { Menu, Tray, nativeImage, app } from 'electron'
import { join } from 'path'
import { getState, setState } from './store'
import { broadcastState } from './focus'
import { createHomeWindow } from './windows/homeWindow'
import { getPetWindow, setPetClickThrough } from './windows/petWindow'

let tray: Tray | null = null

function createPlaceholderIcon(): Electron.NativeImage {
  const size = 16
  const canvas = Buffer.alloc(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    const o = i * 4
    canvas[o] = 196
    canvas[o + 1] = 154
    canvas[o + 2] = 120
    canvas[o + 3] = 255
  }
  return nativeImage.createFromBuffer(canvas, { width: size, height: size })
}

function rebuildMenu(): void {
  if (!tray) return
  const state = getState()

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打开小窝',
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
      label: '退出',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
}

export function createTray(): Tray {
  if (tray) return tray

  const iconPath = join(__dirname, '../../resources/tray.png')
  let icon = nativeImage.createEmpty()
  try {
    icon = nativeImage.createFromPath(iconPath)
    if (icon.isEmpty()) icon = createPlaceholderIcon()
  } catch {
    icon = createPlaceholderIcon()
  }

  tray = new Tray(icon)
  tray.setToolTip('Flurry')
  rebuildMenu()
  tray.on('double-click', () => createHomeWindow())

  return tray
}
