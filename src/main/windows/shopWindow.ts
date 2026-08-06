import { BrowserWindow } from 'electron'
import { join } from 'path'
import { SHOP_WINDOW } from '../../shared/defaults'

let shopWindow: BrowserWindow | null = null

function isDev(): boolean {
  return !!process.env['ELECTRON_RENDERER_URL']
}

export function getShopWindow(): BrowserWindow | null {
  return shopWindow
}

export function createShopWindow(): BrowserWindow {
  if (shopWindow && !shopWindow.isDestroyed()) {
    if (shopWindow.isMinimized()) shopWindow.restore()
    shopWindow.show()
    shopWindow.focus()
    return shopWindow
  }

  shopWindow = new BrowserWindow({
    width: SHOP_WINDOW.width,
    height: SHOP_WINDOW.height,
    minWidth: 600,
    minHeight: 480,
    title: 'Flurry — 小魚乾杂货铺',
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

  if (isDev()) {
    shopWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/shop/index.html`)
  } else {
    shopWindow.loadFile(join(__dirname, '../renderer/shop/index.html'))
  }

  shopWindow.once('ready-to-show', () => {
    shopWindow?.show()
  })

  shopWindow.on('closed', () => {
    shopWindow = null
  })

  return shopWindow
}

export function closeShopWindow(): void {
  if (shopWindow && !shopWindow.isDestroyed()) {
    shopWindow.close()
  }
}
