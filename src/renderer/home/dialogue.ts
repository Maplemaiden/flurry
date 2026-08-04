/** MVP：预设词库轻量对话，后续可替换为更丰富规则 / 模型 */

const RULES: { pattern: RegExp; replies: string[] }[] = [
  {
    pattern: /累|疲惫|疲倦|困/,
    replies: [
      '那快躺下吧，我帮你踩踩奶，咕噜咕噜～',
      '累了就靠着我一会儿，世界可以先等等。'
    ]
  },
  {
    pattern: /难过|伤心|哭|郁闷/,
    replies: ['我在这儿呢。把头埋进我的毛毛里吧。', '没关系的，我记得你，也等着你。']
  },
  {
    pattern: /开心|高兴|棒|好消息/,
    replies: ['哇，那我也要摇尾巴庆祝！', '太好啦～让我蹭蹭你的手。']
  },
  {
    pattern: /你好|嗨|哈喽|早/,
    replies: ['喵～你来啦。', '伸个懒腰…早上好呀。']
  }
]

const FALLBACK = [
  '咕噜…我听着呢。',
  '用脑袋轻轻撞了撞你。',
  '不管说什么，我都在。'
]

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]!
}

export function replyToMessage(input: string): string {
  const text = input.trim()
  for (const rule of RULES) {
    if (rule.pattern.test(text)) return pick(rule.replies)
  }
  return pick(FALLBACK)
}
