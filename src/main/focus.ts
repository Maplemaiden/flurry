import { BrowserWindow } from 'electron'
import { IpcChannels } from '../shared/channels'
import { WARM_CARE_AFTER_MS, WARM_CARE_COOLDOWN_MS } from '../shared/defaults'
import { bumpCatIntimacy } from '../shared/intimacy'
import type { AppState } from '../shared/types'
import { getState, setState } from './store'

let focusTimer: ReturnType<typeof setTimeout> | null = null
let warmCareTimer: ReturnType<typeof setInterval> | null = null
const sessionStartedAt = Date.now()

export function broadcastState(state: AppState): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(IpcChannels.STATE_CHANGED, state)
    }
  }
}

function clearFocusTimer(): void {
  if (focusTimer) {
    clearTimeout(focusTimer)
    focusTimer = null
  }
}

export function startFocus(minutes?: number): AppState {
  clearFocusTimer()
  const current = getState()
  const mins = Math.max(1, Math.min(180, minutes ?? current.settings.focusMinutes))
  const focusEndsAt = Date.now() + mins * 60 * 1000

  const next = setState({
    focusActive: true,
    focusEndsAt,
    pendingPetEvent: null
  })

  focusTimer = setTimeout(() => {
    stopFocus(true)
  }, mins * 60 * 1000)

  broadcastState(next)
  return next
}

/** @param natural 计时自然结束 → 庆祝 + 亲密度 */
export function stopFocus(natural: boolean): AppState {
  clearFocusTimer()
  const current = getState()
  if (!current.focusActive && !current.focusEndsAt) {
    return current
  }

  let next = setState({
    focusActive: false,
    focusEndsAt: null,
    pendingPetEvent: natural ? 'celebrate' : null,
    lastInteractionAt: Date.now(),
    cat: natural && current.cat ? bumpCatIntimacy(current.cat, 2) : current.cat
  })

  broadcastState(next)
  return next
}

export function toggleFocus(): AppState {
  const current = getState()
  if (current.focusActive) {
    return stopFocus(false)
  }
  return startFocus()
}

export function clearPetEvent(): AppState {
  const next = setState({ pendingPetEvent: null })
  broadcastState(next)
  return next
}

export function noteInteraction(intimacyDelta = 0): AppState {
  const current = getState()
  const next = setState({
    lastInteractionAt: Date.now(),
    cat:
      current.cat && intimacyDelta > 0
        ? bumpCatIntimacy(current.cat, intimacyDelta)
        : current.cat
  })
  broadcastState(next)
  return next
}

export function startWarmCareWatcher(): void {
  if (warmCareTimer) return

  warmCareTimer = setInterval(() => {
    const state = getState()
    if (state.focusActive) return

    const now = Date.now()
    const sessionLongEnough = now - sessionStartedAt >= WARM_CARE_AFTER_MS
    const cooled =
      !state.lastWarmCareAt || now - state.lastWarmCareAt >= WARM_CARE_COOLDOWN_MS

    if (sessionLongEnough && cooled && !state.pendingPetEvent) {
      const next = setState({
        pendingPetEvent: 'warm-care',
        lastWarmCareAt: now
      })
      broadcastState(next)
    }
  }, 60 * 1000)
}

/** 应用启动时若上次异常退出仍标记专注，则清理 */
export function hydrateFocusOnLaunch(): void {
  const state = getState()
  if (!state.focusActive || !state.focusEndsAt) {
    if (state.focusActive) {
      setState({ focusActive: false, focusEndsAt: null })
    }
    return
  }

  const remaining = state.focusEndsAt - Date.now()
  if (remaining <= 0) {
    stopFocus(true)
    return
  }

  clearFocusTimer()
  focusTimer = setTimeout(() => stopFocus(true), remaining)
}
