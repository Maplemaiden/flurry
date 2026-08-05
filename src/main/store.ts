import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { DEFAULT_STATE } from '../shared/defaults'
import type { AppState, AppSettings, CatProfile } from '../shared/types'

function paths(): { dir: string; file: string } {
  const dir = join(app.getPath('userData'), 'fluffy')
  return { dir, file: join(dir, 'state.json') }
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
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
      partial.catSleeping === undefined ? base.catSleeping : Boolean(partial.catSleeping)
  }
}

export function getState(): AppState {
  const { dir, file } = paths()
  ensureDir(dir)
  if (!existsSync(file)) {
    return structuredClone(DEFAULT_STATE)
  }
  try {
    const raw = JSON.parse(readFileSync(file, 'utf-8')) as Partial<AppState>
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
