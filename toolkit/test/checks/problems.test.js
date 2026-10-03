import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CODES, problem, problemKey } from '../../src/checks/codes.js'
import { errors, introduced, problems } from '../../src/checks/problems.js'
import { data, entry, mention, small } from '../fixtures/data.js'

const codes = (list) => list.map((p) => p.code)

test('problems lists errors before warnings, then by catalogue order', () => {
  const d = small()
  d.entries.find((e) => e.slug === 'acrobat').mentions[0].note = 'Another [[see:batters]], [[see:x|y]].'
  d.entries.find((e) => e.slug === 'gift').category = 'thing'
  assert.deepEqual(codes(problems(d)), ['category-unknown', 'link-malformed', 'link-unresolved-close', 'note-context'])
})

test('warnings: false leaves the warnings out', () => {
  const d = small()
  d.entries.find((e) => e.slug === 'acrobat').mentions[0].note = 'Another [[see:batters]], [[see:x|y]].'
  assert.deepEqual(codes(problems(d, { warnings: false })), ['link-malformed'])
})

test('problems survives entries and mentions of the wrong shape', () => {
  const d = small()
  d.entries.push('not an entry', entry('broken', { mentions: null }), entry('zebra', {}, 42, mention('ep-a', 1, null)))
  d.episodes.push(null)
  const found = codes(problems(d))
  assert.ok(found.includes('entry-field') && found.includes('mention-field') && found.includes('episode-field'))
})

test('a problem names its mention, and the detail tells apart two bad links in one note', () => {
  const d = small()
  d.entries.find((e) => e.slug === 'inch').mentions[0].note = '[[form:uncia]] and [[form:pound]]'
  const found = problems(d).filter((p) => p.code === 'link-type-unknown')
  assert.deepEqual(found.map((p) => [p.mention, p.detail]), [
    [{ slug: 'inch', episode_id: 'ep-b' }, 'pound'],
    [{ slug: 'inch', episode_id: 'ep-b' }, 'uncia'],
  ])
  assert.notEqual(problemKey(found[0]), problemKey(found[1]))
})

test('problemKey ignores the wording', () => {
  const a = problem('entry-empty', 'one wording', ['x'])
  const b = problem('entry-empty', 'another', ['x'])
  assert.equal(problemKey(a), problemKey(b))
  assert.notEqual(problemKey(a), problemKey(problem('entry-empty', 'one wording', ['y'])))
})

test('problem takes its level from the catalogue, sorts its slugs, and knows every code', () => {
  assert.deepEqual(problem('duplicate-plural', 'm', ['b', 'a']), { level: 'warning', code: 'duplicate-plural', message: 'm', slugs: ['a', 'b'] })
  assert.throws(() => problem('no-such-code', 'm'), /Unknown problem code/)
  for (const { level } of Object.values(CODES)) assert.ok(['error', 'warning'].includes(level))
})

test('introduced lists only what the second version added', () => {
  const before = small()
  before.entries.find((e) => e.slug === 'acrobat').mentions[0].note = 'Another walker.'
  const after = structuredClone(before)
  after.entries.find((e) => e.slug === 'bat').mentions[0].note = 'One of the [[see:batters]].'
  assert.deepEqual(codes(introduced(before, after)), ['link-unresolved-close', 'note-context'])
  assert.deepEqual(introduced(before, after).map((p) => p.slugs), [['bat'], ['bat']])
  assert.deepEqual(introduced(after, before), [])
})

test('introduced compares by key, so a reworded problem is not new', () => {
  const before = data([entry('a', {}, mention('ep-a', 1, '[[form:b]]'))])
  const after = data([entry('a', {}, mention('ep-a', 1, 'Now: [[form:b]]'))])
  assert.deepEqual(introduced(before, after), [])
})

test('errors keeps only the errors', () => {
  const list = [problem('entry-empty', 'm', ['a']), problem('note-context', 'm', ['a'])]
  assert.deepEqual(codes(errors(list)), ['entry-empty'])
})
