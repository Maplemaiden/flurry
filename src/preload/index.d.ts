import type { FluffyApi } from './index'

declare global {
  interface Window {
    fluffy: FluffyApi
  }
}

export {}
