import { test } from 'node:test'
import assert from 'node:assert/strict'
import { backlinks, buildIndex, entry, episode, episodeCounts, episodeMentions, homographs, noteParts } from '../../src/query/index.js'
import { data, entry as makeEntry, mention, small } from '../fixtures/data.js'

const slugs = (entries) => entries.map((e) => e.slug)

test('buildIndex does not change the data', () => {
  const data = small()
  const copy = structuredClone(data)
  buildIndex(data)
  assert.deepEqual(data, copy)
})

test('entry and episode look up by slug and id, or give null', () => {
  const index = buildIndex(small())
  assert.equal(entry(index, 'meal-flour').gloss, 'flour')
  assert.equal(entry(index, 'meal'), null)
  assert.equal(episode(index, 'ep-b').title, 'Episode B')
  assert.equal(episode(index, 'ep-x'), null)
})

test("episodeMentions lists an episode's mentions in time order", () => {
  const index = buildIndex(small())
  assert.deepEqual(
    episodeMentions(index, 'ep-a').map(({ entry, mention }) => `${entry.slug}@${mention.t}`),
    ['cartouche@100', 'cartuccia@110', 'cartridge@120', 'meal-flour@200', 'meal-repast@210', 'oatmeal@220'],
  )
  assert.deepEqual(episodeMentions(index, 'ep-x'), [])
})

test('noteParts gives each link the slug it resolves to', () => {
  const data = small()
  const index = buildIndex(data)
  const inch = data.entries.find((e) => e.slug === 'inch')
  assert.deepEqual(noteParts(index, inch.mentions[0]), [
    'From Latin ',
    { type: 'from', uncertain: false, target: 'uncia', text: 'uncia', slug: 'ounce' },
    ', a twelfth, like ',
    { type: 'see', uncertain: false, target: 'ounce', text: 'ounces', slug: 'ounce' },
    '.',
  ])
  const leg = data.entries.find((e) => e.slug === 'break-a-leg')
  assert.equal(noteParts(index, leg.mentions[0])[1].slug, null)
})

test('backlinks lists each linking entry once, in data order', () => {
  const index = buildIndex(small())
  assert.deepEqual(slugs(backlinks(index, 'ounce')), ['inch'])
  assert.deepEqual(slugs(backlinks(index, 'cartridge')), ['cartouche', 'cartuccia'])
  assert.deepEqual(slugs(backlinks(index, 'meal-flour')), ['meal-repast', 'oatmeal'])
  assert.deepEqual(backlinks(index, 'acrobat'), [])
})

test('homographs lists every entry spelt the same, glossed or not', () => {
  const index = buildIndex(small())
  assert.deepEqual(slugs(homographs(index, 'Meal')), ['meal-flour', 'meal-repast'])
  assert.deepEqual(slugs(homographs(index, 'gift')), ['gift', 'gift-german'])
  assert.deepEqual(homographs(index, 'unicorn'), [])
})

test('episodeCounts counts episodes, not mentions, and leaves pointers out of discussed', () => {
  const d = data([
    makeEntry('cartouche', {}, mention('ep-a', 1, ''), mention('ep-b', 2, '', 'aside'), mention('ep-c', 3, '', 'mention')),
    makeEntry('bat', {}, mention('ep-c', 3, '', 'mention')),
  ])
  const index = buildIndex(d)
  assert.deepEqual(episodeCounts(index, d.entries[1]), { discussed: 2, all: 3 })
  assert.deepEqual(episodeCounts(index, d.entries[0]), { discussed: 0, all: 1 })
})
