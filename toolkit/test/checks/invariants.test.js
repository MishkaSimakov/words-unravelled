import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dataChanges, linkResolutions, sameButTargets } from '../../src/checks/invariants.js'
import { small } from '../fixtures/data.js'

const find = (d, slug) => d.entries.find((e) => e.slug === slug)

test('linkResolutions lists every link with the entry it resolves to', () => {
  const links = linkResolutions(small())
  assert.equal(links.get('inch|ep-b|0'), 'ounce') // by original form
  assert.equal(links.get('inch|ep-b|1'), 'ounce')
  assert.equal(links.get('break-a-leg|ep-c|0'), null)
  assert.equal(links.get('cartuccia|ep-a|1'), 'cartouche')
  assert.equal(links.size, 13)
})

test('sameButTargets ignores link targets only', () => {
  assert.ok(sameButTargets('A [[see:meal]]s.', 'A [[see:meal (flour)]]s.'))
  assert.ok(!sameButTargets('A [[see:meal]]s.', 'A [[from:meal]]s.'))
  assert.ok(!sameButTargets('A [[see:meal]]s.', 'An [[see:meal]]s.'))
})

test('dataChanges sorts changes into entries and mentions', () => {
  const before = small()
  const after = structuredClone(before)
  after.entries = after.entries.filter((e) => e.slug !== 'bath')
  after.entries.push({ ...structuredClone(find(before, 'bat')), slug: 'bats' })
  find(after, 'gift').mentions[0].note = 'A present; [[unrelated:Gift (poison)]] means poison.'
  find(after, 'inch').mentions[0].t = 31
  find(after, 'cartouche').mentions.pop()
  find(after, 'ounce').language = 'English'
  assert.deepEqual(dataChanges(before, after), {
    entries: { added: ['bats'], removed: ['bath'], changed: ['cartouche', 'gift', 'inch', 'ounce'] },
    mentions: {
      added: [{ slug: 'bats', episode_id: 'ep-c' }],
      removed: [{ slug: 'bath', episode_id: 'ep-c' }, { slug: 'cartouche', episode_id: 'ep-c' }],
      changed: [{ slug: 'inch', episode_id: 'ep-b' }],
      retargeted: [{ slug: 'gift', episode_id: 'ep-b' }],
    },
  })
})

test('dataChanges of equal data is empty', () => {
  const empty = { entries: { added: [], removed: [], changed: [] }, mentions: { added: [], removed: [], changed: [], retargeted: [] } }
  assert.deepEqual(dataChanges(small(), small()), empty)
})
