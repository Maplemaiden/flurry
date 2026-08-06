import { ipcMain, screen } from 'electron'
import { IpcChannels } from '../shared/channels'
import { DAILY_PET_COIN_CAP, PET_COIN_COOLDOWN_MS, todayKey } from '../shared/defaults'
import { findShopItem, getItemEffect, isConsumable } from '../shared/shop-items'
import type { AppState, ItemEffect, PetWindowBounds, ShopCategory } from '../shared/types'
import {
  broadcastState,
  clearPetEvent,
  noteInteraction,
  startFocus,
  stopFocus,
  toggleFocus
} from './focus'
import { getState, setState } from './store'
import { createBackpackWindow } from './windows/backpackWindow'
import { createHomeWindow, closeHomeWindow } from './windows/homeWindow'
import {
  getPetWindow,
  setPetClickThrough,
  setPetMenuOpen,
  setPetMousePassthrough
} from './windows/petWindow'
import { createShopWindow } from './windows/shopWindow'

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

/**
 * 健壮 IPC handler 注册
 * - 处理 HMR 导致的重复注册（将其视为成功）
 * - 所有 handler 显式返回 undefined 以避免序列化问题
 */
function safeHandle(channel: string, handler: (...args: any[]) => any): boolean {
  try {
    ipcMain.handle(channel, handler)
    console.log(`[ipc] ✓ ${channel}`)
    return true
  } catch (e) {
    const msg = (e as Error).message
    // HMR 导致的重复注册 —— handler 已存在，视为成功
    if (msg.includes('already registered') || msg.includes('Handler') || msg.includes('handle')) {
      console.log(`[ipc] ⚠️ ${channel} already registered (HMR/restart), reusing existing handler`)
      return true
    }
    console.error(`[ipc] ✗ FAILED ${channel}:`, msg)
    return false
  }
}

