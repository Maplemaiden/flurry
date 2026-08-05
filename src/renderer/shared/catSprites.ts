import type { CatBehavior } from '../../shared/types'

/** MVP 默认猫：灰白坐姿猫（后续可按领养选择扩展） */
export const DEFAULT_CAT_FOLDER = '01_灰白坐姿猫'

type SpriteClip = {
  folder: string
  frames: number
  loop: boolean
  fps: number
}

const CLIPS: Record<CatBehavior, SpriteClip> = {
  idle: { folder: '待机', frames: 4, loop: true, fps: 4 },
  walk: { folder: '行走', frames: 4, loop: true, fps: 6 },
  sleep: { folder: '睡眠', frames: 4, loop: true, fps: 2 },
  groom: { folder: '舔毛', frames: 3, loop: true, fps: 4 },
  yawn: { folder: '打哈欠', frames: 3, loop: false, fps: 3 },
  pet: { folder: '抚摸反应', frames: 2, loop: false, fps: 4 },
  drag: { folder: '拖拽', frames: 2, loop: true, fps: 4 },
  focus: { folder: '专注', frames: 3, loop: true, fps: 3 },
  celebrate: { folder: '庆祝', frames: 4, loop: false, fps: 6 },
  knead: { folder: '踩奶', frames: 3, loop: true, fps: 5 },
  // 暂无独立喂食帧，用庆祝表现开心吃完
  eat: { folder: '庆祝', frames: 4, loop: false, fps: 5 }
}

export function artUrl(...parts: string[]): string {
  const joined = parts.map((p) => p.replace(/^\/+|\/+$/g, '')).join('/')
  return encodeURI(`/art/${joined}`)
}

export function homeBackgroundUrl(scene: 'default' | 'sleep' | 'study'): string {
  if (scene === 'study') return artUrl('01_小窝背景', '办公室.jpg')
  if (scene === 'sleep') return artUrl('01_小窝背景', '温馨小家.jpg')
  return artUrl('01_小窝背景', '温馨小家.jpg')
}

export function frameUrl(catFolder: string, clipFolder: string, frameIndex: number): string {
  const n = String(frameIndex).padStart(2, '0')
  return artUrl('02_猫咪', catFolder, clipFolder, `${clipFolder}_${n}.png`)
}

export class CatSpritePlayer {
  private img: HTMLImageElement
  private behavior: CatBehavior = 'idle'
  private frame = 1
  private timer: ReturnType<typeof setInterval> | null = null
  private catFolder: string

  constructor(img: HTMLImageElement, catFolder = DEFAULT_CAT_FOLDER) {
    this.img = img
    this.catFolder = catFolder
    this.applyFrame()
    this.start()
  }

  setBehavior(behavior: CatBehavior): void {
    if (this.behavior === behavior) return
    this.behavior = behavior
    this.frame = 1
    this.applyFrame()
    this.start()
  }

  private clip(): SpriteClip {
    return CLIPS[this.behavior]
  }

  private applyFrame(): void {
    const clip = this.clip()
    this.img.src = frameUrl(this.catFolder, clip.folder, this.frame)
    this.img.alt = this.behavior
  }

  private start(): void {
    if (this.timer) clearInterval(this.timer)
    const clip = this.clip()
    const ms = Math.max(80, Math.round(1000 / clip.fps))
    this.timer = setInterval(() => {
      const c = this.clip()
      if (this.frame >= c.frames) {
        if (c.loop) this.frame = 1
        else return
      } else {
        this.frame += 1
      }
      this.applyFrame()
    }, ms)
  }

  destroy(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }
}
