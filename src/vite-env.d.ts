/// <reference types="vite/client" />

import type { ResellerDesktopApi } from '../shared/desktop-api'

declare global {
  interface Window {
    reseller: ResellerDesktopApi
  }
}

export {}
