import './styles.css'
import { INTIMACY_UNLOCKS } from '../../shared/defaults'
import { getUnlocked } from '../../shared/intimacy'
import type { AmbientSound, AppState, CatBehavior, HomeScene } from '../../shared/types'
import type { TestAction } from '../../shared/testMode'
import {
  playAmbient,
  playBgm,
  playEatSfx,
  playKneadSfx,
  playMeow,
  playPetSfx,
  playPurr,
  setMuted
} from '../shared/audio'
import { CatSpritePlayer, artUrl, homeBackgroundUrl } from '../shared/catSprites'
import { replyToMessage, type DialogueHook } from './dialogue'

const onboardEl = document.getElementById('onboard') as HTMLElement
const chatBar = document.getElementById('chat-bar') as HTMLElement
const interactPopover = document.getElementById('interact-popover') as HTMLElement
const settingsPanel = document.getElementById('settings-panel') as HTMLElement
const subtitleEl = document.getElementById('subtitle') as HTMLElement
const stageEl = document.getElementById('stage') as HTMLElement
const stageCat = document.getElementById('stage-cat') as HTMLImageElement
const stageShadow = document.getElementById('stage-shadow') as HTMLImageElement
const stageProp = document.getElementById('stage-prop') as HTMLElement
const stageHint = document.getElementById('stage-hint') as HTMLElement
const unlocksEl = document.getElementById('unlocks') as HTMLElement
const focusTimerEl = document.getElementById('focus-timer') as HTMLElement
const focusBtn = document.getElementById('focus-btn') as HTMLButtonElement
const catNameInput = document.getElementById('cat-name') as HTMLInputElement
const chatInput = document.getElementById('chat-input') as HTMLInputElement
const interactBtn = document.getElementById('interact-btn') as HTMLButtonElement
const talkBtn = document.getElementById('talk-btn') as HTMLButtonElement

const optOpacity = document.getElementById('opt-opacity') as HTMLInputElement
const optFocusMin = document.getElementById('opt-focus-min') as HTMLInputElement
const optAmbient = document.getElementById('opt-ambient') as HTMLSelectElement
const optMuted = document.getElementById('opt-muted') as HTMLInputElement
const optClick = document.getElementById('opt-clickthrough') as HTMLInputElement
const optCatName = document.getElementById('opt-cat-name') as HTMLInputElement
const optCatNameSave = document.getElementById('opt-cat-name-save') as HTMLButtonElement
const settingsDev = document.getElementById('settings-dev') as HTMLElement
const testInfiniteCoins = document.getElementById('test-infinite-coins') as HTMLInputElement
const testSkipCaps = document.getElementById('test-skip-caps') as HTMLInputElement
const testFastFocus = document.getElementById('test-fast-focus') as HTMLInputElement

const homeSprites = new CatSpritePlayer(stageCat)
stageShadow.src = artUrl('09_脚底投影', '椭圆投影.png')

let scene: HomeScene = 'default'
let appState: AppState | null = null
let timerTick: ReturnType<typeof setInterval> | null = null
/** 临时文案/道具保护，避免被 render 立刻冲掉 */
let feedbackUntil = 0
let holdProp: { kind: string; emoji: string } | null = null
let chatOpen = false
let settingsOpen = false
let tempBehaviorUntil = 0

function setHomeBehavior(behavior: CatBehavior, ms?: number): void {
  homeSprites.setBehavior(behavior)
  if (ms !== undefined) {
    tempBehaviorUntil = Date.now() + ms
    window.setTimeout(() => {
      if (Date.now() < tempBehaviorUntil) return
      syncHomeSprite(appState)
    }, ms + 30)
  } else {
    tempBehaviorUntil = 0
  }
}

function syncHomeSprite(state: AppState | null): void {
  if (!state) return
  if (Date.now() < tempBehaviorUntil) return
  if (state.focusActive) setHomeBehavior('focus')
  else if (state.catSleeping) setHomeBehavior('sleep')
  else setHomeBehavior('idle')
}

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
    playKneadSfx()
    playPurr(700)
    window.setTimeout(() => stageCat.classList.remove('is-knead'), 2000)
  } else if (hook === 'nuzzle') {
    playPetSfx()
    playPurr(400)
  } else if (hook === 'celebrate') {
    playMeow()
    playPurr(500)
  }
}

function syncAmbient(state: AppState): void {
  setMuted(state.settings.muted)
  if (state.settings.muted) {
    playAmbient('none')
    playBgm('none')
    return
  }
  if (state.focusActive || scene === 'sleep') {
    playAmbient(state.settings.ambient)
  } else {
    playAmbient('none')
  }
  if (state.focusActive) playBgm('focus', 0.16)
  else playBgm('home', 0.18)
}

