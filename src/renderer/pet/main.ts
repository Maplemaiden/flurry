import './styles.css'
import { IDLE_SLEEP_AFTER_MS } from '../../shared/defaults'
import type { AppState, CatBehavior, PetWindowBounds } from '../../shared/types'
import { playCelebrate, playMeow, playPurr, setMuted } from '../shared/audio'
import { BehaviorMachine, GREETINGS, WARM_CARE_LINES, pick } from './behavior'

const petEl = document.getElementById('pet') as HTMLDivElement
const bubbleEl = document.getElementById('bubble') as HTMLParagraphElement
const menuEl = document.getElementById('quick-menu') as HTMLDivElement
const backdropEl = document.getElementById('menu-backdrop') as HTMLDivElement
const muteBtn = document.getElementById('menu-mute') as HTMLButtonElement
const machine = new BehaviorMachine()

let appState: AppState | null = null
let menuOpen = false
let lastBounds: PetWindowBounds = {
  x: 0,
  y: 0,
  width: window.outerWidth || 160,
  height: window.outerHeight || 160
}
let drag: {
  startX: number
  startY: number
  originX: number
  originY: number
  moved: boolean
} | null = null
let bubbleTimer: ReturnType<typeof setTimeout> | null = null
let lastPetGainAt = 0

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

function syncMuteLabel(state: AppState): void {
  muteBtn.textContent = state.settings.muted ? '取消静音' : '静音'
}

async function openMenu(): Promise<void> {
  if (menuOpen) return
  menuOpen = true
  menuEl.hidden = false
  backdropEl.hidden = false
  const next = await window.fluffy.setPetMenuOpen(true)
  if (next) lastBounds = next
  if (appState) syncMuteLabel(appState)
}

async function closeMenu(): Promise<void> {
  if (!menuOpen) return
  menuOpen = false
  menuEl.hidden = true
  backdropEl.hidden = true
  const next = await window.fluffy.setPetMenuOpen(false)
  if (next) lastBounds = next
}

function handlePendingEvent(state: AppState): void {
  const ev = state.pendingPetEvent
  if (!ev) return

  if (ev === 'greet') {
    const name = state.cat?.name
    showBubble(name ? `${pick(GREETINGS)} · ${name}` : '单击我打开菜单～', 3500)
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
  } else if (ev === 'home-back') {
    showBubble('我在这儿～单击打开菜单', 2800)
    machine.set('pet', 1200)
  }

  void window.fluffy.clearPetEvent()
}

function syncFromState(state: AppState): void {
  appState = state
  setMuted(state.settings.muted)
  petEl.style.opacity = String(state.settings.opacity)
  syncMuteLabel(state)

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
    if (!state || state.focusActive || machine.isBusy() || drag || menuOpen) {
      window.setTimeout(tick, 4000)
      return
    }

    const last =
      state.lastInteractionAt ??
      (state.cat ? Date.parse(state.cat.createdAt) || Date.now() : Date.now())
    const idleFor = Date.now() - last

    if (idleFor >= IDLE_SLEEP_AFTER_MS) {
      machine.tryAutonomous('sleep', 12000)
      window.setTimeout(tick, 14000)
      return
    }

    if (idleFor < 15_000) {
      machine.tryAutonomous('idle')
      window.setTimeout(tick, 8000)
      return
    }

    const roll = Math.random()
    if (roll < 0.22) {
      machine.tryAutonomous('yawn', 1600)
    } else if (roll < 0.42) {
      machine.tryAutonomous('groom', 2200)
    } else if (roll < 0.52) {
      machine.tryAutonomous('walk', 2400)
      void nudgeWalk()
    } else if (roll < 0.7) {
      machine.tryAutonomous('sleep', 8000)
    } else {
      machine.tryAutonomous('idle')
    }

    window.setTimeout(tick, 9000 + Math.random() * 6000)
  }
  tick()
}

async function nudgeWalk(): Promise<void> {
  const dx = Math.round((Math.random() - 0.5) * 48)
  const dy = Math.round((Math.random() - 0.5) * 24)
  const next = await window.fluffy.movePet({
    x: lastBounds.x + dx,
    y: lastBounds.y + dy,
    width: lastBounds.width,
    height: lastBounds.height
  })
  if (next) lastBounds = next
}

function doPet(): void {
  if (appState?.focusActive) {
    showBubble('专注中，我安静陪着…', 1800)
    return
  }

  machine.set('pet', 900, 'idle')
  showBubble('咕噜…')
  playPurr()

  const now = Date.now()
  const gain = appState?.cat && now - lastPetGainAt > 8000 ? 1 : 0
  if (gain) lastPetGainAt = now
  void window.fluffy.noteInteraction(gain)
}

petEl.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return
  petEl.setPointerCapture(e.pointerId)
  drag = {
    startX: e.screenX,
    startY: e.screenY,
    originX: lastBounds.x,
    originY: lastBounds.y,
    moved: false
  }
})

petEl.addEventListener('pointermove', (e) => {
  if (!drag) return
  const dist = Math.hypot(e.screenX - drag.startX, e.screenY - drag.startY)
  if (dist <= 6) return

  if (!drag.moved) {
    drag.moved = true
    machine.set('drag')
    if (menuOpen) void closeMenu()
  }

  void window.fluffy
    .movePet({
      x: drag.originX + (e.screenX - drag.startX),
      y: drag.originY + (e.screenY - drag.startY),
      width: lastBounds.width,
      height: lastBounds.height
    })
    .then((next) => {
      if (next) lastBounds = next
    })
})

petEl.addEventListener('pointerup', () => {
  if (!drag) return
  const wasDrag = drag.moved
  drag = null

  if (wasDrag) {
    machine.set(appState?.focusActive ? 'focus' : 'idle')
    return
  }

  // 单击：打开 / 切换快捷菜单（替代难找的系统托盘）
  if (menuOpen) {
    void closeMenu()
  } else {
    void openMenu()
  }
})

petEl.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  void openMenu()
})

backdropEl.addEventListener('click', () => {
  void closeMenu()
})

menuEl.addEventListener('click', async (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-menu]')
  const action = btn?.dataset.menu
  if (!action) return

  switch (action) {
    case 'home':
      await closeMenu()
      await window.fluffy.openHome()
      break
    case 'pet':
      doPet()
      break
    case 'mute': {
      const state = await window.fluffy.getState()
      await window.fluffy.setState({
        settings: { ...state.settings, muted: !state.settings.muted }
      })
      break
    }
    case 'close':
      await closeMenu()
      break
  }
})

window.fluffy.onPetBlur(() => {
  void closeMenu()
})

async function boot(): Promise<void> {
  const bounds = await window.fluffy.getPetBounds()
  if (bounds) lastBounds = bounds

  const state = await window.fluffy.getState()
  syncFromState(state)
  window.fluffy.onStateChanged(syncFromState)
  startAutonomousLoop()
}

void boot()
