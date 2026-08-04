import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { PET_WINDOW } from '../../shared/defaults'

let petWindow: BrowserWindow | null = null

function isDev(): boolean {
  return !!process.env['ELECTRON_RENDERER_URL']
}

export function getPetWindow(): BrowserWindow | null {
  return petWindow
}

export function createPetWindow(): BrowserWindow {
  if (petWindow && !petWindow.isDestroyed()) {
    return petWindow
  }

  const display = screen.getPrimaryDisplay().workArea

  petWindow = new BrowserWindow({
    width: PET_WINDOW.width,
    height: PET_WINDOW.height,
    x: display.x + display.width - PET_WINDOW.width - 40,
    y: display.y + display.height - PET_WINDOW.height - 40,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  petWindow.setAlwaysOnTop(true, 'screen-saver')

  if (isDev()) {
    petWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/pet/index.html`)
  } else {
    petWindow.loadFile(join(__dirname, '../renderer/pet/index.html'))
  }

  petWindow.once('ready-to-show', () => {
    petWindow?.showInactive()
  })

  petWindow.on('closed', () => {
    petWindow = null
  })

  return petWindow
}

export function setPetClickThrough(enabled: boolean): void {
  if (!petWindow || petWindow.isDestroyed()) return
  petWindow.setIgnoreMouseEvents(enabled, { forward: true })
}
