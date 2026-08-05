import { app, BrowserWindow, globalShortcut } from 'electron'
import { broadcastState, hydrateFocusOnLaunch, startWarmCareWatcher } from './focus'
import { registerIpc } from './ipc'
import { getState, setState } from './store'
import { createTray, registerEscapeShortcut } from './tray'
import { createHomeWindow } from './windows/homeWindow'
import { createPetWindow, getPetWindow, setPetClickThrough } from './windows/petWindow'

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
    setState({ pendingPetEvent: 'greet' })

    registerIpc()
    hydrateFocusOnLaunch()
    startWarmCareWatcher()
    createTray()
    registerEscapeShortcut()

    // 每次启动强制关闭穿透，避免重启后残留“仍可拖拽 / 状态错乱”
    const bootState = setState({
      settings: { ...getState().settings, clickThrough: false }
    })
    createPetWindow()
    setPetClickThrough(false)
    broadcastState(bootState)

    // 未领养时打开小窝；可用「返回桌面」关掉
    if (!bootState.onboardingDone || !bootState.cat) {
      createHomeWindow()
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createPetWindow()
      }
    })
  })

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
  })

  app.on('window-all-closed', () => {
    // 托盘保活
  })
}
