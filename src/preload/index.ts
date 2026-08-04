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

  movePet: (bounds: PetWindowBounds): Promise<PetWindowBounds | null> =>
    ipcRenderer.invoke(IpcChannels.MOVE_PET, bounds),

  startFocus: (minutes?: number): Promise<AppState> =>
    ipcRenderer.invoke(IpcChannels.START_FOCUS, minutes),

  stopFocus: (natural?: boolean): Promise<AppState> =>
    ipcRenderer.invoke(IpcChannels.STOP_FOCUS, natural),

  toggleFocus: (): Promise<AppState> => ipcRenderer.invoke(IpcChannels.TOGGLE_FOCUS),

  clearPetEvent: (): Promise<AppState> => ipcRenderer.invoke(IpcChannels.CLEAR_PET_EVENT),

  noteInteraction: (intimacyDelta?: number): Promise<AppState> =>
    ipcRenderer.invoke(IpcChannels.NOTE_INTERACTION, intimacyDelta),

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
