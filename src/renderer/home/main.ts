import './styles.css'
import { INTIMACY_UNLOCKS } from '../../shared/defaults'
import { getUnlocked } from '../../shared/intimacy'
import type { AmbientSound, AppState, HomeScene } from '../../shared/types'
import {
  playAmbient,
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
/** 临时文案/道具保护，避免被 render 立刻冲掉 */
let feedbackUntil = 0
let holdProp: { kind: string; emoji: string } | null = null

function formatRemain(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function setProp(kind: string | null, emoji = ''): void {
  if (!kind) {
    stageProp.hidden = true
    stageProp.textContent = ''
    return
  }
  stageProp.hidden = false
  stageProp.dataset.kind = kind
  stageProp.textContent = emoji
}

function setFeedback(text: string, ms = 2000, prop?: { kind: string; emoji: string } | null): void {
  stageHint.textContent = text
  feedbackUntil = Date.now() + ms
  if (prop === null) {
    holdProp = null
    setProp(null)
  } else if (prop) {
    holdProp = prop
    setProp(prop.kind, prop.emoji)
  }
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
    playPurr(500)
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

function syncActionButtons(state: AppState): void {
  document.querySelectorAll<HTMLButtonElement>('.home__actions [data-action]').forEach((btn) => {
    const action = btn.dataset.action
    const active =
      (action === 'sleep' && scene === 'sleep' && !state.focusActive) ||
      (action === 'study' && scene === 'study' && !state.focusActive) ||
      (action === 'focus' && state.focusActive)
    btn.classList.toggle('is-active', Boolean(active))
  })
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

  const holdingFeedback = Date.now() < feedbackUntil

  if (state.focusActive) {
    if (!holdingFeedback) {
      setProp(null)
      stageHint.textContent = '专注中… 我在安静陪着你'
    }
    focusBtn.textContent = '结束专注'
    focusTimerEl.hidden = false
  } else {
    focusBtn.textContent = '专注模式'
    focusTimerEl.hidden = true
    if (holdingFeedback) {
      if (holdProp) setProp(holdProp.kind, holdProp.emoji)
    } else if (scene === 'sleep') {
      holdProp = null
      setProp('sleep', '🛏️')
      stageHint.textContent = '呼呼大睡中 · 再点「睡觉」可醒来'
    } else if (scene === 'study') {
      holdProp = null
      setProp('study', '📖')
      stageHint.textContent = '安静陪学中 · 再点「学习陪伴」可结束'
    } else {
      holdProp = null
      setProp(null)
      stageHint.textContent = '在这里照顾你的小猫 · 右上角可返回桌面'
    }
  }

  syncActionButtons(state)
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

async function backToDesktop(): Promise<void> {
  await window.fluffy.nudgePet()
  await window.fluffy.closeHome()
}

document.getElementById('back-desktop')?.addEventListener('click', () => {
  void backToDesktop()
})

document.getElementById('onboard-later')?.addEventListener('click', () => {
  void backToDesktop()
})

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
  setFeedback('领养成功！点右上角「返回桌面」找小猫', 4000)
})

document.querySelector('.home__actions')?.addEventListener('click', async (e) => {
  const target = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')
  const action = target?.dataset.action
  if (!action) return

  const state = await window.fluffy.getState()
  if (!state.cat && action !== 'talk') {
    setFeedback('先领养一只小猫吧', 2000)
    return
  }

  switch (action) {
    case 'feed': {
      scene = 'default'
      stageCat.classList.add('is-eat')
      setFeedback('好好吃～', 1800, { kind: 'food', emoji: '🐟' })
      playPurr(500)
      await window.fluffy.noteInteraction(2)
      window.setTimeout(() => {
        stageCat.classList.remove('is-eat')
        holdProp = null
      }, 1600)
      break
    }
    case 'sleep': {
      if (scene === 'sleep') {
        scene = 'default'
        setFeedback('醒啦～', 1600, null)
      } else {
        scene = 'sleep'
        await window.fluffy.noteInteraction(1)
      }
      break
    }
    case 'study': {
      if (scene === 'study') {
        scene = 'default'
        setFeedback('陪学结束啦', 1600, null)
      } else {
        scene = 'study'
        await window.fluffy.noteInteraction(1)
      }
      break
    }
    case 'groom': {
      scene = 'default'
      stageCat.classList.add('is-groom')
      setFeedback('梳得亮晶晶…', 1600)
      playPurr(450)
      await window.fluffy.noteInteraction(1)
      window.setTimeout(() => stageCat.classList.remove('is-groom'), 1400)
      break
    }
    case 'focus': {
      if (state.focusActive) {
        await window.fluffy.stopFocus(false)
        scene = 'default'
        setFeedback('已结束专注，随时可以再开始', 2500)
      } else {
        scene = 'study'
        await window.fluffy.startFocus()
        setFeedback('专注开始啦，我会安静陪着你', 2500)
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
  talkReply.textContent = '想说什么都可以，我在听。'
  setFeedback('已回到小窝', 1600)
})

async function patchSettings(patch: Partial<AppState['settings']>): Promise<void> {
  const state = await window.fluffy.getState()
  const next = await window.fluffy.setState({
    settings: { ...state.settings, ...patch }
  })
  render(next)
}

optOpacity.addEventListener('input', () => {
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
  if (optClick.checked) {
    setFeedback('已开启点击穿透：桌宠点不到时，用托盘打开小窝', 4000)
  }
})

async function boot(): Promise<void> {
  const state = await window.fluffy.getState()
  render(state)
  window.fluffy.onStateChanged((s) => {
    const wasFocus = appState?.focusActive
    if (s.focusActive) scene = 'study'
    if (!s.focusActive && wasFocus) {
      scene = 'default'
      // 庆祝音效由桌宠窗播放，这里只留文案，避免双响
      if (s.pendingPetEvent === 'celebrate') {
        setFeedback('专注结束啦！桌面上的小猫在庆祝～', 3500)
      }
    }
    render(s)
  })
}

void boot()
