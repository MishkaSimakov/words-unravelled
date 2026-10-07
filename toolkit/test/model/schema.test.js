import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ENTRY_KEYS, MENTION_KEYS, entryName, ordered } from '../../src/model/schema.js'

test('ordered puts keys in file order, fills nulls, and leaves out an empty gloss', () => {
  const e = ordered(ENTRY_KEYS, { mentions: [], category: 'word', term: 'gift', slug: 'gift' })
  assert.deepEqual(Object.keys(e), ['slug', 'term', 'original', 'translation', 'language', 'category', 'mentions'])
  assert.equal(e.original, null)
  assert.deepEqual(Object.keys(ordered(ENTRY_KEYS, { gloss: 'German' })), ENTRY_KEYS)
  assert.deepEqual(Object.keys(ordered(MENTION_KEYS, { note: '', t: 1 })), MENTION_KEYS)
})

test('ordered drops keys that are not in the list', () => {
  assert.deepEqual(ordered(['a'], { a: 1, b: 2 }), { a: 1 })
})

test('entryName adds the gloss in brackets', () => {
  assert.equal(entryName({ term: 'meal', gloss: 'flour' }), 'meal (flour)')
  assert.equal(entryName({ term: 'gift' }), 'gift')
})
