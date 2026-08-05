import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { PET_MENU_WINDOW, PET_MENU_WINDOW_NESTED, PET_WINDOW } from '../../shared/defaults'

let petWindow: BrowserWindow | null = null
let menuOpen = false

function isDev(): boolean {
  return !!process.env['ELECTRON_RENDERER_URL']
}

type Bounds = { x: number; y: number; width: number; height: number }

function clampToWorkArea(bounds: Bounds): Bounds {
  const point = {
    x: Math.round(bounds.x + bounds.width / 2),
    y: Math.round(bounds.y + bounds.height / 2)
  }
  const wa = screen.getDisplayNearestPoint(point).workArea
  const x = Math.min(Math.max(bounds.x, wa.x), wa.x + wa.width - bounds.width)
  const y = Math.min(Math.max(bounds.y, wa.y), wa.y + wa.height - bounds.height)
  return { ...bounds, x, y }
}

export function getPetWindow(): BrowserWindow | null {
  return petWindow
}

export function createPetWindow(): BrowserWindow {
  if (petWindow && !petWindow.isDestroyed()) {
    return petWindow
  }

  const display = screen.getPrimaryDisplay().workArea
  menuOpen = false

  petWindow = new BrowserWindow({
    width: PET_WINDOW.width,
    height: PET_WINDOW.height,
    x: display.x + display.width - PET_WINDOW.width - 40,
    y: display.y + display.height - PET_WINDOW.height - 40,
    frame: false,
    transparent: true,
    thickFrame: false,
    movable: false,
    roundedCorners: false,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    useContentSize: true,
    paintWhenInitiallyHidden: true,
    title: '',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false
    }
  })

  petWindow.setBackgroundColor('#00000000')

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
    menuOpen = false
  })

  petWindow.on('blur', () => {
    if (!menuOpen || !petWindow || petWindow.isDestroyed()) return
    petWindow.webContents.send('fluffy:pet-blur')
  })

  return petWindow
}

export function setPetClickThrough(enabled: boolean): void {
  if (!petWindow || petWindow.isDestroyed()) return
  if (menuOpen && enabled) return
  petWindow.setIgnoreMouseEvents(enabled, { forward: true })
}

/** 展开菜单时按是否嵌套二级栏调整窗口尺寸；收起时还原 */
export function setPetMenuOpen(open: boolean, nested = false): Bounds | null {
  if (!petWindow || petWindow.isDestroyed()) return null

  const current = petWindow.getBounds()
  if (open === menuOpen && nested === false) {
    return { x: current.x, y: current.y, width: current.width, height: current.height }
  }

  menuOpen = open

  if (open) {
    const target = nested ? PET_MENU_WINDOW_NESTED : PET_MENU_WINDOW
    const width = target.width
    const height = target.height
    const x = Math.round(current.x + (current.width - width) / 2)
    const y = current.y + current.height - height
    const next = clampToWorkArea({ x, y, width, height })
    petWindow.setBounds(next)
    petWindow.setIgnoreMouseEvents(false)
    return next
  }

  const width = PET_WINDOW.width
  const height = PET_WINDOW.height
  const x = Math.round(current.x + (current.width - width) / 2)
  const y = current.y + current.height - height
  const next = clampToWorkArea({ x, y, width, height })
  petWindow.setBounds(next)
  return next
}
