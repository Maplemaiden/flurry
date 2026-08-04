import { BrowserWindow } from 'electron'
import { join } from 'path'
import { HOME_WINDOW } from '../../shared/defaults'

let homeWindow: BrowserWindow | null = null

function isDev(): boolean {
  return !!process.env['ELECTRON_RENDERER_URL']
}

export function getHomeWindow(): BrowserWindow | null {
  return homeWindow
}

export function createHomeWindow(): BrowserWindow {
  if (homeWindow && !homeWindow.isDestroyed()) {
    homeWindow.focus()
    return homeWindow
  }

  homeWindow = new BrowserWindow({
    width: HOME_WINDOW.width,
    height: HOME_WINDOW.height,
    minWidth: 560,
    minHeight: 420,
    title: 'Fluffy — 温暖小窝',
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#f3ebe2',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (isDev()) {
    homeWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/home/index.html`)
  } else {
    homeWindow.loadFile(join(__dirname, '../renderer/home/index.html'))
  }

  homeWindow.once('ready-to-show', () => {
    homeWindow?.show()
  })

  homeWindow.on('closed', () => {
    homeWindow = null
  })

  return homeWindow
}

export function closeHomeWindow(): void {
  if (homeWindow && !homeWindow.isDestroyed()) {
    homeWindow.close()
  }
}
