import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sideEffects } from '../../src/checks/effects.js'
import { problem } from '../../src/checks/codes.js'
import { problems } from '../../src/checks/problems.js'
import { editMention } from '../../src/edit/mentions.js'
import { mergeEntries } from '../../src/edit/merges.js'
import { small } from '../fixtures/data.js'

const NOTHING = {
  entries: { added: [], removed: [], changed: [] },
  mentions: { added: [], removed: [], moved: [], changed: [] },
  notes: [],
  links: [],
  introduced: [],
}

test('the same data, or an equal copy, has no side effects', () => {
  const d = small()
  assert.deepEqual(sideEffects(d, d), NOTHING)
  assert.deepEqual(sideEffects(d, structuredClone(d)), NOTHING)
})

test('introduced lists the new warnings, and known spares finding the old ones', () => {
  const after = editMention(small(), 'gift', 'ep-b', { note: 'Another present.' })
  assert.deepEqual(sideEffects(small(), after).introduced.map((p) => p.code), ['note-context'])
  assert.deepEqual(sideEffects(small(), after, { known: problems(small()) }).introduced.map((p) => p.code), ['note-context'])
  const known = [problem('note-context', 'm', ['gift'], { mention: { slug: 'gift', episode_id: 'ep-b' } })]
  assert.deepEqual(sideEffects(small(), after, { known }).introduced, [])
})

test('in a note whose text changed, links pair up by type and target', () => {
  const after = editMention(small(), 'inch', 'ep-b', { note: 'Like [[see:ounce]]s, from [[from:uncia]] and [[from:pondus]].' })
  // Only the new link to pondus is unpaired; the others still resolve as they did.
  assert.deepEqual(sideEffects(small(), after).links, [])
  // Links whose target was edited by hand are new links, not old ones resolving elsewhere.
  const replaced = editMention(small(), 'inch', 'ep-b', { note: 'Like [[from:cartouche]] and [[see:gift]].' })
  assert.deepEqual(sideEffects(small(), replaced).links, [])
  // Merged in the same edit list, both links to ounce are rewritten: then they pair by type.
  const merged = sideEffects(small(), mergeEntries(after, 'ounce', 'acrobat'))
  assert.equal(merged.mentions.changed[0].fields.note[1], 'Like [[see:acrobat]]s, from [[from:acrobat]] and [[from:pondus]].')
  assert.deepEqual(merged.links.map((l) => [l.target, l.before, l.after, l.follows]), [['acrobat', 'ounce', 'acrobat', true], ['acrobat', 'ounce', 'acrobat', true]])
})

test('a mention kept from the merged entry replaces the other, which is reported removed', () => {
  const effects = sideEffects(small(), mergeEntries(small(), 'bath', 'bat', { keep: { 'ep-c': 'from' } }))
  assert.deepEqual(effects.mentions.moved, [{ from: { slug: 'bath', episode_id: 'ep-c' }, to: { slug: 'bat', episode_id: 'ep-c' } }])
  assert.deepEqual(effects.mentions.removed.map((x) => [x.slug, x.mention.t]), [['bat', 400]])
  assert.deepEqual(effects.mentions.changed, [])
  assert.deepEqual(effects.entries.removed, [{ slug: 'bath', name: 'bath', into: 'bat' }])
})

test('a merge that keeps none of the merged mentions reports the entry removed, and its links sent on', () => {
  const effects = sideEffects(small(), mergeEntries(small(), 'bath', 'bat', { keep: { 'ep-c': 'into' } }))
  assert.deepEqual(effects.entries.removed, [{ slug: 'bath', name: 'bath' }])
  assert.deepEqual(effects.mentions.removed.map((x) => [x.slug, x.mention.t]), [['bath', 410]])
  assert.deepEqual(effects.mentions.moved, [])
})
