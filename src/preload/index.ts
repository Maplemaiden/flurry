import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels } from '../shared/channels'
import type { AppState, ItemEffect, PetWindowBounds, ShopCategory } from '../shared/types'

const fluffyApi = {
  getState: (): Promise<AppState> => ipcRenderer.invoke(IpcChannels.GET_STATE),

  setState: (partial: Partial<AppState>): Promise<AppState> =>
    ipcRenderer.invoke(IpcChannels.SET_STATE, partial),

  openHome: (): Promise<void> => ipcRenderer.invoke(IpcChannels.OPEN_HOME),

  closeHome: (): Promise<void> => ipcRenderer.invoke(IpcChannels.CLOSE_HOME),

  setClickThrough: (enabled: boolean): Promise<AppState> =>
    ipcRenderer.invoke(IpcChannels.SET_CLICK_THROUGH, enabled),

  /** 穿透热区：true=忽略鼠标穿透，false=临时可点猫 */
  setPetMousePassthrough: (ignore: boolean): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.SET_PET_MOUSE_PASSTHROUGH, ignore),

  movePet: (bounds: PetWindowBounds): Promise<PetWindowBounds | null> =>
    ipcRenderer.invoke(IpcChannels.MOVE_PET, bounds),

  getPetBounds: (): Promise<PetWindowBounds | null> =>
    ipcRenderer.invoke(IpcChannels.GET_PET_BOUNDS),

  setPetMenuOpen: (open: boolean, nested?: boolean): Promise<PetWindowBounds | null> =>
    ipcRenderer.invoke(IpcChannels.SET_PET_MENU_OPEN, open, nested),

  nudgePet: (): Promise<AppState> => ipcRenderer.invoke(IpcChannels.NUDGE_PET),

  onPetBlur: (callback: () => void): (() => void) => {
    const listener = (): void => {
      callback()
    }
    ipcRenderer.on('fluffy:pet-blur', listener)
    return () => ipcRenderer.removeListener('fluffy:pet-blur', listener)
  },

  startFocus: (minutes?: number): Promise<AppState> =>
    ipcRenderer.invoke(IpcChannels.START_FOCUS, minutes),

  stopFocus: (natural?: boolean): Promise<AppState> =>
    ipcRenderer.invoke(IpcChannels.STOP_FOCUS, natural),

  toggleFocus: (): Promise<AppState> => ipcRenderer.invoke(IpcChannels.TOGGLE_FOCUS),

  clearPetEvent: (): Promise<AppState> => ipcRenderer.invoke(IpcChannels.CLEAR_PET_EVENT),

  noteInteraction: (intimacyDelta?: number): Promise<AppState> =>
    ipcRenderer.invoke(IpcChannels.NOTE_INTERACTION, intimacyDelta),

  openShop: (): Promise<void> => ipcRenderer.invoke(IpcChannels.OPEN_SHOP),

  buyItem: (itemId: string): Promise<AppState> =>
    ipcRenderer.invoke(IpcChannels.BUY_ITEM, itemId),

  earnPetCoins: (): Promise<{ state: AppState; earned: number }> =>
    ipcRenderer.invoke(IpcChannels.EARN_PET_COINS),

  openBackpack: (category?: ShopCategory): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.OPEN_BACKPACK, category),

  useItem: (itemId: string): Promise<{ state: AppState; effect: ItemEffect | null }> =>
    ipcRenderer.invoke(IpcChannels.USE_ITEM, itemId),

  onBackpackCategory: (callback: (category: ShopCategory) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, category: ShopCategory): void => {
      callback(category)
    }
    ipcRenderer.on('fluffy:backpack-category', listener)
    return () => ipcRenderer.removeListener('fluffy:backpack-category', listener)
  },

  onMenuFlip: (callback: (direction: 'left' | 'right' | 'none') => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, direction: 'left' | 'right' | 'none'): void => {
      callback(direction)
    }
    ipcRenderer.on('fluffy:menu-flip', listener)
    return () => ipcRenderer.removeListener('fluffy:menu-flip', listener)
  },

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
