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
  | 'stretch'

/** 小家场景模式 */
export type HomeScene = 'default' | 'sleep' | 'study'

/** 桌宠待播放的一次性事件（主进程写入，渲染进程消费后清空） */
export type PendingPetEvent = 'celebrate' | 'warm-care' | 'greet' | 'home-back' | null

export type AmbientSound = 'none' | 'rain' | 'soft-piano' | 'fire'

/** 商店物品分类 */
export type ShopCategory = 'food' | 'drink' | 'toy' | 'study' | 'furniture' | 'clothes' | 'room' | 'skin'

/** 商店物品定义 */
export interface ShopItem {
  id: string
  name: string
  category: ShopCategory
  price: number
  description: string
  placeholder?: boolean
}

/** 道具使用效果（喂食/饮用/玩耍时触发） */
export interface ItemEffect {
  /** 桌宠播放的行为动画 */
  behavior: CatBehavior
  /** 气泡文本 */
  bubble: string
  /** 亲密度增量 */
  intimacyDelta: number
  /** 是否消耗品（食物/饮料消耗，道具/家具永久） */
  consume: boolean
}

/** 每日小魚乾获取追踪（用于上限与跨日重置） */
export interface DailyCoinTracker {
  date: string
  petCoins: number
  studyCoins: number
  lastPetCoinAt: number | null
}

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
  /** 开发者测试模式（仅 FLUFFY_TEST=1 启动时开启） */
  testMode?: boolean
  /** 无限小魚乾，购买不扣费 */
  testInfiniteCoins?: boolean
  /** 跳过抚摸/专注每日上限与冷却 */
  testSkipCaps?: boolean
  /** 专注改为 10 秒结束（便于测庆祝） */
  testFastFocus?: boolean
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
  /** 小魚乾货币余额 */
  fishCoins: number
  /** 背包：物品ID → 数量（消耗品可叠加，永久品固定为1） */
  backpack: Record<string, number>
  /** 每日小魚乾获取追踪 */
  dailyCoins: DailyCoinTracker
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
