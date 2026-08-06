import './styles.css'
import { SHOP_CATEGORIES, SHOP_ITEMS, getItemEffect } from '../../shared/shop-items'
import type { AppState, ShopCategory, ShopItem } from '../../shared/types'
import fishCookieImg from '../shop/assets/fish-cookie.jpg'
import milkPuddingImg from '../shop/assets/milk-pudding.jpg'
import catnipCandyImg from '../shop/assets/catnip-candy.jpg'
import drinkLatteImg from '../shop/assets/drink-latte.jpg'
import drinkSparklingImg from '../shop/assets/drink-sparkling.jpg'
import drinkHoneyMilkImg from '../shop/assets/drink-honeymilk.jpg'
import toyYarnImg from '../shop/assets/toy-yarn.jpg'
import toyBrushImg from '../shop/assets/toy-brush.jpg'
import toyWandImg from '../shop/assets/toy-wand.jpg'
import studyAbacusImg from '../shop/assets/study-abacus.jpg'
import studyCanvasImg from '../shop/assets/study-canvas.jpg'
import studyStorybookImg from '../shop/assets/study-storybook.jpg'
import furnTreeImg from '../shop/assets/furn-tree.jpg'
import furnSofaImg from '../shop/assets/furn-sofa.jpg'
import furnCradleImg from '../shop/assets/furn-cradle.jpg'
import backpackSceneImg from './assets/backpack-scene.jpg'

/** 物品对应的图片资源（有图则用图，否则用 emoji 占位） */
const ITEM_IMAGE: Record<string, string> = {
  'fish-cookie': fishCookieImg,
  'milk-pudding': milkPuddingImg,
  'catnip-candy': catnipCandyImg,
  'latte': drinkLatteImg,
  'sparkling-water': drinkSparklingImg,
  'honey-milk': drinkHoneyMilkImg,
  'yarn-ball': toyYarnImg,
  'groom-brush': toyBrushImg,
  'teaser-wand': toyWandImg,
  'cat-abacus': studyAbacusImg,
  'paw-canvas': studyCanvasImg,
  'star-storybook': studyStorybookImg,
  'cat-tree': furnTreeImg,
  'cat-sofa': furnSofaImg,
  'moon-cradle': furnCradleImg
}

/** 物品对应的 emoji 图标 */
const ITEM_EMOJI: Record<string, string> = {
  'fish-cookie': '🐟',
  'milk-pudding': '🍮',
  'catnip-candy': '🍬',
  'latte': '☕',
  'sparkling-water': '💧',
  'honey-milk': '🍯',
  'yarn-ball': '🧶',
  'groom-brush': '🖌️',
  'teaser-wand': '🪶',
  'cat-abacus': '🧮',
  'paw-canvas': '🎨',
  'star-storybook': '📖',
  'cat-tree': '🌳',
  'cat-sofa': '🛋️',
  'moon-cradle': '🌙',
  'clothes-placeholder': '👕',
  'room-placeholder': '🏠',
  'skin-placeholder': '🎨'
}

/** 背包中可显示的分类（排除纯占位分类） */
const BACKPACK_CATEGORIES = SHOP_CATEGORIES.filter((c) => c.id !== 'clothes' && c.id !== 'room' && c.id !== 'skin')

const tabsEl = document.getElementById('category-tabs') as HTMLDivElement
const gridEl = document.getElementById('backpack-grid') as HTMLDivElement
const emptyEl = document.getElementById('empty-state') as HTMLDivElement
const shopBtn = document.getElementById('goto-shop') as HTMLButtonElement
const toastEl = document.getElementById('toast') as HTMLDivElement
const backpackBgEl = document.getElementById('backpack-bg') as HTMLDivElement

let appState: AppState | null = null
let activeCategory: ShopCategory = 'food'
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(text: string): void {
  toastEl.hidden = false
  toastEl.textContent = text
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastEl.hidden = true
  }, 1800)
}

function renderTabs(): void {
  tabsEl.innerHTML = ''
  for (const cat of BACKPACK_CATEGORIES) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'backpack__tab' + (cat.id === activeCategory ? ' is-active' : '')
    btn.textContent = `${cat.icon} ${cat.label}`
    btn.addEventListener('click', () => {
      activeCategory = cat.id
      renderTabs()
      renderGrid()
    })
    tabsEl.appendChild(btn)
  }
}

function renderGrid(): void {
  gridEl.innerHTML = ''
  if (!appState) return

  const owned = Object.entries(appState.backpack)
    .filter(([, count]) => count > 0)
    .map(([id]) => SHOP_ITEMS.find((it) => it.id === id))
    .filter((it): it is ShopItem => it !== undefined && it.category === activeCategory)

  if (owned.length === 0) {
    gridEl.hidden = true
    emptyEl.hidden = false
    return
  }

  gridEl.hidden = false
  emptyEl.hidden = true

  for (const item of owned) {
    const count = appState.backpack[item.id] ?? 0
    const effect = getItemEffect(item.id)
    const card = document.createElement('div')
    card.className = 'item-card'

    const iconWrap = document.createElement('div')
    if (ITEM_IMAGE[item.id]) {
      const img = document.createElement('img')
      img.className = 'item-card__icon'
      img.src = ITEM_IMAGE[item.id]
      img.alt = item.name
      iconWrap.appendChild(img)
    } else {
      const emoji = document.createElement('div')
      emoji.className = 'item-card__emoji'
      emoji.textContent = ITEM_EMOJI[item.id] ?? '📦'
      iconWrap.appendChild(emoji)
    }
    card.appendChild(iconWrap)

    const name = document.createElement('div')
    name.className = 'item-card__name'
    name.textContent = item.name
    card.appendChild(name)

    const desc = document.createElement('div')
    desc.className = 'item-card__desc'
    desc.textContent = item.description
    card.appendChild(desc)

    const footer = document.createElement('div')
    footer.className = 'item-card__footer'

    const countEl = document.createElement('span')
    countEl.className = 'item-card__count'
    countEl.textContent = `×${count}`
    footer.appendChild(countEl)

    if (effect) {
      const useBtn = document.createElement('button')
      useBtn.type = 'button'
      useBtn.className = 'item-card__use-btn'
      useBtn.textContent = '使用'
      useBtn.addEventListener('click', () => void handleUse(item.id))
      footer.appendChild(useBtn)
    } else {
      const tag = document.createElement('span')
      tag.className = 'item-card__count'
      tag.textContent = '已放置'
      footer.appendChild(tag)
    }

    card.appendChild(footer)
    gridEl.appendChild(card)
  }
}

async function handleUse(itemId: string): Promise<void> {
  const result = await window.fluffy.useItem(itemId)
  appState = result.state
  renderGrid()
  if (result.effect) {
    showToast(`${result.effect.bubble}`)
  } else {
    showToast('无法使用此物品')
  }
}

function syncFromState(state: AppState): void {
  appState = state
  renderGrid()
}

async function boot(): Promise<void> {
  // 背景画
  if (backpackBgEl) backpackBgEl.style.backgroundImage = `url("${backpackSceneImg}")`

  const state = await window.fluffy.getState()
  appState = state
  renderTabs()
  renderGrid()
  window.fluffy.onStateChanged(syncFromState)

  // 监听主进程的初始分类切换（从桌宠/小窝喂食入口打开时）
  window.fluffy.onBackpackCategory((category) => {
    activeCategory = category
    renderTabs()
    renderGrid()
  })
}

shopBtn.addEventListener('click', () => {
  void window.fluffy.openShop()
})

void boot()
