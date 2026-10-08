import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sideEffects } from '../../src/checks/effects.js'
import { addEpisode } from '../../src/edit/episodes.js'
import { small } from '../fixtures/data.js'
import { assertEdit, assertRefused } from '../helpers.js'

const episode = { id: 'ep-d', title: 'Episode D', date: '2026-02-15', duration: 2000 }

test('addEpisode inserts the episode by date, newest first, with keys in file order', () => {
  const { after } = assertEdit(addEpisode, small(), [{ duration: 2000, date: '2026-02-15', title: 'Episode D', id: 'ep-d' }])
  assert.deepEqual(after.episodes.map((ep) => ep.id), ['ep-c', 'ep-d', 'ep-b', 'ep-a'])
  assert.deepEqual(after.episodes[1], episode)
  assert.deepEqual(Object.keys(after.episodes[1]), ['id', 'title', 'date', 'duration'])
})

test('addEpisode puts the newest and the oldest at the ends', () => {
  const newest = assertEdit(addEpisode, small(), [{ ...episode, date: '2026-05-01' }]).after
  assert.equal(newest.episodes[0].id, 'ep-d')
  const oldest = assertEdit(addEpisode, small(), [{ ...episode, date: '2025-05-01' }]).after
  assert.equal(oldest.episodes.at(-1).id, 'ep-d')
})

test('addEpisode refuses an id that is taken, and an invalid field', () => {
  assertRefused((d) => addEpisode(d, { ...episode, id: 'ep-a' }), small(), 'episode-duplicate')
  assertRefused((d) => addEpisode(d, { ...episode, date: '15 Feb 2026' }), small(), 'episode-field')
  assertRefused((d) => addEpisode(d, { ...episode, duration: undefined }), small(), 'episode-field')
})

test('addEpisode has no side effects on entries', () => {
  const effects = sideEffects(small(), addEpisode(small(), episode))
  assert.deepEqual([effects.entries, effects.mentions, effects.notes, effects.links, effects.introduced], [
    { added: [], removed: [], changed: [] },
    { added: [], removed: [], moved: [], changed: [] },
    [],
    [],
    [],
  ])
})
