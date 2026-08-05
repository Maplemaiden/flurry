import type { AppState, IntimacyUnlock } from './types'

export const DEFAULT_STATE: AppState = {
  onboardingDone: false,
  cat: null,
  settings: {
    opacity: 0.95,
    clickThrough: false,
    focusMinutes: 25,
    muted: false,
    ambient: 'rain'
  },
  focusActive: false,
  focusEndsAt: null,
  lastInteractionAt: null,
  lastWarmCareAt: null,
  pendingPetEvent: null,
  chatMessage: null,
  catSleeping: false
}

export const PET_WINDOW = {
  width: 100,
  height: 150
} as const

/** 桌宠快捷菜单展开时的窗口尺寸（缩小版，约原一半） */
export const PET_MENU_WINDOW = {
  width: 120,
  height: 200
} as const

/** 桌宠快捷菜单展开「互动」嵌套栏时的窗口尺寸 */
export const PET_MENU_WINDOW_NESTED = {
  width: 150,
  height: 300
} as const

export const HOME_WINDOW = {
  width: 760,
  height: 640
} as const

/** 亲密度解锁（正面亲密表现） */
export const INTIMACY_UNLOCKS: IntimacyUnlock[] = [
  { at: 10, id: 'belly', label: '愿意轻轻露肚皮' },
  { at: 30, id: 'lift', label: '喜欢被举高高' },
  { at: 60, id: 'follow', label: '更黏人的小跟随' }
]

/** 久坐暖心：应用运行多久后可触发（ms） */
export const WARM_CARE_AFTER_MS = 90 * 60 * 1000

/** 暖心冷却（ms） */
export const WARM_CARE_COOLDOWN_MS = 90 * 60 * 1000

/** 无互动多久后桌宠倾向睡觉（ms） */
export const IDLE_SLEEP_AFTER_MS = 3 * 60 * 1000
