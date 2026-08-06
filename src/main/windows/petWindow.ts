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
  const margin = 4
  const x = Math.min(
    Math.max(bounds.x, wa.x + margin),
    wa.x + wa.width - bounds.width - margin
  )
  const y = Math.min(
    Math.max(bounds.y, wa.y + margin),
    wa.y + wa.height - bounds.height - margin
  )
  return { ...bounds, x, y }
}

function applyIgnoreMouse(ignore: boolean): void {
  if (!petWindow || petWindow.isDestroyed()) return
  // 穿透必须是完整忽略：不要 { forward:true }，否则热区/移入事件会把穿透打穿
  petWindow.setIgnoreMouseEvents(ignore)
}

/**
 * 压制 Windows 透明无边框窗上方的空标题栏残影（常呈蓝色）。
 * Electron 在失焦时可能画出 phantom caption；重申 maximizable + 微抖尺寸强制重绘。
 */
export function suppressPetPhantomTitleBar(): void {
  if (!petWindow || petWindow.isDestroyed()) return
  petWindow.setMaximizable(false)
  petWindow.setMinimizable(false)
  // 微抖高度触发 DWM 重绘，清掉残影（不改变菜单展开后的逻辑尺寸）
  if (menuOpen) return
  const [w, h] = petWindow.getSize()
  const wasResizable = petWindow.isResizable()
  petWindow.setResizable(true)
  petWindow.setSize(w, h + 1)
  petWindow.setSize(w, h)
  petWindow.setResizable(wasResizable)
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
    // toolbar 类型在 Win 上更不易画出普通窗口 caption
    ...(process.platform === 'win32' ? { type: 'toolbar' as const } : {}),
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
  petWindow.setMenuBarVisibility(false)
  petWindow.removeMenu()
  petWindow.setTitle('')

  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  petWindow.setAlwaysOnTop(true, 'screen-saver')

  if (isDev()) {
    petWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/pet/index.html`)
  } else {
    petWindow.loadFile(join(__dirname, '../renderer/pet/index.html'))
  }

  petWindow.once('ready-to-show', () => {
    petWindow?.showInactive()
    suppressPetPhantomTitleBar()
    if (clickThroughDesired) applyIgnoreMouse(true)
  })

  petWindow.on('closed', () => {
    petWindow = null
    menuOpen = false
  })

  petWindow.on('blur', () => {
    suppressPetPhantomTitleBar()
    if (!menuOpen || !petWindow || petWindow.isDestroyed()) return
    petWindow.webContents.send('fluffy:pet-blur')
  })

  petWindow.on('focus', () => {
    suppressPetPhantomTitleBar()
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

/** 展开菜单时按是否嵌套二级栏调整窗口尺寸；收起时还原；自动处理边缘遮挡 */
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

    // 检查是否需要翻转菜单：当窗口距离屏幕边缘 <= 24px 时翻转
    const wa = screen.getDisplayNearestPoint({ x: next.x + next.width / 2, y: next.y + next.height / 2 }).workArea
    const rightEdge = next.x + next.width
    const leftEdge = next.x
    const screenRight = wa.x + wa.width
    const screenLeft = wa.x

    const EDGE_THRESHOLD = 24
    const flipRight = (screenRight - rightEdge) <= EDGE_THRESHOLD
    const flipLeft = (leftEdge - screenLeft) <= EDGE_THRESHOLD

    const wc = petWindow.webContents
    if (flipRight && !flipLeft) {
      wc.send('fluffy:menu-flip', 'right')
    } else if (flipLeft && !flipRight) {
      wc.send('fluffy:menu-flip', 'left')
    } else {
      wc.send('fluffy:menu-flip', 'none')
    }

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
  // 关菜单时重置翻转状态
  petWindow.webContents.send('fluffy:menu-flip', 'none')
  // 关菜单后按设置恢复穿透，避免锁死或穿透失效
  const desired =
    clickThroughDesired || Boolean(getState().settings.clickThrough)
  clickThroughDesired = desired
  applyIgnoreMouse(desired)
  return next
}
