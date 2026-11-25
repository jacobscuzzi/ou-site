import type { Layer } from './api/types'
import type { Lang } from './i18n'
import catalog from './tagCatalog.json'

// The tag catalogue is ingest's app/tag_catalog.json, copied by ingest/scripts/sync_tags.py.
// The API gives each place its tag ids, strongest first; here they only get their label.
type TagInfo = { id: string; en: string; fr: string; group: string; layers: string[]; generic?: boolean }

const byId = new Map<string, TagInfo>((catalog.tags as TagInfo[]).map((t) => [t.id, t]))

export function tagLabel(id: string, lang: Lang): string {
  return byId.get(id)?.[lang] ?? id.replace(/_/g, ' ')
}

// The place's tags for a layer, specific ones first and the generic vibes last, as the API orders them.
export function tagsIn(ids: string[] | undefined, layer: Layer, max = 10): string[] {
  const known = (ids ?? []).filter((id) => byId.get(id)?.layers.includes(layer))
  const specific = known.filter((id) => !byId.get(id)?.generic)
  return [...specific, ...known.filter((id) => byId.get(id)?.generic)].slice(0, max)
}

let listener: ((label: string) => void) | null = null

// A tapped tag searches for itself in the part of the map in view.
export function searchTag(id: string, lang: Lang) {
  listener?.(tagLabel(id, lang))
}

export function onTagSearch(fn: (label: string) => void) {
  listener = fn
  return () => {
    if (listener === fn) listener = null
  }
}
