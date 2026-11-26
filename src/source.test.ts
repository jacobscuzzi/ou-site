import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sourceFrom } from './source.ts'

test('a bio link names its account', () => {
  assert.equal(sourceFrom('?ref=ig-fr'), 'ig-fr')
  assert.equal(sourceFrom('?lang=en&ref=TT'), 'tt')
})

test('anything else is no source', () => {
  assert.equal(sourceFrom(''), undefined)
  assert.equal(sourceFrom('?ref='), undefined)
  assert.equal(sourceFrom('?ref=-ig'), undefined)
  assert.equal(sourceFrom('?ref=ig fr'), undefined)
  assert.equal(sourceFrom(`?ref=${'a'.repeat(25)}`), undefined)
})
