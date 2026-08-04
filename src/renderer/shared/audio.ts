import type { AmbientSound } from '../../shared/types'

/** 占位音频：Web Audio 合成，无需外部资源文件 */

let ctx: AudioContext | null = null
let ambientNodes: { stop: () => void } | null = null
let muted = false

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
  }
  return ctx
}

export function setMuted(value: boolean): void {
  muted = value
  if (muted) stopAmbient()
}

export function playPurr(durationMs = 420): void {
  if (muted) return
  const ac = getCtx()
  void ac.resume()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.value = 85
  gain.gain.value = 0.0001
  osc.connect(gain)
  gain.connect(ac.destination)
  const now = ac.currentTime
  gain.gain.exponentialRampToValueAtTime(0.04, now + 0.05)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000)
  osc.start(now)
  osc.stop(now + durationMs / 1000 + 0.02)
}

export function playMeow(): void {
  if (muted) return
  const ac = getCtx()
  void ac.resume()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(520, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(320, ac.currentTime + 0.18)
  gain.gain.value = 0.0001
  osc.connect(gain)
  gain.connect(ac.destination)
  const now = ac.currentTime
  gain.gain.exponentialRampToValueAtTime(0.05, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
  osc.start(now)
  osc.stop(now + 0.25)
}

export function playCelebrate(): void {
  if (muted) return
  playMeow()
  window.setTimeout(() => playPurr(500), 180)
}

function stopAmbient(): void {
  ambientNodes?.stop()
  ambientNodes = null
}

/** 简易噪声环境音占位 */
export function playAmbient(kind: AmbientSound): void {
  stopAmbient()
  if (muted || kind === 'none') return

  const ac = getCtx()
  void ac.resume()

  const gain = ac.createGain()
  gain.gain.value = kind === 'fire' ? 0.025 : 0.018
  gain.connect(ac.destination)

  if (kind === 'soft-piano') {
    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 196
    const lfo = ac.createOscillator()
    const lfoGain = ac.createGain()
    lfo.frequency.value = 0.08
    lfoGain.gain.value = 0.01
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)
    osc.connect(gain)
    osc.start()
    lfo.start()
    ambientNodes = {
      stop: () => {
        osc.stop()
        lfo.stop()
        osc.disconnect()
        lfo.disconnect()
        gain.disconnect()
      }
    }
    return
  }

  // rain / fire：缓冲噪声
  const bufferSize = 2 * ac.sampleRate
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (kind === 'fire' ? 0.55 : 0.35)
  }
  const noise = ac.createBufferSource()
  noise.buffer = buffer
  noise.loop = true

  const filter = ac.createBiquadFilter()
  filter.type = kind === 'fire' ? 'lowpass' : 'bandpass'
  filter.frequency.value = kind === 'fire' ? 400 : 1200
  filter.Q.value = kind === 'fire' ? 0.7 : 0.4

  noise.connect(filter)
  filter.connect(gain)
  noise.start()

  ambientNodes = {
    stop: () => {
      noise.stop()
      noise.disconnect()
      filter.disconnect()
      gain.disconnect()
    }
  }
}
