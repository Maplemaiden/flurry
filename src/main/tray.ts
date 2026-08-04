import { Menu, Tray, nativeImage, app } from 'electron'
import { join } from 'path'
import { createHomeWindow } from './windows/homeWindow'
import { getPetWindow } from './windows/petWindow'

let tray: Tray | null = null

/** 用 1×1 占位图；后续替换为正式托盘图标 */
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
  tray.setToolTip('Fluffy')

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
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => createHomeWindow())

  return tray
}
