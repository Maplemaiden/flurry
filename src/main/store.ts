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

  let cat: CatProfile | null
  if (partial.cat === null) {
    cat = null
  } else if (partial.cat) {
    cat = { ...(base.cat ?? partial.cat), ...partial.cat }
  } else {
    cat = base.cat
  }

  return {
    ...base,
    ...partial,
    settings,
    cat
  }
}

export function getState(): AppState {
  const { dir, file } = paths()
  ensureDir(dir)
  if (!existsSync(file)) {
    return { ...DEFAULT_STATE, settings: { ...DEFAULT_STATE.settings } }
  }
  try {
    const raw = JSON.parse(readFileSync(file, 'utf-8')) as Partial<AppState>
    return mergeState(DEFAULT_STATE, raw)
  } catch {
    return { ...DEFAULT_STATE, settings: { ...DEFAULT_STATE.settings } }
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
  const fresh = { ...DEFAULT_STATE, settings: { ...DEFAULT_STATE.settings } }
  writeFileSync(file, JSON.stringify(fresh, null, 2), 'utf-8')
  return fresh
}
