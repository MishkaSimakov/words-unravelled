import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mergeEntries } from '../../src/edit/merges.js'
import { data, entry, mention, small } from '../fixtures/data.js'
import { assertEdit, assertLinksFollow, assertRefused } from '../helpers.js'

const find = (d, slug) => d.entries.find((e) => e.slug === slug)

const bard = () =>
  data([
    entry('William Shakespeare', { category: 'name', original: 'Shakspere' },
      mention('ep-a', 10, 'Known as [[see:Shakespeare]]; coined [[see:bedroom]].')),
    entry('Shakespeare', { category: 'name' }, mention('ep-b', 20, 'The bard.')),
    entry('bedroom', {}, mention('ep-a', 30, 'First used by [[see:William Shakespeare]].')),
    entry('swagger', {}, mention('ep-c', 40, 'Coined by [[see:Shakspere]], who also wrote [[see:bedroom]]s.')),
  ])

test('mergeEntries moves the mentions, deletes the entry, and points its links at the other', () => {
  const before = bard()
  const { after } = assertEdit(mergeEntries, bard(), ['william-shakespeare', 'shakespeare'], {
    touched: ['william-shakespeare', 'shakespeare'],
    retargets: true,
  })
  assertLinksFollow(before, after, { 'william-shakespeare': 'shakespeare' })
  assert.equal(find(after, 'william-shakespeare'), undefined)
  const merged = find(after, 'shakespeare')
  assert.deepEqual(merged.mentions.map((m) => m.episode_id), ['ep-a', 'ep-b'])
  assert.equal(merged.original, null) // the entry merged into keeps its own fields
  // By name and by original form; the link the merged entry had to the other now names itself.
  assert.equal(find(after, 'bedroom').mentions[0].note, 'First used by [[see:Shakespeare]].')
  assert.equal(find(after, 'swagger').mentions[0].note, 'Coined by [[see:Shakespeare]], who also wrote [[see:bedroom]]s.')
  assert.equal(merged.mentions[0].note, 'Known as [[see:Shakespeare]]; coined [[see:bedroom]].')
})

test('mergeEntries names a glossed entry with its gloss', () => {
  const d = data([
    entry('meal', { gloss: 'flour' }, mention('ep-a', 1, '')),
    entry('meel', {}, mention('ep-b', 2, '')),
    entry('oats', {}, mention('ep-c', 3, 'Ground to [[see:meel]].')),
  ])
  const { after } = assertEdit(mergeEntries, d, ['meel', 'meal-flour'], { touched: ['meel', 'meal-flour'], retargets: true })
  assert.equal(find(after, 'oats').mentions[0].note, 'Ground to [[see:meal (flour)]].')
})

test('mergeEntries refuses when both entries have a mention in one episode', () => {
  assertRefused((d) => mergeEntries(d, 'bath', 'bat'), small(), 'mention-twice')
})
