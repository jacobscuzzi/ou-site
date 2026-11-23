import { useEffect, useRef } from 'react'
import type { SheetHeight } from './components/Sheet'

const desktop = '(min-width: 768px)'

export function useSheetHistory(height: SheetHeight, collapse: () => void) {
  const pushed = useRef(false)
  const latest = useRef(collapse)
  latest.current = collapse

  useEffect(() => {
    if (height !== 'peek' && !pushed.current && !window.matchMedia(desktop).matches) {
      history.pushState({ sheet: height }, '')
      pushed.current = true
    } else if (height === 'peek' && pushed.current) {
      pushed.current = false
      history.back()
    }
  }, [height])

  useEffect(() => {
    const pop = () => {
      if (!pushed.current) return
      pushed.current = false
      latest.current()
    }
    window.addEventListener('popstate', pop)
    return () => window.removeEventListener('popstate', pop)
  }, [])
}
