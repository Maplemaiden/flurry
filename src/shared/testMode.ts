import type { AppSettings } from './types'

/** 测试模式下专注计时秒数（替代分钟） */
export const TEST_FAST_FOCUS_SECONDS = 10

export function isTestMode(settings: AppSettings): boolean {
  return Boolean(settings.testMode)
}

export function hasInfiniteCoins(settings: AppSettings): boolean {
  return isTestMode(settings) && Boolean(settings.testInfiniteCoins)
}

export function skipsEconomyCaps(settings: AppSettings): boolean {
  return isTestMode(settings) && Boolean(settings.testSkipCaps)
}

export function usesFastFocus(settings: AppSettings): boolean {
  return isTestMode(settings) && Boolean(settings.testFastFocus)
}

export type TestAction =
  | 'skip-onboard'
  | 'add-coins'
  | 'fill-backpack'
  | 'clear-backpack'
  | 'reset-daily'
  | 'trigger-event'
  | 'reset-state'
