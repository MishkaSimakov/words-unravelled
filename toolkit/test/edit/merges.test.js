import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sideEffects } from '../../src/checks/effects.js'
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

test('mergeEntries keeps the chosen mention where both entries have one', () => {
  // bat and bath are both in ep-c only.
  const kept = (side) => {
    const { after } = assertEdit(mergeEntries, small(), ['bath', 'bat', { keep: { 'ep-c': side } }], { touched: ['bath', 'bat'], retargets: true })
    assert.equal(find(after, 'bath'), undefined)
    return find(after, 'bat').mentions
  }
  assert.deepEqual(kept('from').map((m) => m.t), [410])
  assert.deepEqual(kept('into').map((m) => m.t), [400])
})

test('mergeEntries takes a choice per clashing episode', () => {
  const d = data([
    entry('colour', {}, mention('ep-a', 1, 'British.'), mention('ep-b', 2, 'Again.'), mention('ep-c', 3, 'Only here.')),
    entry('color', {}, mention('ep-a', 5, 'American.'), mention('ep-b', 6, 'Once more.')),
  ])
  const { after } = assertEdit(mergeEntries, d, ['colour', 'color', { keep: { 'ep-a': 'from', 'ep-b': 'into' } }], { touched: ['colour', 'color'], retargets: true })
  assert.deepEqual(find(after, 'color').mentions.map((m) => m.note), ['British.', 'Once more.', 'Only here.'])
  assertRefused((x) => mergeEntries(x, 'colour', 'color', { keep: { 'ep-a': 'from' } }), d, 'mention-twice')
})

test('mergeEntries keeps the links to an entry whose only mention is dropped', () => {
  // As $64,000 question into The $64,000 Question: deleting the clashing mention instead
  // would delete the entry and leave the link to it leading nowhere.
  const d = () =>
    data([
      entry('$64,000 question', { category: 'expression' }, mention('ep-a', 10, 'Inflated from the $64 question.')),
      entry('The $64,000 Question', { category: 'name' }, mention('ep-a', 12, 'The quiz show.'), mention('ep-b', 5, 'Again.')),
      entry('million-dollar question', { category: 'expression' }, mention('ep-a', 20, 'A further inflation of the [[from:$64,000 question]].')),
    ])
  const before = d()
  const { after } = assertEdit(mergeEntries, d(), ['64-000-question', 'the-64-000-question', { keep: { 'ep-a': 'into' } }], {
    touched: ['64-000-question', 'the-64-000-question'],
    retargets: true,
  })
  assertLinksFollow(before, after, { '64-000-question': 'the-64-000-question' })
  assert.equal(find(after, 'million-dollar-question').mentions[0].note, 'A further inflation of the [[from:The $64,000 Question]].')
  assert.deepEqual(find(after, 'the-64-000-question').mentions.map((m) => m.note), ['The quiz show.', 'Again.'])
})

test('mergeEntries reports its side effects', () => {
  const before = bard()
  const effects = sideEffects(before, mergeEntries(bard(), 'william-shakespeare', 'shakespeare'))
  assert.deepEqual(effects.entries.removed, [{ slug: 'william-shakespeare', name: 'William Shakespeare', into: 'shakespeare' }])
  assert.deepEqual(effects.mentions.moved, [{ from: { slug: 'william-shakespeare', episode_id: 'ep-a' }, to: { slug: 'shakespeare', episode_id: 'ep-a' } }])
  assert.deepEqual(effects.notes.map((n) => n.slug).sort(), ['bedroom', 'swagger'])
  const links = Object.fromEntries(effects.links.map((l) => [`${l.slug} ${l.target}`, [l.before, l.after, l.follows]]))
  assert.deepEqual(links, {
    'bedroom Shakespeare': ['william-shakespeare', 'shakespeare', true],
    'swagger Shakespeare': ['william-shakespeare', 'shakespeare', true],
    // The merged entry's own link to the other now names itself, so it leads nowhere.
    'shakespeare Shakespeare': ['shakespeare', null, false],
  })
})
