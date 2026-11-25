export function still() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches || 'lite' in document.documentElement.dataset
}
