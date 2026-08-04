import { BrowserWindow, ipcMain } from 'electron'
import { IpcChannels } from '../shared/channels'
import type { AppState, PetWindowBounds } from '../shared/types'
import { getState, setState } from './store'
import { createHomeWindow, closeHomeWindow } from './windows/homeWindow'
import { getPetWindow, setPetClickThrough } from './windows/petWindow'

function broadcastState(state: AppState): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(IpcChannels.STATE_CHANGED, state)
  }
}

export function registerIpc(): void {
  ipcMain.handle(IpcChannels.GET_STATE, () => getState())

  ipcMain.handle(IpcChannels.SET_STATE, (_event, partial: Partial<AppState>) => {
    const next = setState(partial)
    broadcastState(next)
    return next
  })

  ipcMain.handle(IpcChannels.OPEN_HOME, () => {
    createHomeWindow()
  })

  ipcMain.handle(IpcChannels.CLOSE_HOME, () => {
    closeHomeWindow()
  })

  ipcMain.handle(IpcChannels.SET_CLICK_THROUGH, (_event, enabled: boolean) => {
    setPetClickThrough(enabled)
    const next = setState({ settings: { ...getState().settings, clickThrough: enabled } })
    broadcastState(next)
    return next
  })

  ipcMain.handle(IpcChannels.MOVE_PET, (_event, bounds: PetWindowBounds) => {
    const pet = getPetWindow()
    if (!pet || pet.isDestroyed()) return
    pet.setBounds({
      x: Math.round(bounds.x),
      y: Math.round(bounds.y),
      width: bounds.width,
      height: bounds.height
    })
  })

  ipcMain.handle(IpcChannels.TOGGLE_FOCUS, () => {
    const current = getState()
    const next = setState({ focusActive: !current.focusActive })
    broadcastState(next)
    return next
  })
}
