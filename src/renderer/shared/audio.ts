import type { AmbientSound } from '../../shared/types'

/** 正式音频资源：短音效 + 环境音/BGM，均服从 settings.muted */

let muted = false
let ambientAudio: HTMLAudioElement | null = null
let bgmAudio: HTMLAudioElement | null = null
let currentAmbient: AmbientSound | 'none' = 'none'
let currentBgm: string | null = null

const AMBIENT_SRC: Record<Exclude<AmbientSound, 'none'>, string> = {
  rain: '/audio/ambient/rain.mp3',
  'soft-piano': '/audio/ambient/soft.mp3',
  fire: '/audio/ambient/fire.mp3'
}

const BGM_SRC = {
  desktop: '/audio/bgm/desktop.mp3',
  home: '/audio/bgm/home.mp3',
  focus: '/audio/bgm/focus.mp3',
  celebrate: '/audio/bgm/celebrate.mp3'
} as const

const SFX_SRC = {
  purr: '/audio/sfx/purr.wav',
  meow: '/audio/sfx/meow.mp3',
  meowCute: '/audio/sfx/meow-cute.mp3',
  pet: '/audio/sfx/pet.mp3',
  eat: '/audio/sfx/eat.mp3',
  hungry: '/audio/sfx/hungry.mp3',
  knead: '/audio/sfx/knead.mp3',
  button: '/audio/sfx/button.mp3'
} as const

export type BgmKind = keyof typeof BGM_SRC
export type SfxKind = keyof typeof SFX_SRC

function playHtmlAudio(
  src: string,
  opts: { volume?: number; loop?: boolean } = {}
): HTMLAudioElement {
  const el = new Audio(src)
  el.volume = opts.volume ?? 0.35
  el.loop = Boolean(opts.loop)
  void el.play().catch(() => {
    /* 自动播放策略 / 缺文件时静默失败 */
  })
  return el
}

function playSfx(src: string, volume = 0.4): void {
  if (muted) return
  const el = new Audio(src)
  el.volume = volume
  void el.play().catch(() => undefined)
}

export function setMuted(value: boolean): void {
  muted = value
  if (muted) {
    stopAmbient()
    stopBgm()
  }
}

export function isMuted(): boolean {
  return muted
}

export function playPurr(_durationMs = 420): void {
  playSfx(SFX_SRC.purr, 0.32)
}

export function playMeow(): void {
  playSfx(SFX_SRC.meow, 0.38)
}

export function playMeowCute(): void {
  playSfx(SFX_SRC.meowCute, 0.38)
}

export function playPetSfx(): void {
  playSfx(SFX_SRC.pet, 0.4)
}

export function playEatSfx(): void {
  playSfx(SFX_SRC.eat, 0.42)
}

export function playKneadSfx(): void {
  playSfx(SFX_SRC.knead, 0.38)
}

export function playHungrySfx(): void {
  playSfx(SFX_SRC.hungry, 0.36)
}

export function playButtonSfx(): void {
  playSfx(SFX_SRC.button, 0.28)
}

export function playCelebrate(): void {
  if (muted) return
  playMeowCute()
  window.setTimeout(() => playPurr(500), 180)
  // 短促庆祝 BGM 片段（不打断环境音太久）
  const fanfare = playHtmlAudio(BGM_SRC.celebrate, { volume: 0.22, loop: false })
  window.setTimeout(() => {
    fanfare.pause()
    fanfare.src = ''
  }, 4500)
}

function stopAmbient(): void {
  if (ambientAudio) {
    ambientAudio.pause()
    ambientAudio.src = ''
    ambientAudio = null
  }
  currentAmbient = 'none'
}

function stopBgm(): void {
  if (bgmAudio) {
    bgmAudio.pause()
    bgmAudio.src = ''
    bgmAudio = null
  }
  currentBgm = null
}

/** 白噪音 / 轻柔环境音 */
export function playAmbient(kind: AmbientSound): void {
  if (kind === currentAmbient && ambientAudio && !muted) return
  stopAmbient()
  if (muted || kind === 'none') return

  const src = AMBIENT_SRC[kind]
  ambientAudio = playHtmlAudio(src, { volume: 0.22, loop: true })
  currentAmbient = kind
}

/** 场景 BGM（桌宠 / 小窝 / 专注）；音量克制 */
export function playBgm(kind: BgmKind | 'none', volume = 0.18): void {
  if (kind === 'none') {
    stopBgm()
    return
  }
  if (muted) {
    stopBgm()
    return
  }
  if (currentBgm === kind && bgmAudio) return
  stopBgm()
  bgmAudio = playHtmlAudio(BGM_SRC[kind], { volume, loop: true })
  currentBgm = kind
}

export function stopAllAudio(): void {
  stopAmbient()
  stopBgm()
}
