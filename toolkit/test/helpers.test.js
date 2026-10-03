// The helpers catch what they are meant to catch.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { refuse } from '../src/edit/errors.js'
import { assertEdit, assertLinksFollow, assertOrdered, assertRefused, deepFreeze } from './helpers.js'
import { small } from './fixtures/data.js'

const rejects = (fn) => assert.throws(fn, assert.AssertionError)

test('deepFreeze makes nested objects read-only', () => {
  const d = deepFreeze(small())
  assert.throws(() => d.entries[0].mentions[0].note = 'x', TypeError)
})

test('assertEdit catches a mutating edit, an edit that breaks data, and a change outside touched', () => {
  assert.throws(() => assertEdit((d) => ((d.entries[0].term = 'x'), d), small(), []), TypeError)
  rejects(() => assertEdit((d) => ({ ...d, entries: d.entries.map((e) => ({ ...e, category: 'nope' })) }), small(), []))
  const renote = (d) => ({ ...d, entries: d.entries.map((e) => (e.slug === 'bat' ? { ...e, mentions: [{ ...e.mentions[0], t: 401 }] } : e)) })
  rejects(() => assertEdit(renote, small(), [], { touched: ['acrobat'] }))
  assertEdit(renote, small(), [], { touched: ['bat'] })
})

test('assertEdit allows rewritten link targets only with retargets, and requires untouched entries to be the same objects', () => {
  const retarget = (d) => ({
    ...d,
    entries: d.entries.map((e) => (e.slug === 'oatmeal' ? { ...e, mentions: [{ ...e.mentions[0], note: 'Porridge of [[see:meal (repast)]].' }] } : e)),
  })
  rejects(() => assertEdit(retarget, small(), []))
  assertEdit(retarget, small(), [], { retargets: true })
  rejects(() => assertEdit((d) => ({ ...d, entries: structuredClone(d.entries) }), small(), []))
})

test('assertOrdered catches entries and mentions out of order', () => {
  const d = small()
  d.entries.reverse()
  rejects(() => assertOrdered(d))
  const m = small()
  m.entries.find((e) => e.slug === 'cartouche').mentions.reverse()
  rejects(() => assertOrdered(m))
})

test('assertRefused needs a ToolkitError with the code', () => {
  assertRefused(() => refuse('merge-self', 'm'), small(), 'merge-self')
  rejects(() => assertRefused(() => refuse('merge-self', 'm'), small(), 'unknown-entry'))
  rejects(() => assertRefused(() => { throw new Error('other') }, small(), 'merge-self'))
})

test('assertLinksFollow catches a link that resolves elsewhere', () => {
  const after = small()
  after.entries.find((e) => e.slug === 'oatmeal').mentions[0].note = 'Porridge of [[see:meal (repast)]].'
  rejects(() => assertLinksFollow(small(), after))
  assertLinksFollow(small(), small())
})
