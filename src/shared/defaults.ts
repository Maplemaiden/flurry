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
  catSleeping: false,
  fishCoins: 50,
  backpack: {},
  dailyCoins: { date: '', petCoins: 0, studyCoins: 0, lastPetCoinAt: null }
}

export const PET_WINDOW = {
  width: 100,
  height: 150
} as const

/** 桌宠快捷菜单展开时的窗口尺寸 */
export const PET_MENU_WINDOW = {
  width: 150,
  height: 250
} as const

/** 桌宠快捷菜单展开「互动」嵌套栏时的窗口尺寸 */
export const PET_MENU_WINDOW_NESTED = {
  width: 180,
  height: 340
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

/* —— 商店 / 小魚乾 经济系统 —— */

/** 商店窗口尺寸 */
export const SHOP_WINDOW = { width: 820, height: 620 } as const

/** 背包窗口尺寸 */
export const BACKPACK_WINDOW = { width: 760, height: 600 } as const

/** 抚摸获取小魚乾冷却（ms） */
export const PET_COIN_COOLDOWN_MS = 15 * 1000

/** 每日抚摸获取小魚乾上限 */
export const DAILY_PET_COIN_CAP = 30

/** 每日学习陪伴获取小魚乾上限 */
export const DAILY_STUDY_COIN_CAP = 40

/** 自然结束一次专注的小魚乾奖励 */
export const FOCUS_COIN_REWARD = 5

/** 今日日期键（YYYY-MM-DD），用于每日上限与跨日重置 */
export function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
