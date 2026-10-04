// Every refusal code, by every edit that can throw it. The last test fails if a refusal code in
// the catalogue has no row here.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { REFUSAL_CODES } from '../../src/checks/codes.js'
import { applyEdits } from '../../src/edit/batch.js'
import { addEpisode } from '../../src/edit/episodes.js'
import { deleteEntry, setFields } from '../../src/edit/entries.js'
import { mergeEntries } from '../../src/edit/merges.js'
import { addMention, deleteMention, editMention, replaceEpisodeMentions } from '../../src/edit/mentions.js'
import { renameEntry, setGloss } from '../../src/edit/names.js'
import { small } from '../fixtures/data.js'
import { assertRefused } from '../helpers.js'

const item = { t: 5, role: 'subject', note: 'A note.', confidence: 'high' }
const newItem = { ...item, entry: { term: 'pound', original: null, translation: null, language: 'English', category: 'word' } }
const episode = { id: 'ep-d', title: 'Episode D', date: '2026-04-01', duration: 3000 }

const ROWS = [
  ['unknown-entry', 'setFields', (d) => setFields(d, 'unicorn', { language: 'Latin' })],
  ['unknown-entry', 'deleteEntry', (d) => deleteEntry(d, 'unicorn')],
  ['unknown-entry', 'setGloss', (d) => setGloss(d, 'unicorn', 'horse')],
  ['unknown-entry', 'renameEntry', (d) => renameEntry(d, 'unicorn', 'horse')],
  ['unknown-entry', 'mergeEntries from', (d) => mergeEntries(d, 'unicorn', 'gift')],
  ['unknown-entry', 'mergeEntries into', (d) => mergeEntries(d, 'gift', 'unicorn')],
  ['unknown-entry', 'addMention', (d) => addMention(d, 'ep-a', { ...item, slug: 'unicorn' })],
  ['unknown-entry', 'addMention without a slug', (d) => addMention(d, 'ep-a', item)],
  ['unknown-entry', 'replaceEpisodeMentions', (d) => replaceEpisodeMentions(d, 'ep-a', [{ ...item, slug: 'unicorn' }])],
  ['unknown-entry', 'editMention', (d) => editMention(d, 'unicorn', 'ep-a', { t: 1 })],
  ['unknown-entry', 'deleteMention', (d) => deleteMention(d, 'unicorn', 'ep-a')],
  ['unknown-episode', 'addMention', (d) => addMention(d, 'ep-x', { ...item, slug: 'gift' })],
  ['unknown-episode', 'replaceEpisodeMentions', (d) => replaceEpisodeMentions(d, 'ep-x', [])],
  ['unknown-mention', 'editMention', (d) => editMention(d, 'gift', 'ep-a', { t: 1 })],
  ['unknown-mention', 'deleteMention', (d) => deleteMention(d, 'gift', 'ep-a')],
  ['field-not-settable', 'setFields term', (d) => setFields(d, 'gift', { term: 'present' })],
  ['field-not-settable', 'setFields gloss', (d) => setFields(d, 'gift', { gloss: 'present' })],
  ['field-not-settable', 'editMention episode_id', (d) => editMention(d, 'gift', 'ep-b', { episode_id: 'ep-a' })],
  ['field-not-settable', 'addEpisode', (d) => addEpisode(d, { ...episode, host: 'Rob' })],
  ['field-not-settable', 'a mention item', (d) => addMention(d, 'ep-a', { ...item, slug: 'gift', episode_id: 'ep-c' })],
  ['field-not-settable', 'a mention item with slug and entry', (d) => addMention(d, 'ep-a', { ...newItem, slug: 'gift' })],
  ['field-not-settable', 'a new entry', (d) => replaceEpisodeMentions(d, 'ep-a', [{ ...newItem, entry: { ...newItem.entry, slug: 'pound' } }])],
  ['merge-self', 'mergeEntries', (d) => mergeEntries(d, 'gift', 'gift')],
  // bat and bath both have a mention in ep-c, and only there.
  ['merge-keep-invalid', 'mergeEntries keep without a clash', (d) => mergeEntries(d, 'bath', 'bat', { keep: { 'ep-a': 'from' } })],
  ['merge-keep-invalid', 'mergeEntries keep with another side', (d) => mergeEntries(d, 'bath', 'bat', { keep: { 'ep-c': 'both' } })],
  ['unknown-edit', 'applyEdits with an unknown op', (d) => applyEdits(d, [{ op: 'frobnicate', args: [] }])],
  ['unknown-edit', 'applyEdits without args', (d) => applyEdits(d, [{ op: 'deleteEntry' }])],
  ['unknown-edit', 'applyEdits with an inherited name', (d) => applyEdits(d, [{ op: 'toString', args: [] }])],
  ['unknown-edit', 'applyEdits with no list', (d) => applyEdits(d, { op: 'deleteEntry', args: ['gift'] })],
  // inch links [[from:uncia]], which resolves to ounce by its original form.
  ['link-taken', 'renameEntry', (d) => renameEntry(d, 'acrobat', 'uncia')],
]

for (const [code, edit, fn] of ROWS) {
  test(`${edit} refuses with ${code}`, () => assertRefused(fn, small(), code))
}

test('every refusal code in the catalogue has a row', () => {
  assert.deepEqual([...new Set(ROWS.map(([code]) => code))].sort(), [...REFUSAL_CODES].sort())
})
