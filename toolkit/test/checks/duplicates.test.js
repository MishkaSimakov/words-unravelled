import { test } from 'node:test'
import assert from 'node:assert/strict'
import { core, duplicateProblems, pluralKey, singular, spellingLimit, variantKey, withinDistance } from '../../src/checks/duplicates.js'
import { data, entry, mention } from '../fixtures/data.js'

test('core drops one leading article or "to"', () => {
  assert.equal(core('to-break-the-ice'), 'break-the-ice')
  assert.equal(core('the-64-000-question'), '64-000-question')
  assert.equal(core('to'), 'to')
  assert.equal(core('tomato'), 'tomato')
})

test('singular undoes common plural endings, and leaves the rest', () => {
  assert.deepEqual(['ladies', 'boxes', 'churches', 'cats', 'glass', 'cactus', 'axis', 'bus'].map(singular), [
    'lady', 'box', 'church', 'cat', 'glass', 'cactus', 'axis', 'bus',
  ])
})

test('the keys ignore hyphens, a leading article and, for plurals, the last word\'s ending', () => {
  assert.equal(variantKey('the-beast-with-two-backs'), variantKey('beast-with-two-backs'))
  assert.equal(pluralKey('box-of-frogs'), 'boxoffrog')
})

test('withinDistance bounds the edit distance', () => {
  assert.ok(withinDistance('colour', 'color', 1))
  assert.ok(!withinDistance('colour', 'collar', 1))
  assert.ok(withinDistance('kitten', 'sitting', 3))
  assert.ok(!withinDistance('kitten', 'sitting', 2))
  assert.equal(spellingLimit('abcd', 'abcde'), null)
  assert.equal(spellingLimit('abcde', 'abcdef'), 1)
  assert.equal(spellingLimit('abcdefghi', 'abcdefghij'), 2)
})

test('homographs told apart by a gloss are not duplicates', () => {
  const d = data([entry('meal', { gloss: 'flour' }, mention('ep-a', 1, '')), entry('meal', { gloss: 'repast' }, mention('ep-a', 2, ''))])
  assert.deepEqual(duplicateProblems(d.entries), [])
})

test('a pair is reported once, with the first reason found', () => {
  const d = data([entry('batter', {}, mention('ep-a', 1, '')), entry('batters', {}, mention('ep-a', 2, ''))])
  assert.deepEqual(duplicateProblems(d.entries).map((p) => p.code), ['duplicate-plural'])
})
