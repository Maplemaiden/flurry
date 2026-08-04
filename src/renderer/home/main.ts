import './styles.css'
import { INTIMACY_UNLOCKS } from '../../shared/defaults'
import { getUnlocked } from '../../shared/intimacy'
import type { AmbientSound, AppState, HomeScene } from '../../shared/types'
import {
  playAmbient,
  playCelebrate,
  playMeow,
  playPurr,
  setMuted
} from '../shared/audio'
import { replyToMessage, type DialogueHook } from './dialogue'

const onboardEl = document.getElementById('onboard') as HTMLElement
const talkPanel = document.getElementById('talk-panel') as HTMLElement
const subtitleEl = document.getElementById('subtitle') as HTMLElement
const stageEl = document.getElementById('stage') as HTMLElement
const stageCat = document.getElementById('stage-cat') as HTMLElement
const stageProp = document.getElementById('stage-prop') as HTMLElement
const stageHint = document.getElementById('stage-hint') as HTMLElement
const unlocksEl = document.getElementById('unlocks') as HTMLElement
const focusTimerEl = document.getElementById('focus-timer') as HTMLElement
const focusBtn = document.getElementById('focus-btn') as HTMLButtonElement
const catNameInput = document.getElementById('cat-name') as HTMLInputElement
const talkInput = document.getElementById('talk-input') as HTMLInputElement
const talkReply = document.getElementById('talk-reply') as HTMLElement

const optOpacity = document.getElementById('opt-opacity') as HTMLInputElement
const optFocusMin = document.getElementById('opt-focus-min') as HTMLInputElement
const optAmbient = document.getElementById('opt-ambient') as HTMLSelectElement
const optMuted = document.getElementById('opt-muted') as HTMLInputElement
const optClick = document.getElementById('opt-clickthrough') as HTMLInputElement

let scene: HomeScene = 'default'
let appState: AppState | null = null
let timerTick: ReturnType<typeof setInterval> | null = null

