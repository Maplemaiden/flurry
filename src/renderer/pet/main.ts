import './styles.css'
import type { AppState, CatBehavior } from '../../shared/types'

const petEl = document.getElementById('pet') as HTMLDivElement
const bubbleEl = document.getElementById('bubble') as HTMLParagraphElement

let behavior: CatBehavior = 'idle'
let drag: { startX: number; startY: number; winX: number; winY: number } | null = null

function applyBehavior(next: CatBehavior): void {
  behavior = next
  petEl.classList.toggle('is-sleep', next === 'sleep')
  petEl.classList.toggle('is-focus', next === 'focus')
}

function showBubble(text: string, ms = 2200): void {
  bubbleEl.hidden = false
  bubbleEl.textContent = text
  window.setTimeout(() => {
    bubbleEl.hidden = true
  }, ms)
}

function syncFromState(state: AppState): void {
  if (state.focusActive) {
    applyBehavior('focus')
  } else if (behavior === 'focus') {
    applyBehavior('idle')
  }
  document.body.style.opacity = String(state.settings.opacity)
}

/** 自主闲逛占位：后续接真实动画状态机 */
function startIdleLoop(): void {
  const tick = (): void => {
    if (behavior === 'focus' || behavior === 'drag' || behavior === 'pet') {
      window.setTimeout(tick, 4000)
      return
    }
    const roll = Math.random()
    if (roll < 0.15) {
      applyBehavior('yawn')
      showBubble('哈欠…')
      window.setTimeout(() => applyBehavior('idle'), 1600)
    } else if (roll < 0.3) {
      applyBehavior('sleep')
      window.setTimeout(() => applyBehavior('idle'), 5000)
    } else {
      applyBehavior('idle')
    }
    window.setTimeout(tick, 6000 + Math.random() * 4000)
  }
  tick()
}

petEl.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return
  petEl.setPointerCapture(e.pointerId)
  applyBehavior('drag')
  drag = {
    startX: e.screenX,
    startY: e.screenY,
    winX: window.screenX,
    winY: window.screenY
  }
})

petEl.addEventListener('pointermove', (e) => {
  if (!drag) return
  const x = drag.winX + (e.screenX - drag.startX)
  const y = drag.winY + (e.screenY - drag.startY)
  void window.fluffy.movePet({
    x,
    y,
    width: window.outerWidth,
    height: window.outerHeight
  })
})

petEl.addEventListener('pointerup', () => {
  if (!drag) return
  drag = null
  applyBehavior('idle')
})

petEl.addEventListener('dblclick', () => {
  void window.fluffy.openHome()
})

petEl.addEventListener('click', () => {
  if (behavior === 'drag') return
  applyBehavior('pet')
  showBubble('咕噜…')
  window.setTimeout(() => applyBehavior(behavior === 'focus' ? 'focus' : 'idle'), 900)
})

async function boot(): Promise<void> {
  const state = await window.fluffy.getState()
  syncFromState(state)

  if (!state.onboardingDone || !state.cat) {
    showBubble('嗨，我是 Fluffy～双击打开小窝', 4000)
  } else {
    showBubble(`${state.cat.name} 来啦`, 2500)
  }

  window.fluffy.onStateChanged(syncFromState)
  startIdleLoop()
}

void boot()
