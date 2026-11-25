import { useEffect, useState } from 'react'
import { still } from './motion'

const TYPE_MS = 38
const HOLD_MS = 2200
const ERASE_MS = 14
const STILL_MS = 4000

// Cycles through the suggestions as a typed placeholder; also returns the suggestion being shown.
export function useTypedPlaceholder(list: string[], active: boolean): { text: string; full: string | null } {
  const [shown, setShown] = useState({ i: 0, n: 0 })
  const key = list.join('|')

  useEffect(() => {
    if (!active || list.length === 0) return
    let i = 0
    let n = 0
    let typing = true
    let timer = 0
    if (still()) {
      setShown({ i, n: list[i].length })
      timer = window.setInterval(() => {
        i = (i + 1) % list.length
        setShown({ i, n: list[i].length })
      }, STILL_MS)
      return () => window.clearInterval(timer)
    }
    const tick = () => {
      let wait = TYPE_MS
      if (typing && n < list[i].length) n += 1
      else if (typing) {
        typing = false
        wait = HOLD_MS
      } else if (n > 0) {
        n -= 1
        wait = ERASE_MS
      } else {
        typing = true
        i = (i + 1) % list.length
      }
      setShown({ i, n })
      timer = window.setTimeout(tick, wait)
    }
    setShown({ i, n })
    timer = window.setTimeout(tick, TYPE_MS)
    return () => window.clearTimeout(timer)
  }, [active, key])

  const full = list[shown.i % Math.max(1, list.length)] ?? null
  return { text: full && active ? full.slice(0, shown.n) : '', full: full && active && shown.n > 0 ? full : null }
}
