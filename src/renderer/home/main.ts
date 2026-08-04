import './styles.css'
import type { AppState, HomeScene } from '../../shared/types'
import { replyToMessage } from './dialogue'

const onboardEl = document.getElementById('onboard') as HTMLElement
const talkPanel = document.getElementById('talk-panel') as HTMLElement
const subtitleEl = document.getElementById('subtitle') as HTMLElement
const stageHint = document.getElementById('stage-hint') as HTMLElement
const catNameInput = document.getElementById('cat-name') as HTMLInputElement
const talkInput = document.getElementById('talk-input') as HTMLInputElement
const talkReply = document.getElementById('talk-reply') as HTMLElement

let scene: HomeScene = 'default'

function render(state: AppState): void {
  const needsOnboard = !state.onboardingDone || !state.cat
  onboardEl.hidden = !needsOnboard

  if (state.cat) {
    subtitleEl.textContent = `${state.cat.name} 的小窝 · 亲密度 ${state.cat.intimacy}`
  } else {
    subtitleEl.textContent = '温暖小窝'
  }

  if (state.focusActive) {
    stageHint.textContent = '专注中… 我在安静陪着你'
  } else if (scene === 'sleep') {
    stageHint.textContent = '呼呼大睡中'
  } else if (scene === 'study') {
    stageHint.textContent = '安静陪学中'
  } else {
    stageHint.textContent = '在这里照顾你的小猫'
  }
}

function bumpIntimacy(state: AppState, delta = 1): Partial<AppState> {
  if (!state.cat) return {}
  return {
    cat: {
      ...state.cat,
      intimacy: Math.min(100, state.cat.intimacy + delta)
    }
  }
}

document.getElementById('adopt-btn')?.addEventListener('click', async () => {
  const name = catNameInput.value.trim() || 'Fluffy'
  const next = await window.fluffy.setState({
    onboardingDone: true,
    cat: {
      name,
      personality: 'gentle',
      intimacy: 1,
      createdAt: new Date().toISOString()
    }
  })
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
    case 'feed':
      scene = 'default'
      stageHint.textContent = '好好吃～'
      await window.fluffy.setState(bumpIntimacy(state, 2))
      break
    case 'sleep':
      scene = 'sleep'
      await window.fluffy.setState(bumpIntimacy(state))
      break
    case 'study':
      scene = 'study'
      await window.fluffy.setState(bumpIntimacy(state))
      break
    case 'focus': {
      const next = await window.fluffy.toggleFocus()
      scene = next.focusActive ? 'study' : 'default'
      break
    }
    case 'talk':
      talkPanel.hidden = !talkPanel.hidden
      break
  }

  render(await window.fluffy.getState())
})

document.getElementById('talk-send')?.addEventListener('click', async () => {
  const text = talkInput.value.trim()
  if (!text) return
  talkReply.textContent = replyToMessage(text)
  talkInput.value = ''
  const state = await window.fluffy.getState()
  await window.fluffy.setState(bumpIntimacy(state))
  render(await window.fluffy.getState())
})

async function boot(): Promise<void> {
  const state = await window.fluffy.getState()
  render(state)
  window.fluffy.onStateChanged(render)
}

void boot()