function syncActionButtons(state: AppState): void {
  document.querySelectorAll<HTMLButtonElement>('.home__actions [data-action]').forEach((btn) => {
    const action = btn.dataset.action
    const active =
      (action === 'study' && state.focusActive) ||
      (action === 'interact' && !interactPopover.hidden) ||
      (action === 'settings' && settingsOpen) ||
      (action === 'talk' && chatOpen)
    btn.classList.toggle('is-active', Boolean(active))
  })

  // 合并后的学习陪伴按钮文案
  if (state.focusActive) {
    focusBtn.textContent = '结束陪伴'
  } else {
    focusBtn.textContent = '学习陪伴'
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
  if (document.activeElement !== optCatName) {
    optCatName.value = state.cat?.name ?? ''
    optCatName.disabled = !state.cat
    optCatNameSave.disabled = !state.cat
  }

  const testOn = Boolean(state.settings.testMode)
  settingsDev.hidden = !testOn
  if (testOn) {
    testInfiniteCoins.checked = Boolean(state.settings.testInfiniteCoins)
    testSkipCaps.checked = Boolean(state.settings.testSkipCaps)
    testFastFocus.checked = Boolean(state.settings.testFastFocus)
  }

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

  // scene 由共享 catSleeping 和 focusActive 驱动
  const sleepVisual = state.catSleeping && !state.focusActive
  stageEl.classList.toggle('is-sleep', sleepVisual)
  stageEl.classList.toggle('is-study', scene === 'study' || state.focusActive)
  stageEl.classList.toggle('is-focus', state.focusActive)
  stageCat.classList.toggle('is-sleep', state.catSleeping || state.focusActive)

  const bgScene: HomeScene = state.focusActive
    ? 'study'
    : state.catSleeping
      ? 'sleep'
      : scene === 'study'
        ? 'study'
        : 'default'
  stageEl.style.backgroundImage = `linear-gradient(180deg, rgba(255,250,244,0.18), rgba(255,245,235,0.35)), url("${homeBackgroundUrl(bgScene)}")`

  syncHomeSprite(state)

  const holdingFeedback = Date.now() < feedbackUntil

  if (state.focusActive) {
    if (!holdingFeedback) {
      setProp(null)
      stageHint.textContent = '学习陪伴中… 我在安静陪着你'
    }
    focusTimerEl.hidden = false
  } else {
    focusTimerEl.hidden = true
    if (holdingFeedback) {
      if (holdProp) setProp(holdProp.kind, holdProp.emoji)
    } else if (state.catSleeping) {
      holdProp = null
      setProp('sleep', '🛏️')
      stageHint.textContent = '呼呼大睡中 · 再点「睡觉」或其他互动可唤醒'
    } else {
      holdProp = null
      setProp(null)
      stageHint.textContent = chatOpen
        ? '小猫在听… 试试下方提示词或自己说点什么'
        : '在这里照顾你的小猫 · 右上角可返回桌面'
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

/* ---------- 互动浮层 + 主操作按钮 ---------- */

function placeholder(name: string): void {
  setFeedback(`${name}…（敬请期待）`, 1800)
}

async function wakeHome(bubble: string): Promise<void> {
  const s = await window.fluffy.getState()
  if (!s.catSleeping) return
  await window.fluffy.setState({ catSleeping: false })
  setFeedback(bubble, 1600, null)
}

/** 喂养（保留原功能） */
async function doFeed(): Promise<void> {
  const state = await window.fluffy.getState()
  if (state.catSleeping) {
    await wakeHome('闻到香味就醒啦～')
    return
  }
  scene = 'default'
  stageCat.classList.add('is-eat')
  setHomeBehavior('eat', 1600)
  setFeedback('好好吃～', 1800, { kind: 'food', emoji: '🐟' })
  playEatSfx()
  playPurr(500)
  await window.fluffy.noteInteraction(2)
  window.setTimeout(() => {
    stageCat.classList.remove('is-eat')
    holdProp = null
  }, 1600)
}

/** 睡觉：切换 catSleeping；若已睡觉则再次点击唤醒（保留原功能） */
async function doSleep(): Promise<void> {
  const state = await window.fluffy.getState()
  if (state.catSleeping) {
    await wakeHome('醒啦～')
    return
  }
  // 首次点击：进入睡觉状态
  scene = 'sleep'
  await window.fluffy.setState({
    catSleeping: true,
    lastInteractionAt: Date.now()
  })
  await window.fluffy.noteInteraction(1)
}

/** 梳毛（保留原功能，与未修改版一致） */
async function doGroom(): Promise<void> {
  const state = await window.fluffy.getState()
  if (state.catSleeping) {
    await wakeHome('梳一梳就醒啦～')
    return
  }
  scene = 'default'
  stageCat.classList.add('is-groom')
  setHomeBehavior('groom', 1400)
  setFeedback('梳得亮晶晶…', 1600)
  playPurr(450)
  await window.fluffy.noteInteraction(1)
  window.setTimeout(() => stageCat.classList.remove('is-groom'), 1400)
}

interactBtn.addEventListener('click', () => {
  if (settingsOpen) void toggleSettings(false)
  interactPopover.hidden = !interactPopover.hidden
  if (appState) syncActionButtons(appState)
})

interactPopover.addEventListener('click', async (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-interact]')
  const action = btn?.dataset.interact
  if (!action) return

  const state = await window.fluffy.getState()
  if (!state.cat) {
    setFeedback('先领养一只小猫吧', 2000)
    return
  }

  switch (action) {
    case 'feed':
      // 打开背包选择食物（选项框）
      interactPopover.hidden = true
      try {
        await window.fluffy.openBackpack('food')
      } catch (e) {
        console.error('[home] openBackpack(food) failed:', e)
        alert('打开背包失败，请重试\n\n' + String(e))
      }
      return
    case 'play':
      // 打开背包选择互动道具
      interactPopover.hidden = true
      try {
        await window.fluffy.openBackpack('toy')
      } catch (e) {
        console.error('[home] openBackpack(toy) failed:', e)
        alert('打开背包失败，请重试\n\n' + String(e))
      }
      return
    case 'study':
      // 打开背包选择学习物品
      interactPopover.hidden = true
      try {
        await window.fluffy.openBackpack('study')
      } catch (e) {
        console.error('[home] openBackpack(study) failed:', e)
        alert('打开背包失败，请重试\n\n' + String(e))
      }
      return
    case 'sleep':
      await doSleep()
      break
    case 'groom':
      await doGroom()
      break
  }

  render(await window.fluffy.getState())
})

document.querySelector('.home__actions')?.addEventListener('click', async (e) => {
  const target = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')
  const action = target?.dataset.action
  if (!action) return

  // 互动按钮单独处理（上面已绑定），这里跳过避免双触发
  if (action === 'interact') return

  const state = await window.fluffy.getState()

  switch (action) {
    case 'shop':
      await window.fluffy.openShop()
      return
    case 'backpack':
      try {
        await window.fluffy.openBackpack('food')
      } catch (e) {
        console.error('[home] openBackpack failed:', e)
        alert('打开背包失败，请重试\n\n' + String(e))
      }
      return
    case 'settings':
      await toggleSettings()
      return
    case 'study': {
      // 学习陪伴与专注模式合并：单击切换专注
      if (!state.cat) {
        setFeedback('先领养一只小猫吧', 2000)
        return
      }
      if (state.catSleeping) {
        await wakeHome('该学习啦～伸个懒腰醒来')
        return
      }
      if (state.focusActive) {
        await window.fluffy.stopFocus(false)
        scene = 'default'
        setFeedback('陪伴结束啦，随时可以再开始', 2500)
      } else {
        scene = 'study'
        await window.fluffy.startFocus()
        setFeedback('学习陪伴开始啦，我会安静陪着你', 2500)
      }
      break
    }
    case 'talk':
      if (state.catSleeping) {
        await wakeHome('想聊天啦？喵～')
      }
      await toggleChat()
      break
  }

  render(await window.fluffy.getState())
})

async function toggleSettings(force?: boolean): Promise<void> {
  settingsOpen = force ?? !settingsOpen
  settingsPanel.hidden = !settingsOpen
  if (settingsOpen) {
    interactPopover.hidden = true
    if (chatOpen) {
      chatOpen = false
      chatBar.hidden = true
    }
    const state = await window.fluffy.getState()
    optCatName.value = state.cat?.name ?? ''
    optCatName.disabled = !state.cat
    optCatNameSave.disabled = !state.cat
    if (state.cat) optCatName.focus()
  }
  if (appState) syncActionButtons(appState)
}

document.getElementById('settings-close')?.addEventListener('click', () => {
  void toggleSettings(false)
})

settingsPanel.addEventListener('click', (e) => {
  if (e.target === settingsPanel) void toggleSettings(false)
})

async function saveCatName(): Promise<void> {
  const state = await window.fluffy.getState()
  if (!state.cat) {
    setFeedback('先领养一只小猫吧', 2000)
    return
  }
  const name = optCatName.value.trim().slice(0, 12)
  if (!name) {
    setFeedback('名字不能为空', 1600)
    optCatName.value = state.cat.name
    return
  }
  if (name === state.cat.name) {
    setFeedback('名字没有变化', 1400)
    return
  }
  const next = await window.fluffy.setState({
    cat: { ...state.cat, name }
  })
  setFeedback(`以后就叫你「${next.cat?.name}」啦`, 2200)
  render(next)
}

optCatNameSave.addEventListener('click', () => {
  void saveCatName()
})

optCatName.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') void saveCatName()
})

/* ---------- 说说话：底部聊天栏 + 桌宠气泡 ---------- */

async function toggleChat(): Promise<void> {
  chatOpen = !chatOpen
  chatBar.hidden = !chatOpen
  if (chatOpen) {
    if (settingsOpen) await toggleSettings(false)
    // 桌宠气泡弹出问候
    await window.fluffy.setState({ chatMessage: '今天要聊什么呢？喵~' })
    chatInput.focus()
  } else {
    setFeedback('已回到小窝', 1600)
  }
  if (appState) syncActionButtons(appState)
}

async function sendChat(text: string): Promise<void> {
  const trimmed = text.trim()
  if (!trimmed) return
  const result = replyToMessage(trimmed)
  // 回复显示在桌宠气泡
  await window.fluffy.setState({ chatMessage: result.text })
  applyHook(result.hook)
  chatInput.value = ''
  await window.fluffy.noteInteraction(1)
  render(await window.fluffy.getState())
}

document.getElementById('chat-send')?.addEventListener('click', () => {
  void sendChat(chatInput.value)
})

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') void sendChat(chatInput.value)
})

