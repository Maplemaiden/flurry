import { app, BrowserWindow, globalShortcut } from 'electron'
import { broadcastState, hydrateFocusOnLaunch, startWarmCareWatcher } from './focus'
import { registerIpc } from './ipc'
import { isAppQuitting, quitFlurry } from './lifecycle'
import { getState, setState } from './store'
import { createTray, registerEscapeShortcut } from './tray'
import { createHomeWindow } from './windows/homeWindow'
import {
  createPetWindow,
  getPetWindow,
  setPetClickThrough,
  suppressPetPhantomTitleBar
} from './windows/petWindow'

if (process.platform === 'win32') {
  app.setAppUserModelId('com.flurry.desktop')
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const pet = getPetWindow()
    if (pet && !pet.isDestroyed()) {
      pet.showInactive()
    } else {
      createPetWindow()
    }
  })

  app.whenReady().then(() => {
    console.log('[main] app ready, starting boot sequence...')
    try {
      setState({ pendingPetEvent: 'greet' })
    } catch (e) {
      console.error('[main] setState greet failed:', e)
    }

    // 注册 IPC —— 包裹在 try-catch 中，确保失败也能继续启动
    try {
      console.log('[main] calling registerIpc()...')
      registerIpc()
      console.log('[main] registerIpc() returned successfully')
    } catch (err) {
      console.error('[main] FATAL: registerIpc() threw an exception:', err)
      console.error('[main] Stack trace:', (err as Error)?.stack)
    }

    try {
      hydrateFocusOnLaunch()
    } catch (e) {
      console.error('[main] hydrateFocusOnLaunch failed:', e)
    }

    try {
      startWarmCareWatcher()
    } catch (e) {
      console.error('[main] startWarmCareWatcher failed:', e)
    }

    try {
      createTray()
    } catch (e) {
      console.error('[main] createTray failed:', e)
    }

    try {
      registerEscapeShortcut()
    } catch (e) {
      console.error('[main] registerEscapeShortcut failed:', e)
    }

    // 每次启动强制关闭穿透，避免重启后残留“仍可拖拽 / 状态错乱”
    let bootState: ReturnType<typeof setState>
    try {
      bootState = setState({
        settings: { ...getState().settings, clickThrough: false }
      })
      createPetWindow()
      setPetClickThrough(false)
      broadcastState(bootState)
    } catch (e) {
      console.error('[main] pet window init failed:', e)
      bootState = getState()
    }

    // 未领养时打开小窝；可用「返回桌面」关掉
    try {
      if (!bootState.onboardingDone || !bootState.cat) {
        createHomeWindow()
      }
    } catch (e) {
      console.error('[main] createHomeWindow failed:', e)
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        try { createPetWindow() } catch (e) { console.error('[main] activate createPetWindow:', e) }
      }
    })

    // 任意窗失焦时再压一次桌宠 phantom 标题栏（开商店/小窝时最易冒出）
    app.on('browser-window-blur', () => {
      suppressPetPhantomTitleBar()
    })
    app.on('browser-window-focus', () => {
      suppressPetPhantomTitleBar()
    })

    console.log('[main] boot sequence complete')
  }).catch((err) => {
    console.error('[main] FATAL: whenReady promise rejected:', err)
    console.error('[main] Stack trace:', (err as Error)?.stack)
  })

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
  })

  app.on('before-quit', (event) => {
    if (isAppQuitting()) return
    // 从其它路径触发 quit 时，也走强制清理（桌宠 closable:false）
    event.preventDefault()
    quitFlurry()
  })

  app.on('window-all-closed', () => {
    // 托盘保活：仅当用户明确退出时才结束进程
    if (isAppQuitting()) {
      app.quit()
    }
  })
}
