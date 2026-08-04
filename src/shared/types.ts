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

/** 小家场景模式 */
export type HomeScene = 'default' | 'sleep' | 'study'

export interface CatProfile {
  name: string
  personality: CatPersonality
  /** 亲密度 0–100，MVP 轻量增长 */
  intimacy: number
  createdAt: string
}

export interface AppSettings {
  /** 桌宠透明度 0.3–1 */
  opacity: number
  /** 是否允许点击穿透（仅边缘可交互时可开） */
  clickThrough: boolean
  /** 专注模式默认时长（分钟） */
  focusMinutes: number
  muted: boolean
}

export interface AppState {
  onboardingDone: boolean
  cat: CatProfile | null
  settings: AppSettings
  /** 专注模式是否进行中 */
  focusActive: boolean
}

export interface PetWindowBounds {
  x: number
  y: number
  width: number
  height: number
}
