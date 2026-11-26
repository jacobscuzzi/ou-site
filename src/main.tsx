import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { trackVisit } from './visit'
import './styles/tokens.css'
import './styles/global.css'

const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
if ((memory !== undefined && memory <= 2) || navigator.hardwareConcurrency <= 2) {
  document.documentElement.dataset.lite = ''
}

// Best effort: without a service worker the API client answers from the in-page mock.
async function startMock() {
  if (!('serviceWorker' in navigator)) return
  try {
    const { worker } = await import('./mocks/browser')
    await Promise.race([
      worker.start({ onUnhandledRequest: 'bypass', quiet: true }),
      new Promise((resolve) => setTimeout(resolve, 4000)),
    ])
  } catch {
    // registration refused, the in-page mock covers it
  }
}

async function start() {
  if (import.meta.env.VITE_USE_MOCK === 'true') await startMock()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

start()
trackVisit()
