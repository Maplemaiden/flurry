import { INTIMACY_UNLOCKS } from './defaults'
import type { AppState, CatProfile, IntimacyUnlock } from './types'

export function clampIntimacy(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function bumpCatIntimacy(cat: CatProfile, delta: number): CatProfile {
  return {
    ...cat,
    intimacy: clampIntimacy(cat.intimacy + Math.max(0, delta))
  }
}

/** 根据亲密度返回已解锁项 */
export function getUnlocked(intimacy: number): IntimacyUnlock[] {
  return INTIMACY_UNLOCKS.filter((u) => intimacy >= u.at)
}

export function withInteraction(
  state: AppState,
  intimacyDelta = 0
): Partial<AppState> {
  const partial: Partial<AppState> = {
    lastInteractionAt: Date.now()
  }
  if (state.cat && intimacyDelta > 0) {
    partial.cat = bumpCatIntimacy(state.cat, intimacyDelta)
  }
  return partial
}
