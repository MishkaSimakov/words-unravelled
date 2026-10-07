import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EDITS, applyEdits } from '../../src/edit/batch.js'
import * as entries from '../../src/edit/entries.js'
import * as episodes from '../../src/edit/episodes.js'
import * as mentions from '../../src/edit/mentions.js'
import * as merges from '../../src/edit/merges.js'
import * as names from '../../src/edit/names.js'
import { small } from '../fixtures/data.js'
import { assertEdit, assertRefused } from '../helpers.js'

const find = (d, slug) => d.entries.find((e) => e.slug === slug)

test('applyEdits applies the edits in order', () => {
  // A merge with a field chosen from the merged entry: setFields, then mergeEntries.
  const ops = [
    { op: 'setFields', args: ['bat', { language: 'Old English' }] },
    { op: 'mergeEntries', args: ['bath', 'bat', { keep: { 'ep-c': 'into' } }] },
  ]
  const { after } = assertEdit(applyEdits, small(), [ops], { touched: ['bat', 'bath'], retargets: true })
  assert.equal(find(after, 'bath'), undefined)
  assert.equal(find(after, 'bat').language, 'Old English')
  assert.deepEqual(applyEdits(small(), []), small())
})

test('applyEdits applies none of the edits when one refuses', () => {
  const ops = [
    { op: 'setFields', args: ['bat', { language: 'Old English' }] },
    { op: 'mergeEntries', args: ['bath', 'bat'] },
  ]
  assertRefused((d) => applyEdits(d, ops), small(), 'mention-twice')
})

test('EDITS has every edit', () => {
  const all = { ...entries, ...episodes, ...mentions, ...merges, ...names }
  assert.deepEqual(Object.keys(EDITS).sort(), Object.keys(all).sort())
})
