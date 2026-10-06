// Silencing is exact: a record silences the one warning with its identity, never other warnings
// of the same entry, mention, episode or code.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { problem, problemKey } from '../../src/checks/codes.js'
import { problems } from '../../src/checks/problems.js'
import { applySilenced, silence, silenceRecord, silencedFileProblems, unsilence } from '../../src/checks/silenced.js'
import { entry, mention, small } from '../fixtures/data.js'
import { assertRefused } from '../helpers.js'

/** small(), changed by fn(data, entryBySlug). */
const changed = (fn) => {
  const d = small()
  fn(d, (slug) => d.entries.find((e) => e.slug === slug))
  return d
}
const keys = (list) => list.map(problemKey).sort()

/** Silences `target` among the problems of `d`, and checks that it alone is silenced. */
function silenceOnly(d, target) {
  const found = problems(d)
  assert.ok(found.length > 1, 'the case needs other warnings')
  const records = silence([], target, found)
  const { active, silenced, stale } = applySilenced(found, records)
  assert.deepEqual(silenced, [target])
  const others = [...found]
  others.splice(others.findIndex((p) => problemKey(p) === problemKey(target)), 1)
  assert.deepEqual(keys(active), keys(others))
  assert.deepEqual(stale, [])
  return records
}

test('silencing a warning leaves the other warnings of the same mention', () => {
  // note-context and link-unresolved-close, both about gift in ep-b.
  const d = changed((d, find) => (find('gift').mentions[0].note = 'Another [[see:batters]].'))
  const found = problems(d)
  assert.deepEqual(found.map((p) => [p.code, p.mention]), [
    ['link-unresolved-close', { slug: 'gift', episode_id: 'ep-b' }],
    ['note-context', { slug: 'gift', episode_id: 'ep-b' }],
  ])
  silenceOnly(d, found[1])
  silenceOnly(d, found[0])
})

test('silencing a warning leaves the same warning about another link in the same note', () => {
  const d = changed((d, find) => (find('gift').mentions[0].note = 'Not [[see:batters]], nor [[see:baths]].'))
  const found = problems(d).filter((p) => p.code === 'link-unresolved-close')
  assert.deepEqual(found.map((p) => p.detail), ['baths', 'batters'])
  silenceOnly(d, found[0])
  silenceOnly(d, found[1])
})

test("silencing a warning leaves the same warning about the entry's other mentions", () => {
  // cartouche is in ep-a and ep-c.
  const d = changed((d, find) => {
    for (const m of find('cartouche').mentions) m.note = 'Another loop.'
  })
  const found = problems(d).filter((p) => p.code === 'note-context')
  assert.deepEqual(found.map((p) => p.mention.episode_id), ['ep-a', 'ep-c'])
  silenceOnly(d, found[0])
})

test('silencing a likely duplicate leaves the other pairs of the same entry, and other codes', () => {
  // batters is a plural of batter and a spelling variant of battery, which is one of batter.
  const d = changed((d) =>
    d.entries.push(entry('batters', {}, mention('ep-a', 1, 'Plural.')), entry('battery', {}, mention('ep-a', 2, 'Guns.'))),
  )
  const found = problems(d)
  assert.deepEqual(found.map((p) => [p.code, p.slugs.join(' ')]), [
    ['duplicate-plural', 'batter batters'],
    ['duplicate-spelling', 'batter battery'],
    ['duplicate-spelling', 'batters battery'],
  ])
  for (const p of found) silenceOnly(d, p)
})

test('of two warnings with the same identity, one record silences one', () => {
  const d = changed((d, find) => (find('gift').mentions[0].note = 'See [[see:batters]] and [[see:batters]].'))
  const found = problems(d)
  assert.equal(found.length, 2)
  assert.equal(problemKey(found[0]), problemKey(found[1]))
  const once = silence([], found[0], found)
  assert.deepEqual(applySilenced(found, once).active.length, 1)
  const twice = silence(once, found[0], found)
  assert.deepEqual(applySilenced(found, twice), { active: [], silenced: found, stale: [] })
  assertRefused(() => silence(twice, found[0], found), d, 'silence-unknown')
  assert.deepEqual(unsilence(twice, found[0]), once)
})

test('a silence is kept by identity, so a reworded warning stays silenced', () => {
  const before = problems(changed((d, find) => (find('gift').mentions[0].note = 'Another present.')))
  const after = problems(changed((d, find) => (find('gift').mentions[0].note = 'Another gift, given.')))
  const records = silence([], before[0], before)
  assert.deepEqual(applySilenced(after, records).silenced, after)
})

test('a record that matches no warning is stale, and can be removed', () => {
  const d = changed((d, find) => (find('gift').mentions[0].note = 'Another present.'))
  const found = problems(d)
  const records = silence([], found[0], found)
  const fixed = problems(small())
  assert.deepEqual(applySilenced(fixed, records), { active: [], silenced: [], stale: records })
  assert.deepEqual(unsilence(records, records[0]), [])
})

test('records keep the identity only, in key order, and are kept sorted', () => {
  const d = changed((d, find) => (find('gift').mentions[0].note = 'Another [[see:batters]].'))
  const found = problems(d)
  const records = silence(silence([], found[1], found), found[0], found)
  assert.deepEqual(records, [
    { code: 'link-unresolved-close', slugs: ['gift'], mention: { slug: 'gift', episode_id: 'ep-b' }, detail: 'batters' },
    { code: 'note-context', slugs: ['gift'], mention: { slug: 'gift', episode_id: 'ep-b' } },
  ])
  assert.deepEqual(Object.keys(silenceRecord(found[0])), ['code', 'slugs', 'mention', 'detail'])
})

test('only warnings can be silenced', () => {
  const error = problem('entry-empty', 'm', ['gift'])
  assertRefused(() => silence([], error, [error]), small(), 'silence-not-warning')
})

test('silencedFileProblems checks the shape of silenced.json', () => {
  assert.deepEqual(silencedFileProblems([]), [])
  assert.deepEqual(silencedFileProblems([{ code: 'note-context', slugs: ['a'], mention: { slug: 'a', episode_id: 'e' } }]), [])
  assert.equal(silencedFileProblems({}).length, 1)
  assert.equal(silencedFileProblems([{ code: 'entry-empty', slugs: ['a'] }]).length, 1)
  assert.equal(silencedFileProblems([{ code: 'note-context', slugs: 'a' }]).length, 1)
  assert.equal(silencedFileProblems([{ code: 'note-context', slugs: [], message: 'm' }]).length, 1)
  assert.equal(silencedFileProblems([{ code: 'note-context', slugs: [], mention: { slug: 'a' } }]).length, 1)
})
