import { test } from 'node:test'
import assert from 'node:assert/strict'
import { linkProblems } from '../../src/checks/links.js'
import { data, entry, mention } from '../fixtures/data.js'

const found = (entries) => linkProblems(data(entries).entries).map((p) => [p.code, p.detail])

test('a link that names its own entry is close, since it resolves to nothing', () => {
  assert.deepEqual(found([entry('burgundy', {}, mention('ep-a', 1, 'From the [[from:Burgundy]] region.'))]), [
    ['link-unresolved-close', 'Burgundy'],
  ])
})

test('a link with a gloss no entry has is close to the entries with that term', () => {
  const entries = [
    entry('meal', { gloss: 'flour' }, mention('ep-a', 1, '')),
    entry('oats', {}, mention('ep-a', 2, 'Ground to [[see:meal (grain)]].')),
  ]
  assert.deepEqual(found(entries), [['link-unresolved-close', 'meal (grain)']])
})

test('a link to a glossed homograph by its own term needs no gloss when it is itself', () => {
  // Gift (German) links to "gift": the English gift has no gloss and resolves.
  const entries = [
    entry('gift', {}, mention('ep-a', 1, '')),
    entry('Gift', { gloss: 'German' }, mention('ep-a', 2, 'Unlike [[see:gift]].')),
  ]
  assert.deepEqual(found(entries), [])
})

test('an unglossed link from one glossed homograph to the other needs a gloss', () => {
  const entries = [
    entry('meal', { gloss: 'flour' }, mention('ep-a', 1, 'Unlike [[see:meal]].')),
    entry('meal', { gloss: 'repast' }, mention('ep-a', 2, '')),
  ]
  assert.deepEqual(found(entries), [['link-needs-gloss', 'meal']])
})

test('an original form shared by the linking entry itself is not ambiguous', () => {
  const entries = [
    entry('ounce', { original: 'uncia' }, mention('ep-a', 1, 'From [[from:uncia]].')),
    entry('inch', { original: 'uncia' }, mention('ep-a', 2, '')),
  ]
  assert.deepEqual(found(entries), [])
})

test('a link close only to its own entry is no problem', () => {
  assert.deepEqual(found([entry('altar', {}, mention('ep-a', 1, 'From [[from:altare]].'))]), [])
})

test('a link to nothing close is no problem', () => {
  assert.deepEqual(found([entry('pound', {}, mention('ep-a', 1, 'From [[from:pondus]].'))]), [])
})
