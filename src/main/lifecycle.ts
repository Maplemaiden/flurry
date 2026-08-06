import { app, BrowserWindow, globalShortcut } from 'electron'

let quitting = false
let trayDestroy: (() => void) | null = null

export function isAppQuitting(): boolean {
  return quitting
}

/** 由 tray 模块注册销毁回调，避免循环依赖 */
export function registerTrayDestroy(fn: () => void): void {
  trayDestroy = fn
}

/**
 * 真正退出：桌宠窗 closable:false + 托盘保活会导致 app.quit() 无效，
 * 必须先 destroy 所有窗并拆掉托盘。
 */
export function quitFlurry(): void {
  if (quitting) return
  quitting = true
  console.log('[main] quitFlurry: shutting down...')

  try {
    globalShortcut.unregisterAll()
  } catch {
    /* ignore */
  }

  try {
    trayDestroy?.()
  } catch (e) {
    console.error('[main] tray destroy failed:', e)
  }

  for (const win of BrowserWindow.getAllWindows()) {
    try {
      win.removeAllListeners('close')
      if (!win.isDestroyed()) win.destroy()
    } catch (e) {
      console.error('[main] window destroy failed:', e)
    }
  }

  app.quit()
  // 兜底：若仍卡在 quit 流程，强制结束进程（让 electron-vite 终端也能退出）
  setTimeout(() => {
    console.log('[main] quitFlurry: force app.exit(0)')
    app.exit(0)
  }, 800)
}
