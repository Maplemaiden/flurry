import type { CatBehavior } from '../../shared/types'

type Listener = (behavior: CatBehavior) => void

const HIGH_PRIORITY: CatBehavior[] = ['drag', 'pet', 'focus', 'celebrate', 'knead', 'eat']

export class BehaviorMachine {
  private current: CatBehavior = 'idle'
  private listeners = new Set<Listener>()
  private clearTimer: ReturnType<typeof setTimeout> | null = null

  get(): CatBehavior {
    return this.current
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this.current)
  }

  /** 强制切换；timedMs 后回到 fallback（默认 idle） */
  set(next: CatBehavior, timedMs?: number, fallback: CatBehavior = 'idle'): void {
    if (this.clearTimer) {
      clearTimeout(this.clearTimer)
      this.clearTimer = null
    }
    this.current = next
    this.emit()
    if (timedMs !== undefined) {
      this.clearTimer = setTimeout(() => {
        this.current = fallback
        this.emit()
      }, timedMs)
    }
  }

  /** 自主行为：若当前为高优先级则忽略 */
  tryAutonomous(next: CatBehavior, timedMs?: number): boolean {
    if (HIGH_PRIORITY.includes(this.current)) return false
    this.set(next, timedMs, 'idle')
    return true
  }

  isBusy(): boolean {
    return HIGH_PRIORITY.includes(this.current)
  }
}

export const GREETINGS = [
  '伸了个懒腰…你来啦',
  '翻了个身，露出一点肚皮',
  '小跑过来蹭了蹭屏幕边缘',
  '用脑袋轻轻撞了撞你'
]

export const WARM_CARE_LINES = [
  '已经努力很久了，抱抱',
  '歇一会儿？我在这儿',
  '咕噜…喝口水也好'
]

export function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]!
}