document.querySelectorAll<HTMLButtonElement>('.chat__prompt').forEach((btn) => {
  btn.addEventListener('click', () => {
    const prompt = btn.dataset.prompt ?? ''
    chatInput.value = prompt
    void sendChat(prompt)
  })
})

// 重置按钮：占位，暂不开发
document.getElementById('chat-reset')?.addEventListener('click', () => {
  setFeedback('重置功能敬请期待', 1400)
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
    setFeedback('已开启点击穿透：桌宠点不到也拖不动；用 Ctrl+Alt+P 或托盘关闭。重启后会自动关闭穿透', 5000)
  }
})

testInfiniteCoins.addEventListener('change', () => {
  void patchSettings({ testInfiniteCoins: testInfiniteCoins.checked })
})
testSkipCaps.addEventListener('change', () => {
  void patchSettings({ testSkipCaps: testSkipCaps.checked })
})
testFastFocus.addEventListener('change', () => {
  void patchSettings({ testFastFocus: testFastFocus.checked })
})

document.querySelectorAll<HTMLButtonElement>('[data-test]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.test
    if (!action) return
    void (async () => {
      if (action === 'reset-state' && !confirm('确定重置存档？测试开关会保留。')) return
      const next = await window.fluffy.testAction(action as TestAction, btn.dataset.payload)
      if (action === 'skip-onboard') onboardEl.hidden = true
      if (action === 'reset-state') {
        scene = 'default'
        chatOpen = false
        chatBar.hidden = true
      }
      const labels: Record<string, string> = {
        'skip-onboard': '已跳过领养',
        'add-coins': '已加 999 小魚乾',
        'fill-backpack': '背包已填满',
        'clear-backpack': '背包已清空',
        'reset-daily': '每日上限已重置',
        'trigger-event': '已触发桌宠事件',
        'reset-state': '存档已重置'
      }
      setFeedback(labels[action] ?? '完成', 1800)
      render(next)
    })()
  })
})

async function boot(): Promise<void> {
  const state = await window.fluffy.getState()
  if (state.catSleeping) scene = 'sleep'
  else if (state.focusActive) scene = 'study'
  render(state)
  window.fluffy.onStateChanged((s) => {
    const wasFocus = appState?.focusActive
    if (s.focusActive) scene = 'study'
    else if (s.catSleeping) scene = 'sleep'
    else if (!s.focusActive && wasFocus) scene = 'default'
    if (!s.focusActive && wasFocus) {
      scene = 'default'
      // 庆祝音效由桌宠窗播放，这里只留文案，避免双响
      if (s.pendingPetEvent === 'celebrate') {
        setFeedback('陪伴结束啦！桌面上的小猫在庆祝～', 3500)
      }
    }
    render(s)
  })
}

void boot()
