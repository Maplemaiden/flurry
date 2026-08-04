import { ipcMain, screen } from 'electron'
import { IpcChannels } from '../shared/channels'
import type { AppState, PetWindowBounds } from '../shared/types'
import {
  broadcastState,
  clearPetEvent,
  noteInteraction,
  startFocus,
  stopFocus,
  toggleFocus
} from './focus'
import { getState, setState } from './store'
import { createHomeWindow, closeHomeWindow } from './windows/homeWindow'
import { getPetWindow, setPetClickThrough, setPetMenuOpen } from './windows/petWindow'

function clampPetBounds(bounds: PetWindowBounds): PetWindowBounds {
  const point = {
    x: Math.round(bounds.x + bounds.width / 2),
    y: Math.round(bounds.y + bounds.height / 2)
  }
  const wa = screen.getDisplayNearestPoint(point).workArea
  const width = bounds.width
  const height = bounds.height
  const x = Math.min(Math.max(Math.round(bounds.x), wa.x), wa.x + wa.width - width)
  const y = Math.min(Math.max(Math.round(bounds.y), wa.y), wa.y + wa.height - height)
  return { x, y, width, height }
}

export function registerIpc(): void {
  ipcMain.handle(IpcChannels.GET_STATE, () => getState())

  ipcMain.handle(IpcChannels.SET_STATE, (_event, partial: Partial<AppState>) => {
    const prev = getState()
    const next = setState(partial)

    if (
      partial.settings?.clickThrough !== undefined ||
      (partial.settings &&
        next.settings.clickThrough !== prev.settings.clickThrough)
    ) {
      setPetClickThrough(next.settings.clickThrough)
    }

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
    const next = setState({
      settings: { ...getState().settings, clickThrough: enabled }
    })
    broadcastState(next)
    return next
  })

  ipcMain.handle(IpcChannels.MOVE_PET, (_event, bounds: PetWindowBounds) => {
    const pet = getPetWindow()
    if (!pet || pet.isDestroyed()) return null
    const clamped = clampPetBounds(bounds)
    pet.setBounds(clamped)
    return clamped
  })

  ipcMain.handle(IpcChannels.GET_PET_BOUNDS, () => {
    const pet = getPetWindow()
    if (!pet || pet.isDestroyed()) return null
    const b = pet.getBounds()
    return { x: b.x, y: b.y, width: b.width, height: b.height }
  })

  ipcMain.handle(IpcChannels.SET_PET_MENU_OPEN, (_event, open: boolean) => {
    return setPetMenuOpen(Boolean(open))
  })

  ipcMain.handle(IpcChannels.NUDGE_PET, () => {
    const pet = getPetWindow()
    if (pet && !pet.isDestroyed()) {
      pet.showInactive()
      pet.moveTop()
    }
    const next = setState({ pendingPetEvent: 'home-back' })
    broadcastState(next)
    return next
  })

  ipcMain.handle(IpcChannels.START_FOCUS, (_event, minutes?: number) => startFocus(minutes))

  ipcMain.handle(IpcChannels.STOP_FOCUS, (_event, natural?: boolean) =>
    stopFocus(Boolean(natural))
  )

  ipcMain.handle(IpcChannels.TOGGLE_FOCUS, () => toggleFocus())

  ipcMain.handle(IpcChannels.CLEAR_PET_EVENT, () => clearPetEvent())

  ipcMain.handle(IpcChannels.NOTE_INTERACTION, (_event, intimacyDelta?: number) =>
    noteInteraction(intimacyDelta ?? 0)
  )
}
