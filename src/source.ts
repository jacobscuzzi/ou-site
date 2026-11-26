const pattern = /^[a-z0-9][a-z0-9-]{0,23}$/

// The link a visitor came in by, e.g. oup.wtf/?ref=ig-fr from an Instagram bio.
export function sourceFrom(search: string): string | undefined {
  const value = new URLSearchParams(search).get('ref')?.trim().toLowerCase()
  return value && pattern.test(value) ? value : undefined
}

// Read once, then dropped from the address bar so a link shared from the app does not carry it on.
export function takeSource(): string | undefined {
  const url = new URL(location.href)
  if (!url.searchParams.has('ref')) return undefined
  const source = sourceFrom(url.search)
  url.searchParams.delete('ref')
  history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`)
  return source
}
