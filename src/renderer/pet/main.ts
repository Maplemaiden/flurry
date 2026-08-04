import './styles.css'
import { IDLE_SLEEP_AFTER_MS } from '../../shared/defaults'
import type { AppState, CatBehavior } from '../../shared/types'
import { playCelebrate, playMeow, playPurr, setMuted } from '../shared/audio'
import { BehaviorMachine, GREETINGS, WARM_CARE_LINES, pick } from './behavior'

const petEl = document.getElementById('pet') as HTMLDivElement
const bubbleEl = document.getElementById('bubble') as HTMLParagraphElement
const machine = new BehaviorMachine()

let appState: AppState | null = null
let drag: {
  startX: number
  startY: number
  winX: number
  winY: number
  moved: boolean
} | null = null
let bubbleTimer: ReturnType<typeof setTimeout> | null = null
let suppressClick = false

function showBubble(text: string, ms = 2400): void {
  bubbleEl.hidden = false
  bubbleEl.textContent = text
  if (bubbleTimer) clearTimeout(bubbleTimer)
  bubbleTimer = setTimeout(() => {
    bubbleEl.hidden = true
  }, ms)
}

function applyVisual(behavior: CatBehavior): void {
  petEl.className = `pet is-${behavior}`
  if (appState?.focusActive && behavior !== 'celebrate' && behavior !== 'drag') {
    petEl.classList.add('is-focus')
  }
}

machine.subscribe(applyVisual)

function handlePendingEvent(state: AppState): void {
  const ev = state.pendingPetEvent
  if (!ev) return

  if (ev === 'greet') {
    const name = state.cat?.name
    showBubble(name ? `${pick(GREETINGS)} · ${name}` : pick(GREETINGS), 3500)
    machine.set('yawn', 1800)
    playMeow()
  } else if (ev === 'celebrate') {
    machine.set('celebrate', 2800)
    showBubble('做得好！我给你叼来一朵小花', 3200)
    playCelebrate()
  } else if (ev === 'warm-care') {
    if (state.focusActive) {
      void window.fluffy.clearPetEvent()
      return
    }
    showBubble(pick(WARM_CARE_LINES), 4000)
    machine.set('pet', 2000)
    playPurr(600)
  }

  void window.fluffy.clearPetEvent()
}

function syncFromState(state: AppState): void {
  appState = state
  setMuted(state.settings.muted)
  document.body.style.opacity = String(state.settings.opacity)

  if (state.focusActive) {
    if (machine.get() !== 'drag' && machine.get() !== 'celebrate') {
      machine.set('focus')
    }
  } else if (machine.get() === 'focus') {
    machine.set('idle')
  }

  handlePendingEvent(state)
}

function startAutonomousLoop(): void {
  const tick = (): void => {
    const state = appState
    if (!state || state.focusActive || machine.isBusy()) {
      window.setTimeout(tick, 4000)
      return
    }

    const last =
      state.lastInteractionAt ??
      (state.cat ? Date.parse(state.cat.createdAt) || Date.now() : Date.now())
    const idleFor = Date.now() - last

    if (idleFor >= IDLE_SLEEP_AFTER_MS) {
      machine.tryAutonomous('sleep', 8000)
      window.setTimeout(tick, 10000)
      return
    }

    const roll = Math.random()
    if (roll < 0.2) {
      machine.tryAutonomous('yawn', 1600)
      if (Math.random() < 0.4) showBubble('哈欠…', 1400)
    } else if (roll < 0.4) {
      machine.tryAutonomous('groom', 2200)
    } else if (roll < 0.55) {
      machine.tryAutonomous('walk', 2400)
      // 轻量位移：小范围挪窗口
      void nudgeWalk()
    } else if (roll < 0.7) {
      machine.tryAutonomous('sleep', 6000)
    } else {
      machine.tryAutonomous('idle')
    }

    window.setTimeout(tick, 7000 + Math.random() * 5000)
  }
  tick()
}

async function nudgeWalk(): Promise<void> {
  const dx = Math.round((Math.random() - 0.5) * 80)
  const dy = Math.round((Math.random() - 0.5) * 40)
  await window.fluffy.movePet({
    x: window.screenX + dx,
    y: window.screenY + dy,
    width: window.outerWidth,
    height: window.outerHeight
  })
}

petEl.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return
  petEl.setPointerCapture(e.pointerId)
  suppressClick = false
  machine.set('drag')
  drag = {
    startX: e.screenX,
    startY: e.screenY,
    winX: window.screenX,
    winY: window.screenY,
    moved: false
  }
})

petEl.addEventListener('pointermove', (e) => {
  if (!drag) return
  const dist = Math.hypot(e.screenX - drag.startX, e.screenY - drag.startY)
  if (dist > 4) drag.moved = true
  void window.fluffy.movePet({
    x: drag.winX + (e.screenX - drag.startX),
    y: drag.winY + (e.screenY - drag.startY),
    width: window.outerWidth,
    height: window.outerHeight
  })
})

petEl.addEventListener('pointerup', () => {
  if (!drag) return
  const wasDrag = drag.moved
  drag = null
  if (wasDrag) {
    suppressClick = true
    window.setTimeout(() => {
      suppressClick = false
    }, 250)
  }
  const fallback = appState?.focusActive ? 'focus' : 'idle'
  machine.set(fallback)
})

petEl.addEventListener('dblclick', (e) => {
  e.preventDefault()
  void window.fluffy.openHome()
})

petEl.addEventListener('click', () => {
  if (suppressClick || drag) return
  if (appState?.focusActive) {
    showBubble('专注中，我安静陪着…', 1800)
    return
  }

  machine.set('pet', 900, 'idle')
  showBubble('咕噜…')
  playPurr()
  void window.fluffy.noteInteraction(appState?.cat ? 1 : 0)
})

async function boot(): Promise<void> {
  const state = await window.fluffy.getState()
  syncFromState(state)
  window.fluffy.onStateChanged(syncFromState)
  startAutonomousLoop()
}

void boot()
