import { app, BrowserWindow } from 'electron'
import { registerIpc } from './ipc'
import { createTray } from './tray'
import { createPetWindow, setPetClickThrough } from './windows/petWindow'
import { getState } from './store'

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const pet = BrowserWindow.getAllWindows()[0]
    if (pet) {
      if (pet.isMinimized()) pet.restore()
      pet.focus()
    }
  })

  app.whenReady().then(() => {
    registerIpc()
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

  // 桌宠常驻：关闭所有窗口时不退出（托盘保活）；macOS 除外惯例另议
  app.on('window-all-closed', () => {
    // 保留托盘进程；用户从托盘选「退出」才真正退出
  })
}
