type Open = { photos: string[]; index: number; title: string }
let listener: ((o: Open) => void) | null = null

export function openPhotos(photos: string[], index: number, title: string) {
  if (photos.length > 0) listener?.({ photos, index, title })
}

export function onOpenPhotos(fn: (o: Open) => void) {
  listener = fn
  return () => {
    if (listener === fn) listener = null
  }
}

// Cards take the 400 px copy when the server has one; the viewer alone loads the 800 px original.
export function thumbOf(photos: string[], thumbs: string[] | undefined, i: number): string | undefined {
  return thumbs?.[i] || photos[i]
}
