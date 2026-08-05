/** 猫咪性格倾向（MVP 仅一只，结构预留给后续多猫） */
export type CatPersonality = 'lazy' | 'playful' | 'gentle'

/** 猫咪当前行为状态 */
export type CatBehavior =
  | 'idle'
  | 'walk'
  | 'sleep'
  | 'groom'
  | 'yawn'
  | 'pet'
  | 'drag'
  | 'focus'
  | 'celebrate'
  | 'knead'
  | 'eat'

/** 小家场景模式 */
export type HomeScene = 'default' | 'sleep' | 'study'

/** 桌宠待播放的一次性事件（主进程写入，渲染进程消费后清空） */
export type PendingPetEvent = 'celebrate' | 'warm-care' | 'greet' | 'home-back' | null

export type AmbientSound = 'none' | 'rain' | 'soft-piano' | 'fire'

export interface CatProfile {
  name: string
  personality: CatPersonality
  /** 亲密度 0–100，MVP 只增不减 */
  intimacy: number
  createdAt: string
}

export interface AppSettings {
  /** 桌宠透明度 0.3–1 */
  opacity: number
  /** 点击穿透（托盘可关；逃生路径） */
  clickThrough: boolean
  /** 专注模式默认时长（分钟） */
  focusMinutes: number
  muted: boolean
  /** 专注 / 睡眠环境音 */
  ambient: AmbientSound
}

export interface AppState {
  onboardingDone: boolean
  cat: CatProfile | null
  settings: AppSettings
  focusActive: boolean
  /** 专注结束时间戳（ms）；未专注为 null */
  focusEndsAt: number | null
  /** 上次有效互动时间（ms） */
  lastInteractionAt: number | null
  /** 上次久坐暖心触发（ms） */
  lastWarmCareAt: number | null
  /** 待桌宠表演的一次性事件 */
  pendingPetEvent: PendingPetEvent
  /** 聊天消息：被设置后桌宠气泡显示该文本，直到下一条覆盖 */
  chatMessage: string | null
  /** 是否处于睡觉状态（桌宠窗/小窝共享，用于跨窗口同步） */
  catSleeping: boolean
}

export interface PetWindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface IntimacyUnlock {
  at: number
  id: string
  label: string
}
