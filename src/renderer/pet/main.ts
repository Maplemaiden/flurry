import './styles.css'
import { IDLE_SLEEP_AFTER_MS } from '../../shared/defaults'
import type { AppState, CatBehavior, PetWindowBounds } from '../../shared/types'
import { CatSpritePlayer } from '../shared/catSprites'
import { playCelebrate, playMeow, playPurr, setMuted } from '../shared/audio'
import { BehaviorMachine, GREETINGS, WARM_CARE_LINES, pick } from './behavior'

const petEl = document.getElementById('pet') as HTMLDivElement
const headEl = document.getElementById('pet-head') as HTMLDivElement
const spriteEl = document.getElementById('pet-sprite') as HTMLImageElement
const bubbleEl = document.getElementById('bubble') as HTMLParagraphElement
const menuEl = document.getElementById('quick-menu') as HTMLDivElement
const interactEl = document.getElementById('interact-menu') as HTMLDivElement
const menuWrap = document.getElementById('menu-wrap') as HTMLDivElement
const backdropEl = document.getElementById('menu-backdrop') as HTMLDivElement
const muteBtn = document.getElementById('menu-mute') as HTMLButtonElement
const machine = new BehaviorMachine()
const sprites = new CatSpritePlayer(spriteEl)

let appState: AppState | null = null
let menuOpen = false
let nestedOpen = false
let lastBounds: PetWindowBounds = {
  x: 0,
  y: 0,
  width: window.outerWidth || 100,
  height: window.outerHeight || 150
}
let drag: {
  startX: number
  startY: number
  originX: number
  originY: number
  moved: boolean
} | null = null
/** 头部抚摸拖拽状态 */
let stroke: { lastX: number; active: boolean; lastTriggerAt: number } | null = null
let bubbleTimer: ReturnType<typeof setTimeout> | null = null
let lastPetGainAt = 0
let lastChatMessage: string | null = null
let autoCloseTimer: ReturnType<typeof setTimeout> | null = null
/** 猫睡觉时维持的 setTimeout */
let sleepBubbleTimer: ReturnType<typeof setTimeout> | null = null
let passthroughIgnore = true

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
  sprites.setBehavior(behavior)
}

machine.subscribe(applyVisual)

function syncMuteLabel(state: AppState): void {
  muteBtn.textContent = state.settings.muted ? '取消静音' : '静音'
}

async function setPassthrough(ignore: boolean): Promise<void> {
  if (passthroughIgnore === ignore) return
  passthroughIgnore = ignore
  await window.fluffy.setPetMousePassthrough(ignore)
}

async function openMenu(nested = false): Promise<void> {
  if (menuOpen && nested === nestedOpen) return
  menuOpen = true
  nestedOpen = nested
  menuEl.hidden = false
  interactEl.hidden = !nested
  backdropEl.hidden = false
  await setPassthrough(false)
  const next = await window.fluffy.setPetMenuOpen(true, nested)
  if (next) lastBounds = next
  if (appState) syncMuteLabel(appState)
  scheduleAutoClose()
}

async function closeMenu(): Promise<void> {
  if (!menuOpen) return
  menuOpen = false
  nestedOpen = false
  menuEl.hidden = true
  interactEl.hidden = true
  backdropEl.hidden = true
  cancelAutoClose()
  const next = await window.fluffy.setPetMenuOpen(false)
  if (next) lastBounds = next
  if (appState?.settings.clickThrough) {
    passthroughIgnore = true
    await window.fluffy.setPetMousePassthrough(true)
  }
}

async function toggleNested(): Promise<void> {
  nestedOpen = !nestedOpen
  interactEl.hidden = !nestedOpen
  const next = await window.fluffy.setPetMenuOpen(true, nestedOpen)
  if (next) lastBounds = next
  scheduleAutoClose()
}

function scheduleAutoClose(): void {
  cancelAutoClose()
  autoCloseTimer = setTimeout(() => {
    void closeMenu()
  }, 3000)
}

function cancelAutoClose(): void {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }
}

function handlePendingEvent(state: AppState): void {
  const ev = state.pendingPetEvent
  if (!ev) return

  if (ev === 'greet') {
    const name = state.cat?.name
    showBubble(name ? `${pick(GREETINGS)} · ${name}` : '双击我打开菜单～', 3500)
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
    showBubble('我在这儿～双击打开菜单', 2800)
    machine.set('pet', 1200)
  }

  void window.fluffy.clearPetEvent()
}

function syncFromState(state: AppState): void {
  appState = state
  setMuted(state.settings.muted)
  petEl.style.opacity = String(state.settings.opacity)
  syncMuteLabel(state)

  if (state.chatMessage && state.chatMessage !== lastChatMessage) {
    lastChatMessage = state.chatMessage
    showBubble(state.chatMessage, 5000)
  }

  if (state.catSleeping) {
    if (machine.get() === 'sleep' || (!machine.isBusy() && machine.get() !== 'sleep')) {
      machine.set('sleep')
    }
  } else if (machine.get() === 'sleep') {
    machine.set('idle')
  }

  if (state.focusActive) {
    if (machine.get() !== 'drag' && machine.get() !== 'celebrate') {
      machine.set('focus')
    }
  } else if (machine.get() === 'focus') {
    machine.set(state.catSleeping ? 'sleep' : 'idle')
  }

  handlePendingEvent(state)
}

