interface ImportMetaEnv {
  readonly VITE_USE_MOCK: string
  readonly VITE_API_URL: string
  readonly VITE_EVENTS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
