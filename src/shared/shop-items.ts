import type { ItemEffect, ShopCategory, ShopItem } from './types'

/** 商店分类标签定义 */
export const SHOP_CATEGORIES: { id: ShopCategory; label: string; icon: string }[] = [
  { id: 'food', label: '食物', icon: '🍪' },
  { id: 'drink', label: '饮料', icon: '🥛' },
  { id: 'toy', label: '互动道具', icon: '🧶' },
  { id: 'study', label: '学习物品', icon: '📚' },
  { id: 'furniture', label: '家具', icon: '🛋️' },
  { id: 'clothes', label: '衣服', icon: '👕' },
  { id: 'room', label: '房间', icon: '🏠' },
  { id: 'skin', label: '皮肤', icon: '🎨' }
]

/** 全部商店物品 */
export const SHOP_ITEMS: ShopItem[] = [
  // —— 食物类 ——
  {
    id: 'fish-cookie',
    name: '小金鱼饼干',
    category: 'food',
    price: 30,
    description: '烤成小鱼形状的黄油饼干。猫咪嘎吱嘎吱吃完，满足地舔爪子。'
  },
  {
    id: 'milk-pudding',
    name: '奶香布丁',
    category: 'food',
    price: 40,
    description: '软嫩的牛奶布丁，吃完后猫咪眼睛变成满足的弯弯月牙，主动蹭屏幕求摸摸。'
  },
  {
    id: 'catnip-candy',
    name: '猫薄荷糖',
    category: 'food',
    price: 50,
    description: '食用后猫咪进入3分钟的"飘飘然"状态，打滚、追尾巴、扑腾空气。'
  },

  // —— 饮料类 ——
  {
    id: 'latte',
    name: '温暖拿铁',
    category: 'drink',
    price: 30,
    description: '猫咪特调拿铁（无咖啡因）。喝完走路留下浅浅奶渍脚印，持续15分钟。'
  },
  {
    id: 'sparkling-water',
    name: '气泡水',
    category: 'drink',
    price: 35,
    description: '喝完后"噗哈"一声，连续打嗝冒出小气泡升空破裂。持续8分钟。'
  },
  {
    id: 'honey-milk',
    name: '蜂蜜牛奶',
    category: 'drink',
    price: 40,
    description: '热蜂蜜牛奶，喝完露出极度安逸的表情，趴下时冒出zzZ和柔和光点。'
  },

  // —— 互动道具类 ——
  {
    id: 'yarn-ball',
    name: '毛线团',
    category: 'toy',
    price: 100,
    description: '经典红毛线团。拖拽丢出，猫咪兴奋追扑、拨弄，可能把自己缠住。'
  },
  {
    id: 'groom-brush',
    name: '梳毛刷',
    category: 'toy',
    price: 120,
    description: '圆头软针梳。给猫咪梳毛，咕噜眯眼，梳完飘出蒲公英般的小毛絮。'
  },
  {
    id: 'teaser-wand',
    name: '伸缩逗猫棒',
    category: 'toy',
    price: 150,
    description: '顶端带羽毛和小铃铛的伸缩棒。按住拖动，猫咪跟随扑跳，扑到后炫耀战利品。'
  },

  // —— 学习物品类 ——
  {
    id: 'cat-abacus',
    name: '喵喵小算盘',
    category: 'study',
    price: 120,
    description: '购买后自主学习界面变成猫咪拨弄彩色木算珠，算珠声清脆治愈。'
  },
  {
    id: 'paw-canvas',
    name: '爪印画板',
    category: 'study',
    price: 150,
    description: '猫咪用爪子在迷你画板上涂鸦，完成后的"大作"可贴在冰箱上展示。'
  },
  {
    id: 'star-storybook',
    name: '星空故事书',
    category: 'study',
    price: 180,
    description: '厚厚软软的绘本，猫咪趴在书上翻页，星星光标跳动。结束后沉沉睡去。'
  },

  // —— 家具类 ——
  {
    id: 'cat-tree',
    name: '软绵绵猫爬架',
    category: 'furniture',
    price: 250,
    description: '多层圆柱绒布猫爬架，带小窝和垂吊毛球。猫咪自行攀爬、钻窝探头。'
  },
  {
    id: 'cat-sofa',
    name: '咕噜噜小沙发',
    category: 'furniture',
    price: 300,
    description: '迷你皮质小沙发，猫咪专座。跳上去蜷成圈，或趴着看窗外。'
  },
  {
    id: 'moon-cradle',
    name: '月亮摇篮',
    category: 'furniture',
    price: 400,
    description: '藤编月亮形吊椅，挂在角落。猫咪躺在里面轻轻摇晃，发出呼噜声。'
  },

  // —— 衣服（占位） ——
  {
    id: 'clothes-placeholder',
    name: '敬请期待',
    category: 'clothes',
    price: 0,
    description: '新衣裳正在缝制中…',
    placeholder: true
  },

  // —— 房间（占位） ——
  {
    id: 'room-placeholder',
    name: '房间装饰',
    category: 'room',
    price: 0,
    description: '房间摆设与装潢正在准备中…',
    placeholder: true
  },

  // —— 皮肤（占位） ——
  {
    id: 'skin-placeholder',
    name: '皮肤主题',
    category: 'skin',
    price: 0,
    description: '壁纸与地板皮肤正在挑选…',
    placeholder: true
  }
]

