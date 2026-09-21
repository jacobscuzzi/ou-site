import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/tokens.css'
import './styles/global.css'

const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
if ((memory !== undefined && memory <= 2) || navigator.hardwareConcurrency <= 2) {
  document.documentElement.dataset.lite = ''
}

async function start() {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

start()
