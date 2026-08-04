/** MVP：预设词库轻量对话 */

export type DialogueHook = 'knead' | 'nuzzle' | 'celebrate' | 'none'

export interface DialogueResult {
  text: string
  hook: DialogueHook
}

const RULES: { pattern: RegExp; replies: string[]; hook: DialogueHook }[] = [
  {
    pattern: /累|疲惫|疲倦|困/,
    replies: [
      '那快躺下吧，我帮你踩踩奶，咕噜咕噜～',
      '累了就靠着我一会儿，世界可以先等等。'
    ],
    hook: 'knead'
  },
  {
    pattern: /难过|伤心|哭|郁闷|委屈/,
    replies: ['我在这儿呢。把头埋进我的毛毛里吧。', '没关系的，我记得你，也等着你。'],
    hook: 'nuzzle'
  },
  {
    pattern: /开心|高兴|棒|好消息|耶/,
    replies: ['哇，那我也要摇尾巴庆祝！', '太好啦～让我蹭蹭你的手。'],
    hook: 'celebrate'
  },
  {
    pattern: /你好|嗨|哈喽|早|晚安/,
    replies: ['喵～你来啦。', '伸个懒腰…我在哦。'],
    hook: 'nuzzle'
  }
]

const CRISIS = {
  pattern: /自杀|自伤|不想活|结束生命/,
  text: '我在这儿陪着你。你很重要。若此刻很难熬，请向身边信任的人或专业援助求助。',
  hook: 'nuzzle' as DialogueHook
}

const FALLBACK: DialogueResult[] = [
  { text: '咕噜…我听着呢。', hook: 'none' },
  { text: '用脑袋轻轻撞了撞你。', hook: 'nuzzle' },
  { text: '不管说什么，我都在。', hook: 'none' }
]

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]!
}

export function replyToMessage(input: string): DialogueResult {
  const text = input.trim()
  if (!text) return { text: '……（歪头看着你）', hook: 'none' }

  if (CRISIS.pattern.test(text)) {
    return { text: CRISIS.text, hook: CRISIS.hook }
  }

  for (const rule of RULES) {
    if (rule.pattern.test(text)) {
      return { text: pick(rule.replies), hook: rule.hook }
    }
  }
  return pick(FALLBACK)
}
