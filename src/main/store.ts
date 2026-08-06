import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { DEFAULT_STATE, todayKey } from '../shared/defaults'
import type { AppState, AppSettings, CatProfile, DailyCoinTracker } from '../shared/types'

function paths(): { dir: string; file: string } {
  const dir = join(app.getPath('userData'), 'fluffy')
  return { dir, file: join(dir, 'state.json') }
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

/** 合并背包；兼容旧版 inventory: string[] 迁移为 backpack: Record<string, number> */
function mergeBackpack(
  base: Record<string, number>,
  partial: Record<string, number> | undefined,
  legacyInventory: string[] | undefined
): Record<string, number> {
  let result: Record<string, number> = { ...base }
  // 旧版 inventory 迁移：每项记为 1
  if (Array.isArray(legacyInventory)) {
    for (const id of legacyInventory) {
      if (!(id in result)) result[id] = 1
    }
  }
  if (partial) {
    for (const [id, count] of Object.entries(partial)) {
      const n = Math.max(0, Math.round(count))
      if (n <= 0) {
        delete result[id]
      } else {
        result[id] = n
      }
    }
  }
  return result
}

function mergeState(base: AppState, partial: Partial<AppState>): AppState {
  const settings: AppSettings = {
    ...base.settings,
    ...(partial.settings ?? {})
  }

  if (settings.opacity < 0.3) settings.opacity = 0.3
  if (settings.opacity > 1) settings.opacity = 1
  if (settings.focusMinutes < 1) settings.focusMinutes = 1
  if (settings.focusMinutes > 180) settings.focusMinutes = 180

  let cat: CatProfile | null
  if (partial.cat === null) {
    cat = null
  } else if (partial.cat) {
    cat = { ...(base.cat ?? partial.cat), ...partial.cat }
    cat.intimacy = Math.max(0, Math.min(100, Math.round(cat.intimacy)))
    cat.name = cat.name.trim().slice(0, 12) || 'Fluffy'
  } else {
    cat = base.cat
  }

  return {
    ...base,
    ...partial,
    settings,
    cat,
    focusEndsAt:
      partial.focusEndsAt === undefined ? base.focusEndsAt : partial.focusEndsAt,
    lastInteractionAt:
      partial.lastInteractionAt === undefined
        ? base.lastInteractionAt
        : partial.lastInteractionAt,
    lastWarmCareAt:
      partial.lastWarmCareAt === undefined ? base.lastWarmCareAt : partial.lastWarmCareAt,
    pendingPetEvent:
      partial.pendingPetEvent === undefined
        ? base.pendingPetEvent
        : partial.pendingPetEvent,
    chatMessage:
      partial.chatMessage === undefined ? base.chatMessage : partial.chatMessage,
    catSleeping:
      partial.catSleeping === undefined ? base.catSleeping : Boolean(partial.catSleeping),
    fishCoins:
      partial.fishCoins === undefined
        ? base.fishCoins
        : Math.max(0, Math.round(partial.fishCoins)),
    backpack: mergeBackpack(base.backpack, partial.backpack, undefined),
    dailyCoins: mergeDailyCoins(base.dailyCoins, partial.dailyCoins)
  }
}

/** 合并每日小魚乾追踪；跨日时自动重置当日计数 */
function mergeDailyCoins(
  base: DailyCoinTracker,
  partial: DailyCoinTracker | undefined
): DailyCoinTracker {
  if (!partial) return base
  const today = todayKey()
  const baseToday = base.date === today ? base : { date: today, petCoins: 0, studyCoins: 0, lastPetCoinAt: null }
  return {
    date: partial.date ?? baseToday.date,
    petCoins: Math.max(0, Math.round(partial.petCoins ?? baseToday.petCoins)),
    studyCoins: Math.max(0, Math.round(partial.studyCoins ?? baseToday.studyCoins)),
    lastPetCoinAt: partial.lastPetCoinAt ?? baseToday.lastPetCoinAt
  }
}

export function getState(): AppState {
  const { dir, file } = paths()
  ensureDir(dir)
  if (!existsSync(file)) {
    return structuredClone(DEFAULT_STATE)
  }
  try {
    const raw = JSON.parse(readFileSync(file, 'utf-8')) as Partial<AppState> & {
      inventory?: string[]
    }
    // 旧版迁移：inventory: string[] → backpack: Record<string, number>
    if (Array.isArray(raw.inventory) && !raw.backpack) {
      const migrated: Record<string, number> = {}
      for (const id of raw.inventory) {
        migrated[id] = (migrated[id] ?? 0) + 1
      }
      raw.backpack = migrated
      delete raw.inventory
    }
    return mergeState(structuredClone(DEFAULT_STATE), raw)
  } catch {
    return structuredClone(DEFAULT_STATE)
  }
}

export function setState(partial: Partial<AppState>): AppState {
  const next = mergeState(getState(), partial)
  const { dir, file } = paths()
  ensureDir(dir)
  writeFileSync(file, JSON.stringify(next, null, 2), 'utf-8')
  return next
}

export function resetState(): AppState {
  const { dir, file } = paths()
  ensureDir(dir)
  const fresh = structuredClone(DEFAULT_STATE)
  writeFileSync(file, JSON.stringify(fresh, null, 2), 'utf-8')
  return fresh
}
