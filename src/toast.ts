let listener: ((text: string) => void) | null = null

export function toast(text: string) {
  listener?.(text)
}

export function onToast(fn: (text: string) => void) {
  listener = fn
  return () => {
    if (listener === fn) listener = null
  }
}

type Report = { placeId?: string; eventId?: string; title: string; context: Record<string, unknown> }
let reportListener: ((r: Report) => void) | null = null

export function openReport(r: Report) {
  reportListener?.(r)
}

export function onOpenReport(fn: (r: Report) => void) {
  reportListener = fn
  return () => {
    if (reportListener === fn) reportListener = null
  }
}
