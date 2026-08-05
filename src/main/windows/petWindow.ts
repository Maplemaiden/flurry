import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { PET_MENU_WINDOW, PET_MENU_WINDOW_NESTED, PET_WINDOW } from '../../shared/defaults'
import { getState } from '../store'

let petWindow: BrowserWindow | null = null
let menuOpen = false
/** 用户设置的点击穿透（与菜单临时可点状态分开） */
let clickThroughDesired = false

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

function applyIgnoreMouse(ignore: boolean): void {
  if (!petWindow || petWindow.isDestroyed()) return
  // 穿透必须是完整忽略：不要 { forward:true }，否则热区/移入事件会把穿透打穿
  petWindow.setIgnoreMouseEvents(ignore)
}

export function getPetWindow(): BrowserWindow | null {
  return petWindow
}

export function isPetClickThroughDesired(): boolean {
  return clickThroughDesired
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
    // 桌宠不抢焦点，避免 Windows 给透明无边框窗画出一条空标题栏（常呈蓝色）
    focusable: false,
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
    title: 'Flurry Pet',
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
  petWindow.setMenuBarVisibility(false)
  petWindow.removeMenu()

  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  petWindow.setAlwaysOnTop(true, 'screen-saver')

  if (isDev()) {
    petWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/pet/index.html`)
  } else {
    petWindow.loadFile(join(__dirname, '../renderer/pet/index.html'))
  }

  petWindow.once('ready-to-show', () => {
    petWindow?.showInactive()
    // 再钉一次，压住 Windows 偶发画出的标题栏残影
    petWindow?.setMaximizable(false)
    if (clickThroughDesired) applyIgnoreMouse(true)
  })

  petWindow.on('closed', () => {
    petWindow = null
    menuOpen = false
  })

  petWindow.on('blur', () => {
    // Electron/Windows 已知：透明无边框窗失焦时可能冒出空标题栏
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.setMaximizable(false)
    }
    if (!menuOpen || !petWindow || petWindow.isDestroyed()) return
    petWindow.webContents.send('fluffy:pet-blur')
  })

  petWindow.on('focus', () => {
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.setMaximizable(false)
    }
  })

  return petWindow
}

export function setPetClickThrough(enabled: boolean): void {
  clickThroughDesired = enabled
  if (!petWindow || petWindow.isDestroyed()) return
  if (menuOpen && enabled) return
  applyIgnoreMouse(enabled)
}

/**
 * 临时开关窗口鼠标忽略（例如菜单打开时）。
 * 仅在 clickThroughDesired 为 true 时才会重新进入穿透。
 */
export function setPetMousePassthrough(ignore: boolean): void {
  if (!petWindow || petWindow.isDestroyed()) return
  if (!clickThroughDesired) {
    applyIgnoreMouse(false)
    return
  }
  if (menuOpen) {
    applyIgnoreMouse(false)
    return
  }
  applyIgnoreMouse(ignore)
}

/** 按当前期望状态重新应用穿透（菜单关闭后调用） */
export function restorePetClickThrough(): void {
  if (!petWindow || petWindow.isDestroyed()) return
  if (menuOpen) {
    applyIgnoreMouse(false)
    return
  }
  applyIgnoreMouse(clickThroughDesired)
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
    applyIgnoreMouse(false)
    return next
  }

  const width = PET_WINDOW.width
  const height = PET_WINDOW.height
  const x = Math.round(current.x + (current.width - width) / 2)
  const y = current.y + current.height - height
  const next = clampToWorkArea({ x, y, width, height })
  petWindow.setBounds(next)
  // 关菜单后按设置恢复穿透，避免锁死或穿透失效
  const desired =
    clickThroughDesired || Boolean(getState().settings.clickThrough)
  clickThroughDesired = desired
  applyIgnoreMouse(desired)
  return next
}