function formatRemain(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function setProp(kind: string | null, emoji = ''): void {
  if (!kind) {
    stageProp.hidden = true
    return
  }
  stageProp.hidden = false
  stageProp.dataset.kind = kind
  stageProp.textContent = emoji
}

function applyHook(hook: DialogueHook): void {
  stageCat.classList.remove('is-knead', 'is-eat', 'is-groom')
  if (hook === 'knead') {
    stageCat.classList.add('is-knead')
    playPurr(700)
    window.setTimeout(() => stageCat.classList.remove('is-knead'), 2000)
  } else if (hook === 'nuzzle') {
    playPurr(400)
  } else if (hook === 'celebrate') {
    playCelebrate()
  }
}

function syncAmbient(state: AppState): void {
  setMuted(state.settings.muted)
  if (state.settings.muted) {
    playAmbient('none')
    return
  }
  if (state.focusActive || scene === 'sleep') {
    playAmbient(state.settings.ambient)
  } else {
    playAmbient('none')
  }
}

function render(state: AppState): void {
  appState = state
  const needsOnboard = !state.onboardingDone || !state.cat
  onboardEl.hidden = !needsOnboard

  optOpacity.value = String(state.settings.opacity)
  optFocusMin.value = String(state.settings.focusMinutes)
  optAmbient.value = state.settings.ambient
  optMuted.checked = state.settings.muted
  optClick.checked = state.settings.clickThrough

  if (state.cat) {
    const unlocked = getUnlocked(state.cat.intimacy)
    subtitleEl.textContent = `${state.cat.name} 的小窝 · 亲密度 ${state.cat.intimacy}`
    unlocksEl.textContent =
      unlocked.length > 0
        ? `已解锁：${unlocked.map((u) => u.label).join(' · ')}`
        : `再亲近一点：${INTIMACY_UNLOCKS[0]!.at} 解锁「${INTIMACY_UNLOCKS[0]!.label}」`
  } else {
    subtitleEl.textContent = '温暖小窝'
    unlocksEl.textContent = ''
  }

  stageEl.classList.toggle('is-sleep', scene === 'sleep' && !state.focusActive)
  stageEl.classList.toggle('is-study', scene === 'study' && !state.focusActive)
  stageEl.classList.toggle('is-focus', state.focusActive)
  stageCat.classList.toggle('is-sleep', scene === 'sleep' || state.focusActive)

  if (state.focusActive) {
    setProp(null)
    stageHint.textContent = '专注中… 我在安静陪着你'
    focusBtn.textContent = '结束专注'
    focusBtn.classList.add('is-active')
    focusTimerEl.hidden = false
  } else {
    focusBtn.textContent = '专注模式'
    focusBtn.classList.remove('is-active')
    focusTimerEl.hidden = true
    if (scene === 'sleep') {
      setProp('sleep', '🛏️')
      stageHint.textContent = '呼呼大睡中 · 可再点睡觉退出'
    } else if (scene === 'study') {
      setProp('study', '📖')
      stageHint.textContent = '安静陪学中 · 可再点学习退出'
    } else {
      setProp(null)
      stageHint.textContent = '在这里照顾你的小猫'
    }
  }

  syncAmbient(state)
  updateFocusTimer()
}

function updateFocusTimer(): void {
  if (timerTick) {
    clearInterval(timerTick)
    timerTick = null
  }
  const tick = (): void => {
    const state = appState
    if (!state?.focusActive || !state.focusEndsAt) {
      focusTimerEl.hidden = true
      return
    }
    focusTimerEl.hidden = false
    focusTimerEl.textContent = formatRemain(state.focusEndsAt - Date.now())
  }
  tick()
  if (appState?.focusActive) {
    timerTick = setInterval(tick, 500)
  }
}

document.getElementById('adopt-btn')?.addEventListener('click', async () => {
  const name = catNameInput.value.trim().slice(0, 12) || 'Fluffy'
  const next = await window.fluffy.setState({
    onboardingDone: true,
    lastInteractionAt: Date.now(),
    cat: {
      name,
      personality: 'gentle',
      intimacy: 1,
      createdAt: new Date().toISOString()
    }
  })
  playMeow()
  render(next)
})

document.querySelector('.home__actions')?.addEventListener('click', async (e) => {
  const target = e.target as HTMLElement
  const action = target.dataset.action
  if (!action) return

  const state = await window.fluffy.getState()
  if (!state.cat && action !== 'talk') {
    stageHint.textContent = '先领养一只小猫吧'
    return
  }

  switch (action) {
    case 'feed': {
      scene = 'default'
      stageCat.classList.add('is-eat')
      setProp('food', '🐟')
      stageHint.textContent = '好好吃～'
      playPurr(500)
      await window.fluffy.noteInteraction(2)
      window.setTimeout(() => {
        stageCat.classList.remove('is-eat')
        setProp(null)
      }, 1600)
      break
    }
    case 'sleep': {
      if (scene === 'sleep') {
        scene = 'default'
      } else {
        scene = 'sleep'
        await window.fluffy.noteInteraction(1)
      }
      break
    }
    case 'study': {
      if (scene === 'study') {
        scene = 'default'
      } else {
        scene = 'study'
        await window.fluffy.noteInteraction(1)
      }
      break
    }
    case 'groom': {
      scene = 'default'
      stageCat.classList.add('is-groom')
      stageHint.textContent = '梳得亮晶晶…'
      playPurr(450)
      await window.fluffy.noteInteraction(1)
      window.setTimeout(() => stageCat.classList.remove('is-groom'), 1400)
      break
    }
    case 'focus': {
      if (state.focusActive) {
        await window.fluffy.stopFocus(false)
        scene = 'default'
      } else {
        scene = 'study'
        await window.fluffy.startFocus()
      }
      break
    }
    case 'talk':
      talkPanel.hidden = !talkPanel.hidden
      if (!talkPanel.hidden) talkInput.focus()
      break
  }

  render(await window.fluffy.getState())
})

async function sendTalk(): Promise<void> {
  const text = talkInput.value.trim()
  if (!text) return
  const result = replyToMessage(text)
  talkReply.textContent = result.text
  talkInput.value = ''
  applyHook(result.hook)
  await window.fluffy.noteInteraction(1)
  render(await window.fluffy.getState())
}

document.getElementById('talk-send')?.addEventListener('click', () => {
  void sendTalk()
})

talkInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') void sendTalk()
})

document.getElementById('talk-close')?.addEventListener('click', () => {
  talkPanel.hidden = true
})

async function patchSettings(
  patch: Partial<AppState['settings']>
): Promise<void> {
  const state = await window.fluffy.getState()
  const next = await window.fluffy.setState({
    settings: { ...state.settings, ...patch }
  })
  if (patch.clickThrough !== undefined) {
    await window.fluffy.setClickThrough(patch.clickThrough)
  }
  render(next)
}

optOpacity.addEventListener('change', () => {
  void patchSettings({ opacity: Number(optOpacity.value) })
})
optFocusMin.addEventListener('change', () => {
  void patchSettings({ focusMinutes: Number(optFocusMin.value) || 25 })
})
optAmbient.addEventListener('change', () => {
  void patchSettings({ ambient: optAmbient.value as AmbientSound })
})
optMuted.addEventListener('change', () => {
  void patchSettings({ muted: optMuted.checked })
})
optClick.addEventListener('change', () => {
  void patchSettings({ clickThrough: optClick.checked })
})

async function boot(): Promise<void> {
  const state = await window.fluffy.getState()
  render(state)
  window.fluffy.onStateChanged((s) => {
    if (s.focusActive) scene = 'study'
    if (!s.focusActive && appState?.focusActive) {
      // 自然结束庆祝已在桌宠侧；小窝给一句提示
      if (s.pendingPetEvent === 'celebrate' || scene === 'study') {
        stageHint.textContent = '专注结束啦，伸个懒腰庆祝～'
        playCelebrate()
      }
      scene = 'default'
    }
    render(s)
  })
}

void boot()
