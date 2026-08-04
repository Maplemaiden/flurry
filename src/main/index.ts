import { app, BrowserWindow } from 'electron'
import { hydrateFocusOnLaunch, startWarmCareWatcher } from './focus'
import { registerIpc } from './ipc'
import { getState, setState } from './store'
import { createTray } from './tray'
import { createPetWindow, setPetClickThrough } from './windows/petWindow'

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const pet = BrowserWindow.getAllWindows()[0]
    if (pet) {
      if (pet.isMinimized()) pet.restore()
      pet.showInactive()
    }
  })

  app.whenReady().then(() => {
    // 每次启动给一次迎接事件（桌宠消费）
    setState({ pendingPetEvent: 'greet' })

    registerIpc()
    hydrateFocusOnLaunch()
    startWarmCareWatcher()
    createTray()
    createPetWindow()

    const { settings } = getState()
    if (settings.clickThrough) {
      setPetClickThrough(true)
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createPetWindow()
      }
    })
  })

  app.on('window-all-closed', () => {
    // 托盘保活
  })
}
