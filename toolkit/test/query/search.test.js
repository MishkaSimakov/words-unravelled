import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildIndex } from '../../src/query/index.js'
import { search } from '../../src/query/search.js'
import { small } from '../fixtures/data.js'

const find = (query) => search(buildIndex(small()), query).map((e) => e.slug)

test('an exact match comes first, then prefix matches, then the rest', () => {
  const found = find('bat')
  assert.equal(found[0], 'bat') // exact, although only ever mentioned
  assert.deepEqual(found.slice(1, 3), ['batter', 'bath']) // prefix
  assert.ok(found.indexOf('acrobat') > 2)
})

test('within a tier, entries only ever mentioned come last', () => {
  // bath is the closer match, but only ever pointed to.
  assert.ok(find('bat').indexOf('batter') < find('bat').indexOf('bath'))
})

test('search ignores accents and case, and reaches gloss, original and translation', () => {
  assert.equal(find('MÉAL')[0], 'meal-flour')
  assert.ok(find('repast').includes('meal-repast'))
  assert.ok(find('uncia').includes('ounce'))
  assert.ok(find('poison').includes('gift-german'))
})

test('a query that matches nothing finds nothing', () => {
  assert.deepEqual(find('xylophone'), [])
})