function startAutonomousLoop(): void {
  const tick = (): void => {
    const state = appState
    if (!state || state.focusActive || machine.isBusy() || drag || stroke?.active || menuOpen) {
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

function doGroom(): void {
  if (appState?.focusActive) {
    showBubble('专注中，回头再梳～', 1800)
    return
  }
  if (appState?.catSleeping) {
    wakeCat('梳一梳就醒啦～')
    return
  }
  machine.set('groom', 1400, appState?.focusActive ? 'focus' : 'idle')
  showBubble('梳得亮晶晶…', 1800)
  playPurr(450)
  void window.fluffy.noteInteraction(1)
}

function doFeed(): void {
  if (appState?.focusActive) {
    showBubble('专注中，回头再喂～', 1800)
    return
  }
  if (appState?.catSleeping) {
    wakeCat('闻到香味就醒啦～')
    return
  }
  machine.set('eat', 1600, appState?.focusActive ? 'focus' : 'idle')
  showBubble('好好吃～ 🐟', 1800)
  playPurr(500)
  void window.fluffy.noteInteraction(2)
}

function doSleep(): void {
  if (appState?.focusActive) {
    showBubble('专注中，不能睡哦…', 1800)
    return
  }
  if (appState?.catSleeping) {
    wakeCat('醒啦～')
    return
  }
  void (async () => {
    await window.fluffy.setState({
      catSleeping: true,
      lastInteractionAt: Date.now()
    })
    if (sleepBubbleTimer) clearTimeout(sleepBubbleTimer)
    showBubble('呼呼大睡中…', 2000)
    void window.fluffy.noteInteraction(1)
  })()
}

function wakeCat(bubbleText = '醒啦～'): void {
  void (async () => {
    await window.fluffy.setState({ catSleeping: false })
    if (sleepBubbleTimer) {
      clearTimeout(sleepBubbleTimer)
      sleepBubbleTimer = null
    }
    showBubble(bubbleText, 1600)
  })()
}

function placeholder(name: string): void {
  showBubble(`${name}…（敬请期待）`, 1800)
}

/* ---------- 穿透热区：鼠标移入猫身时可点，移出恢复穿透 ---------- */

petEl.addEventListener('mouseenter', () => {
  if (!appState?.settings.clickThrough || menuOpen) return
  void setPassthrough(false)
})

petEl.addEventListener('mouseleave', () => {
  if (!appState?.settings.clickThrough || menuOpen || drag || stroke?.active) return
  void setPassthrough(true)
})

/* ---------- 指针交互：头部抚摸 / 身体移动 ---------- */

function isHeadTarget(target: EventTarget | null): boolean {
  return target === headEl || headEl.contains(target as Node)
}

petEl.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return
  petEl.setPointerCapture(e.pointerId)

  if (isHeadTarget(e.target)) {
    stroke = { lastX: e.screenX, active: true, lastTriggerAt: 0 }
    drag = null
    return
  }

  stroke = null
  drag = {
    startX: e.screenX,
    startY: e.screenY,
    originX: lastBounds.x,
    originY: lastBounds.y,
    moved: false
  }
})

petEl.addEventListener('pointermove', (e) => {
  if (stroke?.active) {
    const dx = e.screenX - stroke.lastX
    const now = Date.now()
    if (Math.abs(dx) >= 18 && now - stroke.lastTriggerAt > 500) {
      stroke.lastX = e.screenX
      stroke.lastTriggerAt = now
      if (menuOpen) void closeMenu()
      doPet()
    }
    return
  }

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
  if (stroke?.active) {
    stroke.active = false
    stroke = null
    if (appState?.settings.clickThrough && !menuOpen) void setPassthrough(true)
    return
  }

  if (!drag) return
  const wasDrag = drag.moved
  drag = null

  if (wasDrag) {
    machine.set(appState?.focusActive ? 'focus' : 'idle')
  }
  if (appState?.settings.clickThrough && !menuOpen) void setPassthrough(true)
})

petEl.addEventListener('dblclick', () => {
  if (appState?.catSleeping) {
    wakeCat('伸懒腰，醒啦～')
    return
  }
  if (menuOpen) {
    void closeMenu()
  } else {
    void openMenu(false)
  }
})

petEl.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  if (menuOpen) void closeMenu()
  else void openMenu(false)
})

menuWrap.addEventListener('mouseleave', () => {
  if (menuOpen) scheduleAutoClose()
})

menuWrap.addEventListener('mouseenter', () => {
  cancelAutoClose()
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
    case 'interact':
      await toggleNested()
      break
    case 'mute': {
      const state = await window.fluffy.getState()
      await window.fluffy.setState({
        settings: { ...state.settings, muted: !state.settings.muted }
      })
      scheduleAutoClose()
      break
    }
  }
})

interactEl.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-interact]')
  const action = btn?.dataset.interact
  if (!action) return

  switch (action) {
    case 'groom':
      doGroom()
      break
    case 'feed':
      doFeed()
      break
    case 'sleep':
      doSleep()
      break
    case 'study':
      placeholder('学习')
      break
    case 'play':
      placeholder('游戏')
      break
  }
  scheduleAutoClose()
})

window.fluffy.onPetBlur(() => {
  void closeMenu()
})

async function boot(): Promise<void> {
  const shadow = petEl.querySelector('.pet__shadow') as HTMLImageElement | null
  if (shadow) {
    shadow.src = encodeURI('/art/09_脚底投影/椭圆投影.png')
  }

  const bounds = await window.fluffy.getPetBounds()
  if (bounds) lastBounds = bounds

  const state = await window.fluffy.getState()
  syncFromState(state)
  applyVisual(machine.get())
  window.fluffy.onStateChanged(syncFromState)
  startAutonomousLoop()
}

void boot()