/** 按 ID 查找物品 */
export function findShopItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === id)
}

/** 按分类筛选物品 */
export function getItemsByCategory(category: ShopCategory): ShopItem[] {
  return SHOP_ITEMS.filter((item) => item.category === category)
}

/** 是否消耗品（食物/饮料使用后扣减；道具/学习/家具为永久） */
export function isConsumable(item: ShopItem): boolean {
  return item.category === 'food' || item.category === 'drink'
}

/** 物品使用效果映射：行为动画 + 气泡 + 亲密度 + 是否消耗 */
const ITEM_EFFECTS: Record<string, ItemEffect> = {
  // —— 食物 ——
  'fish-cookie': { behavior: 'eat', bubble: '嘎吱嘎吱…好香！', intimacyDelta: 2, consume: true },
  'milk-pudding': { behavior: 'eat', bubble: '满足…想被摸摸～', intimacyDelta: 3, consume: true },
  'catnip-candy': { behavior: 'knead', bubble: '飘飘然…打滚～', intimacyDelta: 2, consume: true },
  // —— 饮料 ——
  'latte': { behavior: 'idle', bubble: '水汪汪…奶渍脚印', intimacyDelta: 2, consume: true },
  'sparkling-water': { behavior: 'yawn', bubble: '噗哈…打嗝气泡', intimacyDelta: 1, consume: true },
  'honey-milk': { behavior: 'sleep', bubble: '好安逸…zzZ', intimacyDelta: 3, consume: true },
  // —— 互动道具（永久） ——
  'yarn-ball': { behavior: 'celebrate', bubble: '追毛线团！', intimacyDelta: 2, consume: false },
  'groom-brush': { behavior: 'groom', bubble: '梳得亮晶晶…', intimacyDelta: 3, consume: false },
  'teaser-wand': { behavior: 'celebrate', bubble: '扑到啦！得意～', intimacyDelta: 3, consume: false },
  // —— 学习物品（永久） ——
  'cat-abacus': { behavior: 'focus', bubble: '拨算珠…认真学习', intimacyDelta: 1, consume: false },
  'paw-canvas': { behavior: 'focus', bubble: '画了一朵小花～', intimacyDelta: 2, consume: false },
  'star-storybook': { behavior: 'sleep', bubble: '翻着书…睡着了', intimacyDelta: 2, consume: false }
}

/** 获取物品使用效果；无则 undefined（家具/占位不可使用） */
export function getItemEffect(itemId: string): ItemEffect | undefined {
  return ITEM_EFFECTS[itemId]
}
