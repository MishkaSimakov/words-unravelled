import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sideEffects } from '../../src/checks/effects.js'
import { deleteEntry, setFields } from '../../src/edit/entries.js'
import { data, entry, mention, small } from '../fixtures/data.js'
import { assertEdit, assertRefused } from '../helpers.js'

const find = (d, slug) => d.entries.find((e) => e.slug === slug)

test('setFields sets the given fields and keeps the key order', () => {
  const { after } = assertEdit(setFields, small(), ['acrobat', { category: 'about-language', original: 'akrobatos', translation: null }], { touched: ['acrobat'] })
  const e = find(after, 'acrobat')
  assert.deepEqual(Object.keys(e), ['slug', 'term', 'original', 'translation', 'language', 'category', 'mentions'])
  assert.deepEqual([e.category, e.original, e.translation, e.language], ['about-language', 'akrobatos', null, 'English'])
})

test('setFields refuses an invalid value', () => {
  assertRefused((d) => setFields(d, 'acrobat', { category: 'noun' }), small(), 'category-unknown')
  assertRefused((d) => setFields(d, 'acrobat', { language: '' }), small(), 'entry-field')
})

test('setFields refuses an original form that makes a link elsewhere ambiguous', () => {
  // inch links [[from:uncia]], which ounce has as its original form.
  assertRefused((d) => setFields(d, 'acrobat', { original: 'uncia' }), small(), 'link-ambiguous')
})

test('deleteEntry deletes the entry; links to it show as plain text', () => {
  const { after } = assertEdit(deleteEntry, small(), ['ounce'], { touched: ['ounce'] })
  assert.equal(find(after, 'ounce'), undefined)
  assert.equal(find(after, 'inch').mentions[0].note, 'From Latin [[from:uncia]], a twelfth, like [[see:ounce]]s.')
})

test('deleteEntry refuses when a link would then need a gloss', () => {
  const d = data([
    entry('meal', {}, mention('ep-a', 1, '')),
    entry('meal', { gloss: 'repast' }, mention('ep-a', 2, '')),
    entry('oatmeal', {}, mention('ep-a', 3, 'Porridge of [[see:meal]].')),
  ])
  assertRefused((d) => deleteEntry(d, 'meal'), d, 'link-needs-gloss')
})

test('setFields reports the fields it set and the links that no longer resolve', () => {
  // As setFields(arctos, { original: null }) orphans arktos in arctic.
  const effects = sideEffects(small(), setFields(small(), 'ounce', { original: null }))
  assert.deepEqual(effects.entries.changed, [{ slug: 'ounce', name: 'ounce', fields: { original: ['uncia', null] } }])
  assert.deepEqual(effects.links, [{ slug: 'inch', episode_id: 'ep-b', target: 'uncia', before: 'ounce', after: null, follows: false }])
})

test('deleteEntry reports the entry, its mentions and the links it orphans', () => {
  const effects = sideEffects(small(), deleteEntry(small(), 'ounce'))
  assert.deepEqual(effects.entries.removed, [{ slug: 'ounce', name: 'ounce' }])
  assert.deepEqual(effects.mentions.removed.map((m) => [m.slug, m.episode_id]), [['ounce', 'ep-b']])
  assert.deepEqual(effects.links.map((l) => [l.target, l.before, l.after]), [['uncia', 'ounce', null], ['ounce', 'ounce', null]])
})
