import './styles.css'
import { SHOP_CATEGORIES, SHOP_ITEMS, getItemsByCategory } from '../../shared/shop-items'
import { hasInfiniteCoins } from '../../shared/testMode'
import type { AppState, ShopCategory, ShopItem } from '../../shared/types'
import fishCookieImg from './assets/fish-cookie.jpg'
import milkPuddingImg from './assets/milk-pudding.jpg'
import catnipCandyImg from './assets/catnip-candy.jpg'
import shopSceneImg from './assets/shop-scene-v2.jpg'
import drinkLatteImg from './assets/drink-latte.jpg'
import drinkSparklingImg from './assets/drink-sparkling.jpg'
import drinkHoneyMilkImg from './assets/drink-honeymilk.jpg'
import toyYarnImg from './assets/toy-yarn.jpg'
import toyBrushImg from './assets/toy-brush.jpg'
import toyWandImg from './assets/toy-wand.jpg'
import studyAbacusImg from './assets/study-abacus.jpg'
import studyCanvasImg from './assets/study-canvas.jpg'
import studyStorybookImg from './assets/study-storybook.jpg'
import furnTreeImg from './assets/furn-tree.jpg'
import furnSofaImg from './assets/furn-sofa.jpg'
import furnCradleImg from './assets/furn-cradle.jpg'

/** 物品对应的图片资源 */
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

let appState: AppState | null = null
let activeCategory: ShopCategory = 'food'

const coinCountEl = document.getElementById('coin-count') as HTMLSpanElement
const tabsEl = document.getElementById('category-tabs') as HTMLElement
const cabinetGridEl = document.getElementById('cabinet-grid') as HTMLElement
const shopBgEl = document.getElementById('shop-bg') as HTMLDivElement

function renderTabs(): void {
  tabsEl.innerHTML = ''
  for (const cat of SHOP_CATEGORIES) {
    const tab = document.createElement('button')
    tab.className = 'cabinet__tab' + (cat.id === activeCategory ? ' is-active' : '')
    tab.innerHTML = `<span class="cabinet__tab-icon">${cat.icon}</span>${cat.label}`
    tab.addEventListener('click', () => {
      activeCategory = cat.id
      renderTabs()
      renderGrid()
    })
    tabsEl.appendChild(tab)
  }
}

function renderGrid(): void {
  if (!cabinetGridEl) return
  cabinetGridEl.innerHTML = ''
  const items = getItemsByCategory(activeCategory)
  if (items.length === 0) {
    cabinetGridEl.innerHTML = '<div class="shop__empty">此分类暂无商品~</div>'
    return
  }
  for (const item of items) {
    try {
      const card = createItemCard(item)
      cabinetGridEl.appendChild(card)
    } catch (err) {
      console.error('[shop] failed to create card for', item.id, err)
    }
  }
}

function createItemCard(item: ShopItem): HTMLElement {
  const card = document.createElement('div')
  const backpack = appState?.backpack ?? {}
  const ownedCount = backpack[item.id] ?? 0
  const owned = ownedCount > 0
  const infinite = appState ? hasInfiniteCoins(appState.settings) : false
  const canAfford = infinite || (appState?.fishCoins ?? 0) >= item.price

  card.className = 'shop__item'
  if (owned) card.classList.add('is-owned')
  if (item.placeholder) card.classList.add('is-placeholder')

  const emoji = ITEM_EMOJI[item.id] ?? '📦'
  const img = ITEM_IMAGE[item.id]
  const iconHtml = img
    ? `<img class="item__img" src="${img}" alt="${item.name}" />`
    : emoji

  card.innerHTML = `
    <div class="item__icon ${item.placeholder ? 'item__icon--placeholder' : ''}">
      ${iconHtml}
      ${owned ? '<span class="item__owned-badge">已拥有</span>' : ''}
    </div>
    <div class="item__name">${item.name}</div>
    <div class="item__desc">${item.description}</div>
    <div class="item__footer">
      <div class="item__price">
        <span class="item__price-icon">🐟</span>
        ${item.placeholder ? '—' : item.price}
      </div>
      ${
        item.placeholder
          ? '<button class="item__buy-btn" disabled>敬请期待</button>'
          : owned
            ? '<button class="item__buy-btn is-owned" disabled>已拥有</button>'
            : `<button class="item__buy-btn" ${canAfford ? '' : 'disabled'}>购买</button>`
      }
    </div>
  `

  const buyBtn = card.querySelector('.item__buy-btn') as HTMLButtonElement
  if (buyBtn && !item.placeholder && !owned && canAfford) {
    buyBtn.addEventListener('click', (e) => void handleBuy(item, e))
  }

  return card
}

async function handleBuy(item: ShopItem, e: Event): Promise<void> {
  const result = await window.fluffy.buyItem(item.id)
  appState = result
  renderAll()

  const btn = e.currentTarget as HTMLButtonElement
  if (btn) {
    const rect = btn.getBoundingClientRect()
    for (let i = 0; i < 3; i++) {
      const coin = document.createElement('div')
      coin.className = 'coin-fly'
      coin.textContent = '🐟'
      coin.style.left = `${rect.left + rect.width / 2 + (Math.random() - 0.5) * 30}px`
      coin.style.top = `${rect.top}px`
      coin.style.animationDelay = `${i * 0.1}s`
      document.body.appendChild(coin)
      setTimeout(() => coin.remove(), 1000)
    }
  }
}

function renderCoins(): void {
  const infinite = appState ? hasInfiniteCoins(appState.settings) : false
  coinCountEl.textContent = infinite ? '∞' : String(appState?.fishCoins ?? 0)
}

function renderAll(): void {
  renderCoins()
  renderTabs()
  renderGrid()
}

async function boot(): Promise<void> {
  if (shopBgEl) shopBgEl.style.backgroundImage = `url("${shopSceneImg}")`

  try {
    appState = await window.fluffy.getState()
  } catch (err) {
    console.error('[shop] Failed to get state:', err)
    // 使用默认状态继续渲染，避免整个页面空白
    appState = {
      fishCoins: 50,
      backpack: {},
      settings: { opacity: 0.95, clickThrough: false, focusMinutes: 25, muted: false, ambient: 'rain' },
      onboardingDone: false,
      cat: null,
      focusActive: false,
      focusEndsAt: null,
      lastInteractionAt: null,
      lastWarmCareAt: null,
      pendingPetEvent: null,
      chatMessage: null,
      catSleeping: false,
      dailyCoins: { date: '', petCoins: 0, studyCoins: 0, lastPetCoinAt: null }
    }
  }

  try {
    renderAll()
  } catch (err) {
    console.error('[shop] Failed to render:', err)
  }

  window.fluffy.onStateChanged((state) => {
    appState = state
    try {
      renderAll()
    } catch (err) {
      console.error('[shop] Failed to re-render:', err)
    }
  })
}

boot().catch((err) => {
  console.error('[shop] Boot failed:', err)
  // 尝试显示错误信息
  const grid = document.getElementById('cabinet-grid')
  if (grid) {
    grid.innerHTML = '<div style="padding:20px;text-align:center;color:#a00;">商店加载失败，请重启应用</div>'
  }
})
