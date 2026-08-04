import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels } from '../shared/channels'
import type { AppState, PetWindowBounds } from '../shared/types'

const fluffyApi = {
  getState: (): Promise<AppState> => ipcRenderer.invoke(IpcChannels.GET_STATE),

  setState: (partial: Partial<AppState>): Promise<AppState> =>
    ipcRenderer.invoke(IpcChannels.SET_STATE, partial),

  openHome: (): Promise<void> => ipcRenderer.invoke(IpcChannels.OPEN_HOME),

  closeHome: (): Promise<void> => ipcRenderer.invoke(IpcChannels.CLOSE_HOME),

  setClickThrough: (enabled: boolean): Promise<AppState> =>
    ipcRenderer.invoke(IpcChannels.SET_CLICK_THROUGH, enabled),

  movePet: (bounds: PetWindowBounds): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.MOVE_PET, bounds),

  toggleFocus: (): Promise<AppState> => ipcRenderer.invoke(IpcChannels.TOGGLE_FOCUS),

  onStateChanged: (callback: (state: AppState) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: AppState): void => {
      callback(state)
    }
    ipcRenderer.on(IpcChannels.STATE_CHANGED, listener)
    return () => ipcRenderer.removeListener(IpcChannels.STATE_CHANGED, listener)
  }
}

contextBridge.exposeInMainWorld('fluffy', fluffyApi)

export type FluffyApi = typeof fluffyApi
