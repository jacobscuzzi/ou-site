import { useEffect, useRef } from 'react'

let next = 0

// An overlay gets its own history entry, so the phone's back button closes it; closing it any other
// way removes the entry again. The entry is pushed a tick late so a StrictMode double mount leaves none behind.
export function useBackClose(onClose: () => void) {
  const latest = useRef(onClose)
  latest.current = onClose

  useEffect(() => {
    const id = ++next
    let pushed = false
    const timer = setTimeout(() => {
      history.pushState({ overlay: id }, '')
      pushed = true
    })
    const pop = () => {
      if (pushed && history.state?.overlay !== id) latest.current()
    }
    window.addEventListener('popstate', pop)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('popstate', pop)
      if (pushed && history.state?.overlay === id) history.back()
    }
  }, [])
}
