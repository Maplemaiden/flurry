import type { AppState } from './types'

export const DEFAULT_STATE: AppState = {
  onboardingDone: false,
  cat: null,
  settings: {
    opacity: 0.95,
    clickThrough: false,
    focusMinutes: 25,
    muted: false
  },
  focusActive: false
}

/** 桌宠窗口默认尺寸 */
export const PET_WINDOW = {
  width: 160,
  height: 160
} as const

/** 小家窗口默认尺寸 */
export const HOME_WINDOW = {
  width: 720,
  height: 520
} as const