export function registerIpc(): void {
  console.log('[ipc] === registerIpc() START ===')
  let ok = 0, fail = 0

  const channels: { ch: string; fn: (...args: any[]) => any }[] = [
    { ch: IpcChannels.GET_STATE, fn: () => getState() },

    { ch: IpcChannels.SET_STATE, fn: (_event, partial: Partial<AppState>) => {
      const prev = getState()
      const next = setState(partial)
      if (partial.settings?.clickThrough !== undefined) {
        setPetClickThrough(next.settings.clickThrough)
      }
      broadcastState(next)
      return next
    }},

    { ch: IpcChannels.OPEN_HOME, fn: () => { createHomeWindow() } },
    { ch: IpcChannels.CLOSE_HOME, fn: () => { closeHomeWindow() } },

    { ch: IpcChannels.SET_CLICK_THROUGH, fn: (_event, enabled: boolean) => {
      setPetClickThrough(enabled)
      const next = setState({
        settings: { ...getState().settings, clickThrough: enabled }
      })
      broadcastState(next)
      return next
    }},

    { ch: IpcChannels.SET_PET_MOUSE_PASSTHROUGH, fn: (_event, ignore: boolean) => {
      setPetMousePassthrough(Boolean(ignore))
    }},

    { ch: IpcChannels.MOVE_PET, fn: (_event, bounds: PetWindowBounds) => {
      const pet = getPetWindow()
      if (!pet || pet.isDestroyed()) return null
      const clamped = clampPetBounds(bounds)
      pet.setBounds(clamped)
      return clamped
    }},

    { ch: IpcChannels.GET_PET_BOUNDS, fn: () => {
      const pet = getPetWindow()
      if (!pet || pet.isDestroyed()) return null
      const b = pet.getBounds()
      return { x: b.x, y: b.y, width: b.width, height: b.height }
    }},

    { ch: IpcChannels.SET_PET_MENU_OPEN, fn: (_event, open: boolean, nested?: boolean) => {
      return setPetMenuOpen(Boolean(open), Boolean(nested))
    }},

    { ch: IpcChannels.NUDGE_PET, fn: () => {
      const pet = getPetWindow()
      if (pet && !pet.isDestroyed()) {
        pet.showInactive()
        pet.moveTop()
      }
      const next = setState({ pendingPetEvent: 'home-back' })
      broadcastState(next)
      return next
    }},

    { ch: IpcChannels.START_FOCUS, fn: (_event, minutes?: number) => startFocus(minutes) },
    { ch: IpcChannels.STOP_FOCUS, fn: (_event, natural?: boolean) => stopFocus(Boolean(natural)) },
    { ch: IpcChannels.TOGGLE_FOCUS, fn: () => toggleFocus() },
    { ch: IpcChannels.CLEAR_PET_EVENT, fn: () => clearPetEvent() },
    { ch: IpcChannels.NOTE_INTERACTION, fn: (_event, intimacyDelta?: number) => noteInteraction(intimacyDelta ?? 0) },

    { ch: IpcChannels.OPEN_SHOP, fn: () => { createShopWindow() } },

    { ch: IpcChannels.BUY_ITEM, fn: (_event, itemId: string): AppState => {
      const item = findShopItem(itemId)
      if (!item || item.placeholder) return getState()
      const state = getState()
      const owned = state.backpack[itemId] ?? 0
      if (!isConsumable(item) && owned > 0) return state
      if (state.fishCoins < item.price) return state
      const nextBackpack = { ...state.backpack, [itemId]: owned + 1 }
      const next = setState({
        fishCoins: state.fishCoins - item.price,
        backpack: nextBackpack
      })
      broadcastState(next)
      return next
    }},

    { ch: IpcChannels.EARN_PET_COINS, fn: (): { state: AppState; earned: number } => {
      const current = getState()
      const now = Date.now()
      let dailyCoins = current.dailyCoins
      const today = todayKey()
      if (dailyCoins.date !== today) {
        dailyCoins = { date: today, petCoins: 0, studyCoins: 0, lastPetCoinAt: null }
      }
      if (dailyCoins.lastPetCoinAt && now - dailyCoins.lastPetCoinAt < PET_COIN_COOLDOWN_MS) {
        return { state: current, earned: 0 }
      }
      if (dailyCoins.petCoins >= DAILY_PET_COIN_CAP) {
        return { state: current, earned: 0 }
      }
      const earned = Math.random() < 0.5 ? 1 : 2
      const gained = Math.min(earned, DAILY_PET_COIN_CAP - dailyCoins.petCoins)
      dailyCoins = {
        ...dailyCoins,
        petCoins: dailyCoins.petCoins + gained,
        lastPetCoinAt: now
      }
      const next = setState({
        fishCoins: current.fishCoins + gained,
        dailyCoins
      })
      broadcastState(next)
      return { state: next, earned: gained }
    }},

    // ✅ 背包打开 —— 关键
    { ch: IpcChannels.OPEN_BACKPACK, fn: (_event, category?: ShopCategory): undefined => {
      console.log('[ipc] OPEN_BACKPACK called with category:', category)
      try {
        createBackpackWindow(category)
        console.log('[ipc] createBackpackWindow() called successfully')
      } catch (e) {
        console.error('[ipc] createBackpackWindow FAILED:', e)
        throw e
      }
      return undefined
    }},

    { ch: IpcChannels.USE_ITEM, fn: (_event, itemId: string): { state: AppState; effect: ItemEffect | null } => {
      const effect = getItemEffect(itemId)
      const state = getState()
      const owned = state.backpack[itemId] ?? 0
      if (!effect || owned <= 0) {
        return { state, effect: null }
      }
      let nextBackpack = state.backpack
      if (effect.consume) {
        nextBackpack = { ...state.backpack }
        const remain = owned - 1
        if (remain <= 0) {
          delete nextBackpack[itemId]
        } else {
          nextBackpack[itemId] = remain
        }
      }
      const next = setState({
        backpack: nextBackpack,
        pendingPetEvent: 'celebrate',
        chatMessage: effect.bubble,
        lastInteractionAt: Date.now(),
        cat:
          state.cat && effect.intimacyDelta > 0
            ? { ...state.cat, intimacy: Math.min(100, state.cat.intimacy + effect.intimacyDelta) }
            : state.cat
      })
      broadcastState(next)
      return { state: next, effect }
    }}
  ]

  for (const { ch, fn } of channels) {
    const result = safeHandle(ch, fn)
    if (result) ok++; else fail++
  }

  console.log(`[ipc] === registerIpc() DONE: ${ok} OK, ${fail} FAILED ===`)

  // 验证 OPEN_BACKPACK 是否真的注册了
  try {
    const listeners = ipcMain.listenerCount(IpcChannels.OPEN_BACKPACK)
    console.log(`[ipc] OPEN_BACKPACK listener count: ${listeners}`)
    if (listeners === 0) {
      console.error('[ipc] ⚠️ OPEN_BACKPACK HAS NO LISTENERS!')
    }
  } catch (e) {
    console.error('[ipc] Could not check listener count:', e)
  }
}
