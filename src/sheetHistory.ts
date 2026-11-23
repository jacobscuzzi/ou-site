import { useEffect, useRef } from 'react'
import type { SheetHeight } from './components/Sheet'

const desktop = '(min-width: 768px)'

export function useSheetHistory(height: SheetHeight, shown: boolean, collapse: () => void) {
  const pushed = useRef(false)
  const latest = useRef(collapse)
  latest.current = collapse

  useEffect(() => {
    const open = shown && height !== 'peek' && !window.matchMedia(desktop).matches
    if (open && !pushed.current) {
      history.pushState({ sheet: height }, '')
      pushed.current = true
    } else if (!open && pushed.current) {
      pushed.current = false
      history.back()
    }
  }, [height, shown])

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
