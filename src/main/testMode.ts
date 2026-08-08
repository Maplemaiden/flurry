import { DEFAULT_STATE } from '../shared/defaults'
import { SHOP_ITEMS, isConsumable } from '../shared/shop-items'
import type { TestAction } from '../shared/testMode'
import type { AppState, PendingPetEvent } from '../shared/types'
import { broadcastState } from './focus'
import { getState, setState } from './store'

export function applyTestBootFlags(): void {
  if (process.env['FLUFFY_TEST'] !== '1') return

  const next = setState({
    fishCoins: 9999,
    settings: {
      ...getState().settings,
      testMode: true,
      testInfiniteCoins: true,
      testSkipCaps: true,
      testFastFocus: true
    }
  })
  broadcastState(next)
  console.log('[test] FLUFFY_TEST=1 — cheats enabled (infinite coins, skip caps, 10s focus)')
}

export function runTestAction(action: TestAction, payload?: string): AppState {
  const state = getState()
  if (!state.settings.testMode) return state

  let next: AppState

  switch (action) {
    case 'skip-onboard':
      next = setState({
        onboardingDone: true,
        cat:
          state.cat ?? {
            name: '测试猫',
            personality: 'gentle',
            intimacy: 50,
            createdAt: new Date().toISOString()
          }
      })
      break
    case 'add-coins':
      next = setState({ fishCoins: state.fishCoins + 999 })
      break
    case 'fill-backpack': {
      const backpack: Record<string, number> = {}
      for (const item of SHOP_ITEMS) {
        if (item.placeholder) continue
        backpack[item.id] = isConsumable(item) ? 5 : 1
      }
      next = setState({ backpack })
      break
    }
    case 'clear-backpack':
      next = setState({ backpack: {} })
      break
    case 'reset-daily':
      next = setState({
        dailyCoins: { date: '', petCoins: 0, studyCoins: 0, lastPetCoinAt: null }
      })
      break
    case 'trigger-event': {
      const ev = (payload ?? 'celebrate') as PendingPetEvent
      next = setState({ pendingPetEvent: ev })
      break
    }
    case 'reset-state': {
      const testSettings = state.settings
      next = setState({
        ...structuredClone(DEFAULT_STATE),
        settings: {
          ...DEFAULT_STATE.settings,
          testMode: testSettings.testMode,
          testInfiniteCoins: testSettings.testInfiniteCoins,
          testSkipCaps: testSettings.testSkipCaps,
          testFastFocus: testSettings.testFastFocus
        },
        fishCoins: testSettings.testInfiniteCoins ? 9999 : DEFAULT_STATE.fishCoins
      })
      break
    }
    default:
      return state
  }

  broadcastState(next)
  return next
}
