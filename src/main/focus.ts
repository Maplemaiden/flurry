import { BrowserWindow } from 'electron'
import { IpcChannels } from '../shared/channels'
import {
  DAILY_STUDY_COIN_CAP,
  FOCUS_COIN_REWARD,
  WARM_CARE_AFTER_MS,
  WARM_CARE_COOLDOWN_MS,
  todayKey
} from '../shared/defaults'
import { bumpCatIntimacy } from '../shared/intimacy'
import { skipsEconomyCaps, TEST_FAST_FOCUS_SECONDS, usesFastFocus } from '../shared/testMode'
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
  const fast = usesFastFocus(current.settings)
  const mins = Math.max(1, Math.min(180, minutes ?? current.settings.focusMinutes))
  const durationMs = fast ? TEST_FAST_FOCUS_SECONDS * 1000 : mins * 60 * 1000
  const focusEndsAt = Date.now() + durationMs

  const next = setState({
    focusActive: true,
    focusEndsAt,
    pendingPetEvent: null
  })

  focusTimer = setTimeout(() => {
    stopFocus(true)
  }, durationMs)

  broadcastState(next)
  return next
}

/** @param natural 计时自然结束 → 庆祝 + 亲密度 + 小魚乾 */
export function stopFocus(natural: boolean): AppState {
  clearFocusTimer()
  const current = getState()
  if (!current.focusActive && !current.focusEndsAt) {
    return current
  }

  // 自然结束时奖励小魚乾
  let coinReward = 0
  let dailyCoins = current.dailyCoins
  const skipCaps = skipsEconomyCaps(current.settings)
  if (natural) {
    const today = todayKey()
    if (dailyCoins.date !== today) {
      dailyCoins = { date: today, petCoins: 0, studyCoins: 0, lastPetCoinAt: null }
    }
    if (skipCaps || dailyCoins.studyCoins < DAILY_STUDY_COIN_CAP) {
      coinReward = skipCaps
        ? FOCUS_COIN_REWARD
        : Math.min(FOCUS_COIN_REWARD, DAILY_STUDY_COIN_CAP - dailyCoins.studyCoins)
      dailyCoins = { ...dailyCoins, studyCoins: dailyCoins.studyCoins + coinReward }
    }
  }

  const next = setState({
    focusActive: false,
    focusEndsAt: null,
    pendingPetEvent: natural ? 'celebrate' : null,
    lastInteractionAt: Date.now(),
    cat: natural && current.cat ? bumpCatIntimacy(current.cat, 2) : current.cat,
    fishCoins: current.fishCoins + coinReward,
    dailyCoins
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
