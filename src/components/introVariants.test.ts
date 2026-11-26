import { test } from 'node:test'
import assert from 'node:assert/strict'

const store = new Map<string, string>()
const g = globalThis as Record<string, unknown>
g.localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) }
g.location = { hostname: 'oup.wtf', search: '' }

const { pickIntro } = await import('./introVariants.ts')

test('every visitor gets one french intro at random and keeps it', () => {
  store.clear()
  assert.equal(pickIntro(() => 0.2), 'fr1')
  assert.equal(pickIntro(() => 0.9), 'fr1')
  store.clear()
  assert.equal(pickIntro(() => 0.7), 'fr2')
  assert.equal(pickIntro(() => 0.1), 'fr2')
})

test('the split is about even', () => {
  let fr2 = 0
  for (let i = 0; i < 10000; i++) {
    store.clear()
    if (pickIntro() === 'fr2') fr2++
  }
  assert.ok(fr2 > 4700 && fr2 < 5300, String(fr2))
})

test('the intro flag works on localhost only', () => {
  store.clear()
  g.location = { hostname: 'oup.wtf', search: '?intro=en' }
  assert.notEqual(pickIntro(), 'en')
  g.location = { hostname: 'localhost', search: '?intro=fr2' }
  assert.equal(pickIntro(), 'fr2')
  g.location = { hostname: 'localhost', search: '?intro=en' }
  assert.equal(pickIntro(), 'en')
  g.location = { hostname: 'oup.wtf', search: '' }
})
