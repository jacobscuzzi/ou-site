import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assignTiers, type TierItem } from './tiers.ts'

const grid = (n: number): TierItem[] =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `p${i}`, quality: 1 - i / n, x: (i % 10) * 40, y: Math.floor(i / 10) * 40 }))

const opts = { previous: [], max1: 6, max2: 15, gap1: 64, gap2: 20 }
const count = (m: Map<string, { tier: number }>, t: number) => [...m.values()].filter((r) => r.tier === t).length

test('caps hold for a crowded viewport', () => {
  const m = assignTiers(grid(300), opts)
  assert.ok(count(m, 1) <= 6)
  assert.ok(count(m, 2) <= 15)
  assert.equal(m.size, 300)
})

test('best ranked becomes tier 1', () => {
  const m = assignTiers(grid(50), opts)
  assert.equal(m.get('p0')?.tier, 1)
})

test('tier 3 fades with rank', () => {
  const m = assignTiers(grid(100), opts)
  const dots = [...m.entries()].filter(([, r]) => r.tier === 3)
  assert.equal(dots[0][1].fade, 0)
  assert.equal(dots[dots.length - 1][1].fade, 1)
})

test('boosted places are at least tier 2, sunk ones always tier 3', () => {
  const items = grid(100)
  const m = assignTiers(items, { ...opts, boost: new Set(['p99', 'p98']), sink: new Set(['p0']) })
  assert.ok((m.get('p99')?.tier ?? 3) <= 2)
  assert.ok((m.get('p98')?.tier ?? 3) <= 2)
  assert.equal(m.get('p0')?.tier, 3)
})

test('previous bubbles are kept when still spread', () => {
  const items = grid(60)
  const m = assignTiers(items, { ...opts, previous: ['p55'] })
  assert.equal(m.get('p55')?.tier, 1)
})

test('zooming in (fewer items in view) promotes', () => {
  const wide = assignTiers(grid(200), opts)
  const narrow = assignTiers(grid(200).slice(150), opts)
  assert.equal(wide.get('p150')?.tier, 3)
  assert.equal(narrow.get('p150')?.tier, 1)
})

test('only places in the clear area become bubbles', () => {
  const items = grid(40)
  const m = assignTiers(items, { ...opts, clear: new Set(['p30', 'p31']) })
  assert.equal(m.get('p0')?.tier, 2)
  assert.equal(m.get('p30')?.tier, 1)
})
