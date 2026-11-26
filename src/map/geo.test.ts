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

test('the start view is centred on the user and holds the best places nearby', async () => {
  const { aroundMe } = await import('./geo.ts')
  const me: [number, number] = [2.35, 48.86]
  const bar = (id: string, lng: number, lat: number, quality: number) => ({ id, lng, lat, quality, name: id }) as never
  const bars = [bar('a', 2.352, 48.861, 5), bar('b', 2.345, 48.857, 4), bar('c', 2.355, 48.864, 3), bar('d', 2.348, 48.862, 2), bar('far', 2.29, 48.88, 9)]
  const b = aroundMe(me, bars, 4)!
  assert.ok(Math.abs((b.minLng + b.maxLng) / 2 - me[0]) < 1e-9 && Math.abs((b.minLat + b.maxLat) / 2 - me[1]) < 1e-9)
  assert.ok(b.maxLng >= 2.355 && b.maxLat >= 48.864 && b.maxLng < 2.29 + 0.1 && b.minLng > 2.3)
  assert.equal(aroundMe([2.6, 48.7], bars), null)
  const thin = aroundMe(me, [bar('far', 2.33, 48.87, 9)], 4)!
  assert.ok(thin.minLng <= 2.33)
})
