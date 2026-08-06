import { BrowserWindow } from 'electron'
import { join } from 'path'
import { BACKPACK_WINDOW } from '../../shared/defaults'
import type { ShopCategory } from '../../shared/types'

let backpackWindow: BrowserWindow | null = null

function isDev(): boolean {
  return !!process.env['ELECTRON_RENDERER_URL']
}

export function getBackpackWindow(): BrowserWindow | null {
  return backpackWindow
}

/** 创建背包窗口；可选传入初始分类筛选 */
export function createBackpackWindow(initialCategory?: ShopCategory): BrowserWindow {
  if (backpackWindow && !backpackWindow.isDestroyed()) {
    if (backpackWindow.isMinimized()) backpackWindow.restore()
    backpackWindow.show()
    backpackWindow.focus()
    // 通知渲染进程切换初始分类
    backpackWindow.webContents.send('fluffy:backpack-category', initialCategory ?? 'food')
    return backpackWindow
  }

  backpackWindow = new BrowserWindow({
    width: BACKPACK_WINDOW.width,
    height: BACKPACK_WINDOW.height,
    minWidth: 520,
    minHeight: 460,
    title: 'Flurry — 小猫的背包',
    show: false,
    frame: true,
    closable: true,
    minimizable: true,
    maximizable: true,
    fullscreenable: false,
    autoHideMenuBar: true,
    backgroundColor: '#f7efe6',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  backpackWindow.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error('[backpackWindow] did-fail-load:', code, desc)
  })
  backpackWindow.webContents.on('render-process-gone', (_e, details) => {
    console.error('[backpackWindow] render-process-gone:', details)
  })

  if (isDev()) {
    const url = `${process.env['ELECTRON_RENDERER_URL']}/backpack/index.html`
    console.log('[backpackWindow] loading dev URL:', url)
    backpackWindow.loadURL(url)
  } else {
    const fp = join(__dirname, '../renderer/backpack/index.html')
    console.log('[backpackWindow] loading file:', fp)
    backpackWindow.loadFile(fp)
  }

  backpackWindow.once('ready-to-show', () => {
    backpackWindow?.show()
    if (initialCategory) {
      backpackWindow?.webContents.send('fluffy:backpack-category', initialCategory)
    }
  })

  backpackWindow.on('closed', () => {
    backpackWindow = null
  })

  return backpackWindow
}

export function closeBackpackWindow(): void {
  if (backpackWindow && !backpackWindow.isDestroyed()) {
    backpackWindow.close()
  }
}
