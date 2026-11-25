export type Tier = 1 | 2 | 3

export type TierItem = { id: string; quality: number; name: string; x: number; y: number }

export type TierOptions = {
  previous: readonly string[]
  max1: number
  max2: number
  gap1: number
  gap2: number
  // at least tier 2 (party tonight, liked, deal on); may go past max2
  boost?: ReadonlySet<string> | null
  // always tier 3 (disliked)
  sink?: ReadonlySet<string> | null
  // only these may become a photo bubble (the clear part of the map, outside bars and sheets)
  clear?: ReadonlySet<string> | null
}

export type TierResult = { tier: Tier; fade: number }

function better(a: TierItem, b: TierItem) {
  return b.quality - a.quality || a.name.localeCompare(b.name)
}

function spread(items: TierItem[], n: number, gap: number, seed: TierItem[] = []) {
  const chosen = [...seed]
  for (const item of items) {
    if (chosen.length >= n) break
    if (chosen.every((c) => Math.hypot(item.x - c.x, item.y - c.y) >= gap)) chosen.push(item)
  }
  return chosen
}

// Tiers per viewport from rank: the best spread-out few get a photo bubble, the next ones a circle,
// the rest a dot that pales with rank. Earlier bubbles are kept where possible so panning does not reshuffle.
export function assignTiers(items: TierItem[], o: TierOptions): Map<string, TierResult> {
  const sorted = [...items].sort(better)
  const open = sorted.filter((i) => !o.sink?.has(i.id))
  const bubbly = o.clear ? open.filter((i) => o.clear!.has(i.id)) : open
  const had = new Set(o.previous)
  const kept = spread(bubbly.filter((i) => had.has(i.id)), o.max1, o.gap1)
  const one = spread(bubbly.filter((i) => !had.has(i.id)), o.max1, o.gap1, kept)
  const ones = new Set(one.map((i) => i.id))
  const rest = open.filter((i) => !ones.has(i.id))
  const boosted = rest.filter((i) => o.boost?.has(i.id))
  const room = Math.max(0, o.max2 - boosted.length)
  const two = new Set([...boosted, ...spread(rest.filter((i) => !o.boost?.has(i.id)), room, o.gap2)].map((i) => i.id))
  const out = new Map<string, TierResult>()
  const dots = sorted.filter((i) => !ones.has(i.id) && !two.has(i.id))
  for (const i of one) out.set(i.id, { tier: 1, fade: 0 })
  for (const id of two) out.set(id, { tier: 2, fade: 0 })
  dots.forEach((i, n) => out.set(i.id, { tier: 3, fade: dots.length > 1 ? n / (dots.length - 1) : 0 }))
  return out
}
