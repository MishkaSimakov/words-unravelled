import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildIndex } from '../../src/query/index.js'
import { plainMentions } from '../../src/query/plain.js'
import { data, entry, mention } from '../fixtures/data.js'

const sample = () =>
  data([
    entry('ounce', { original: 'uncia', language: 'Latin' }, mention('ep-a', 1, 'An ounce, from uncia.')),
    entry('inch', {}, mention('ep-a', 2, 'A twelfth, like the [[see:ounce]]s; twelve ounces is a troy pound.')),
    entry('troy', {}, mention('ep-a', 3, 'From Troyes, the fair where the Uncia was weighed.')),
    entry('bounce', {}, mention('ep-a', 4, 'Unrelated to anything here.')),
    entry('pound', {}, mention('ep-b', 5, 'A weight; [[see:ounce]] is a part of it.')),
  ])

const found = (d, slug, options) => plainMentions(buildIndex(d), slug, options).map(({ entry, mention }) => `${entry.slug}@${mention.t}`)

test('plainMentions finds the term with an inflection, and the original form, outside links', () => {
  assert.deepEqual(found(sample(), 'ounce'), ['inch@2', 'troy@3'])
})

test('plainMentions ignores links, the entry itself and words that only contain the term', () => {
  // pound links to ounce without naming it in text; bounce contains "ounce"; ounce names itself.
  assert.ok(!found(sample(), 'ounce').some((s) => /^(pound|bounce|ounce)@/.test(s)))
})

test('plainMentions matches several words as a run', () => {
  const d = data([
    entry('break a leg', {}, mention('ep-a', 1, 'Good luck.')),
    entry('luck', {}, mention('ep-a', 2, 'Actors say "Break a leg!" instead.')),
    entry('leg', {}, mention('ep-a', 3, 'Break the leg, not a leg.')),
  ])
  assert.deepEqual(found(d, 'break-a-leg'), ['luck@2'])
})

test('plainMentions stops at the limit, and knows no unknown slug', () => {
  assert.deepEqual(found(sample(), 'ounce', { limit: 1 }), ['inch@2'])
  assert.deepEqual(found(sample(), 'unicorn'), [])
})
