import type { CatBehavior } from '../../shared/types'
import clipManifest from './clip-manifest.json'

/** 插值帧动画默认猫种（英文目录名） */
export const DEFAULT_CAT_FOLDER = clipManifest.defaultCat as string

type ClipManifest = {
  defaultCat: string
  fps: Record<string, number>
  behaviorToAction: Record<string, string>
  legacyCatMap: Record<string, string>
  frames: Record<string, string[]>
}

const manifest = clipManifest as ClipManifest

export function resolveCatFolder(catFolder?: string): string {
  if (!catFolder) return DEFAULT_CAT_FOLDER
  return manifest.legacyCatMap[catFolder] ?? catFolder
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

function actionForBehavior(behavior: CatBehavior): string {
  return manifest.behaviorToAction[behavior] ?? 'idle'
}

function frameFiles(action: string): string[] {
  return manifest.frames[action] ?? manifest.frames.idle ?? []
}

export function frameUrl(catFolder: string, action: string, fileName: string): string {
  const cat = resolveCatFolder(catFolder)
  return encodeURI(`/frames/${cat}/${action}/${fileName}`)
}

export class CatSpritePlayer {
  private img: HTMLImageElement
  private behavior: CatBehavior = 'idle'
  private frame = 0
  private timer: ReturnType<typeof setInterval> | null = null
  private catFolder: string

  constructor(img: HTMLImageElement, catFolder = DEFAULT_CAT_FOLDER) {
    this.img = img
    this.catFolder = resolveCatFolder(catFolder)
    this.applyFrame()
    this.start()
  }

  setCatFolder(catFolder: string): void {
    this.catFolder = resolveCatFolder(catFolder)
    this.applyFrame()
  }

  setBehavior(behavior: CatBehavior): void {
    if (this.behavior === behavior) return
    this.behavior = behavior
    this.frame = 0
    this.applyFrame()
    this.start()
  }

  private action(): string {
    return actionForBehavior(this.behavior)
  }

  private files(): string[] {
    return frameFiles(this.action())
  }

  private fps(): number {
    const action = this.action()
    return manifest.fps[action] ?? manifest.fps[this.behavior] ?? 12
  }

  private looping(): boolean {
    // 非循环：打哈欠 / 伸懒腰 / 庆祝 / 吃东西
    return !['yawn', 'stretch', 'celebrate', 'eat'].includes(this.behavior)
  }

  private applyFrame(): void {
    const files = this.files()
    if (!files.length) return
    const idx = Math.min(this.frame, files.length - 1)
    const file = files[idx]!
    this.img.src = frameUrl(this.catFolder, this.action(), file)
    this.img.alt = this.behavior
  }

  private start(): void {
    if (this.timer) clearInterval(this.timer)
    const ms = Math.max(40, Math.round(1000 / this.fps()))
    this.timer = setInterval(() => {
      const files = this.files()
      if (!files.length) return
      if (this.frame >= files.length - 1) {
        if (this.looping()) this.frame = 0
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
