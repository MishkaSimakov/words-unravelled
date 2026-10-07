// Every problem code: one dataset where it is raised, and a near miss where it must not be.
// The last test fails if a code in the catalogue has no case here.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PROBLEM_CODES } from '../../src/checks/codes.js'
import { problems } from '../../src/checks/problems.js'
import { entry, mention, small } from '../fixtures/data.js'

/** small(), changed by fn(data, entryBySlug). */
const changed = (fn) => () => {
  const d = small()
  fn(d, (slug) => d.entries.find((e) => e.slug === slug))
  return d
}
const added = (...entries) => changed((d) => d.entries.push(...entries))
const note = (slug, text) => changed((d, find) => (find(slug).mentions[0].note = text))
const ep = (id) => (d) => d.episodes.find((e) => e.id === id)
const lines = (...times) => times.map((t) => `[00:00:${String(t).padStart(2, '0')}] words`).join('\n')

const CASES = {
  'entry-field': {
    raised: changed((d, find) => delete find('gift').original),
    nearMiss: changed((d, find) => (find('gift').language = null)),
    slugs: ['gift'],
  },
  'mention-field': {
    raised: changed((d, find) => (find('gift').mentions[0].t = -1)),
    nearMiss: changed((d, find) => (find('gift').mentions[0].t = 0)),
    slugs: ['gift'],
  },
  'episode-field': {
    raised: changed((d) => (ep('ep-a')(d).duration = 0)),
    nearMiss: changed((d) => (ep('ep-c')(d).duration = 501)),
    slugs: [],
  },
  'category-unknown': {
    raised: changed((d, find) => (find('gift').category = 'words')),
    nearMiss: changed((d, find) => (find('gift').category = 'word-part')),
    slugs: ['gift'],
  },
  'role-unknown': {
    raised: changed((d, find) => (find('gift').mentions[0].role = 'Subject')),
    nearMiss: changed((d, find) => (find('gift').mentions[0].role = 'mention')),
    slugs: ['gift'],
  },
  'confidence-unknown': {
    raised: changed((d, find) => (find('gift').mentions[0].confidence = 'medium')),
    nearMiss: changed((d, find) => (find('gift').mentions[0].confidence = 'low')),
    slugs: ['gift'],
  },
  'entry-empty': {
    raised: changed((d, find) => (find('acrobat').mentions = [])),
    nearMiss: changed((d, find) => find('acrobat').mentions.splice(0, 1, mention('ep-a', 1, ''))),
    slugs: ['acrobat'],
  },
  'episode-duplicate': {
    raised: changed((d) => d.episodes.push({ ...ep('ep-a')(d), title: 'Again' })),
    nearMiss: changed((d) => d.episodes.push({ ...ep('ep-a')(d), id: 'ep-a2' })),
    slugs: [],
  },
  'mention-episode-unknown': {
    raised: changed((d, find) => (find('acrobat').mentions[0].episode_id = 'ep-x')),
    nearMiss: changed((d, find) => (find('acrobat').mentions[0].episode_id = 'ep-b')),
    slugs: ['acrobat'],
  },
  'mention-after-end': {
    raised: changed((d, find) => (find('acrobat').mentions[0].t = 3001)),
    nearMiss: changed((d, find) => (find('acrobat').mentions[0].t = 3000)),
    slugs: ['acrobat'],
  },
  'mention-twice': {
    raised: changed((d, find) => find('gift').mentions.push(mention('ep-b', 11, ''))),
    nearMiss: changed((d, find) => find('gift').mentions.push(mention('ep-c', 11, ''))),
    slugs: ['gift'],
  },
  'timestamp-not-in-transcript': {
    raised: small,
    nearMiss: small,
    // ep-b's mentions are at 10, 20, 30 and 40 s; gift's is at 10.
    options: { transcripts: { 'ep-b': lines(20, 30, 40) } },
    nearMissOptions: { transcripts: { 'ep-b': lines(10, 20, 30, 40) } },
    slugs: ['gift'],
  },
  'slug-mismatch': {
    raised: changed((d, find) => (find('inch').term = 'inches')),
    nearMiss: changed((d, find) => (find('inch').term = 'Inch.')),
    slugs: ['inch'],
  },
  'slug-duplicate': {
    raised: added(entry('inch', {}, mention('ep-c', 600, 'Again.'))),
    nearMiss: added(entry('inches', {}, mention('ep-c', 600, 'Again.'))),
    slugs: ['inch'],
  },
  'link-malformed': {
    raised: note('inch', 'From Latin [[uncia]].'),
    nearMiss: note('inch', 'From Latin [[from:uncia]].'),
    slugs: ['inch'],
  },
  'link-type-unknown': {
    raised: note('inch', 'From Latin [[form:uncia]].'),
    nearMiss: note('inch', 'From Latin [[from:uncia]].'),
    slugs: ['inch'],
  },
  'link-ambiguous': {
    // Both ounce and Unze have the original form uncia.
    raised: added(entry('Unze', { original: 'uncia', language: 'German' }, mention('ep-c', 600, 'An ounce.'))),
    nearMiss: added(entry('Unze', { original: 'Unze', language: 'German' }, mention('ep-c', 600, 'An ounce.'))),
    slugs: ['inch'],
  },
  'link-needs-gloss': {
    raised: note('oatmeal', 'Porridge of [[see:meal]].'),
    nearMiss: note('oatmeal', 'Porridge of [[see:meal (flour)]].'),
    slugs: ['oatmeal'],
  },
  'link-unresolved-close': {
    raised: note('inch', 'A twelfth, like [[see:ounces]].'),
    nearMiss: note('inch', 'A twelfth, like [[see:troy weight]].'),
    slugs: ['inch'],
  },
  'duplicate-variant': {
    raised: added(entry('to batter', {}, mention('ep-c', 600, 'To beat.'))),
    nearMiss: added(entry('battery', {}, mention('ep-c', 600, 'Guns in a row.'))),
    slugs: ['batter', 'to-batter'],
  },
  'duplicate-plural': {
    raised: added(entry('batters', {}, mention('ep-c', 600, 'Mixtures.'))),
    nearMiss: added(entry('battery', {}, mention('ep-c', 600, 'Guns in a row.'))),
    slugs: ['batter', 'batters'],
  },
  'duplicate-spelling': {
    raised: added(entry('cartrige', {}, mention('ep-c', 600, 'A misspelling.'))),
    nearMiss: added(entry('cartage', {}, mention('ep-c', 600, 'Carrying by cart.'))),
    slugs: ['cartridge', 'cartrige'],
  },
  'duplicate-contained': {
    raised: added(entry('break a leg tonight', {}, mention('ep-c', 600, 'Good luck.'))),
    nearMiss: added(entry('break your leg', {}, mention('ep-c', 600, 'Bad luck.'))),
    slugs: ['break-a-leg', 'break-a-leg-tonight'],
  },
  'duplicate-original': {
    raised: added(entry('uncia', { language: 'Latin' }, mention('ep-c', 600, 'A twelfth.'))),
    nearMiss: added(entry('uncial', { language: 'Latin' }, mention('ep-c', 600, 'A script.'))),
    slugs: ['ounce', 'uncia'],
  },
  'link-missing': {
    // cartouche's note says "A doublet of [[same-root:cartridge]]".
    raised: added(entry('doublet', { category: 'about-language' }, mention('ep-c', 600, 'Two words from one root.'))),
    nearMiss: added(entry('doublet', {}, mention('ep-c', 600, 'A close-fitting jacket.'))),
    slugs: ['cartouche', 'doublet'],
  },
  'note-context': {
    raised: note('acrobat', 'Another walker on tiptoe.'),
    nearMiss: note('acrobat', 'Also called a walker on tiptoe.'),
    slugs: ['acrobat'],
  },
}

for (const [code, c] of Object.entries(CASES)) {
  test(`${code} is raised`, () => {
    const found = problems(c.raised(), c.options).filter((p) => p.code === code)
    assert.deepEqual(found.map((p) => p.slugs), [c.slugs])
  })
  test(`${code} is not raised by a near miss`, () => {
    assert.deepEqual(problems(c.nearMiss(), c.nearMissOptions ?? c.options).filter((p) => p.code === code), [])
  })
}

test('every problem code in the catalogue has a case', () => {
  assert.deepEqual(Object.keys(CASES).sort(), [...PROBLEM_CODES].sort())
})
