import { test } from 'node:test'
import assert from 'node:assert/strict'
import { withChip, type ChipKey } from './geo.ts'

const set = (...k: ChipKey[]) => new Set<ChipKey>(k)

test('a chip of the same family replaces the other one', () => {
  assert.deepEqual([...withChip(set('street', 'open'), 'italian')].sort(), ['italian', 'open'])
  assert.deepEqual([...withChip(set('techno'), 'hiphop')], ['hiphop'])
  assert.deepEqual([...withChip(set('clubs', 'cheap'), 'dancebars')].sort(), ['cheap', 'dancebars'])
})

test('open now and terrace combine with anything', () => {
  assert.deepEqual([...withChip(set('italian'), 'terrace')].sort(), ['italian', 'terrace'])
  assert.deepEqual([...withChip(set('italian', 'terrace'), 'open')].sort(), ['italian', 'open', 'terrace'])
})

test('tapping an active chip removes it', () => {
  assert.deepEqual([...withChip(set('italian', 'open'), 'italian')], ['open'])
})

test('price chips read the dish and espresso prices', async () => {
  const { layerChips } = await import('./geo.ts')
  assert.deepEqual(layerChips.eat.slice(0, 5), ['open', 'halal', 'terrace', 'meal', 'fastfood'])
  assert.ok(layerChips.coffee.includes('espresso'))
})
