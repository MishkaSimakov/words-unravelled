// The verifier's rules: a change it must allow, and for every rule a change that breaks it.
// The changes are made by hand, not with the toolkit's edits, except where the test is that the
// verifier accepts what an edit does.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { setGloss } from '../../toolkit/src/edit/names.js'
import { entry, mention, small } from '../../toolkit/test/fixtures/data.js'
import { checkChange } from '../4-verify/verify.js'
import { EPISODE, ID } from './project.js'

const DATA_FILES = ['data/entries.json', 'data/episodes.json']

/** `data` with the episode added: a new entry, London, and a mention of the existing ounce. */
function withEpisode(data) {
  const out = structuredClone(data)
  out.episodes.unshift({ ...EPISODE })
  out.entries.push(entry('London', { language: null, category: 'name' }, mention(ID, 60, 'Named after [[from:Londinium]].')))
  out.entries.find((e) => e.slug === 'ounce').mentions.push(mention(ID, 120, 'A weight, compared with [[see:inch]]es.', 'aside'))
  out.entries.sort((a, b) => (a.slug < b.slug ? -1 : 1))
  return out
}

const check = (after, { before = small(), changed = DATA_FILES } = {}) => checkChange({ episode: EPISODE, before, after, changed }).failures
const rules = (failures) => [...new Set(failures.map((f) => f.match(/^\[([a-z-]+)\]/)[1]))]
const find = (data, slug) => data.entries.find((e) => e.slug === slug)

describe('allowed changes', () => {
  test('a new episode with new entries and mentions of existing ones', () => {
    const result = checkChange({ episode: EPISODE, before: small(), after: withEpisode(small()), changed: DATA_FILES })
    assert.deepEqual(result.failures, [])
    assert.deepEqual(result.created, ['london'])
    assert.equal(result.mentions, 2)
  })

  test("files in the run's own folder", () => {
    assert.deepEqual(check(withEpisode(small()), { changed: [...DATA_FILES, `ingest/runs/${ID}/3-record.json`] }), [])
  })

  test('a gloss added by setGloss, with the links it rewrote in other episodes', () => {
    const after = setGloss(withEpisode(small()), 'cartridge', 'ammunition')
    assert.notEqual(find(after, 'cartouche').mentions[0].note, find(small(), 'cartouche').mentions[0].note)
    const result = checkChange({ episode: EPISODE, before: small(), after, changed: DATA_FILES })
    assert.deepEqual(result.failures, [])
    assert.deepEqual(result.glossed, [{ from: 'cartridge', to: 'cartridge-ammunition' }])
  })

  test('a gloss on an existing entry, and a new homograph with the same fields', () => {
    let after = withEpisode(small())
    after.entries.push(entry('batter', { gloss: 'cricket' }, mention(ID, 180, 'One who bats.')))
    after = setGloss(after, 'batter', 'mixture')
    assert.deepEqual(check(after), [])
  })
})

describe('rejected changes', () => {
  const cases = {
    files: [
      ['another data file', (d) => d, { changed: [...DATA_FILES, 'data/silenced.json'] }],
      ['a file outside data/', (d) => d, { changed: [...DATA_FILES, 'README.md'] }],
      ["another run's folder", (d) => d, { changed: [...DATA_FILES, 'ingest/runs/otherEpisode/5-report.md'] }],
    ],
    episodes: [
      ['the episode missing', (d) => ({ ...d, episodes: d.episodes.filter((ep) => ep.id !== ID) })],
      ['the episode twice', (d) => ({ ...d, episodes: [{ ...EPISODE }, ...d.episodes] })],
      ['other metadata', (d) => ({ ...d, episodes: d.episodes.map((ep) => (ep.id === ID ? { ...ep, title: 'Something else' } : ep)) })],
      ['another episode changed', (d) => ({ ...d, episodes: d.episodes.map((ep) => (ep.id === 'ep-a' ? { ...ep, duration: 1 } : ep)) })],
      ['another episode removed', (d) => ({ ...d, episodes: d.episodes.filter((ep) => ep.id !== 'ep-a') })],
      ['episodes reordered', (d) => ({ ...d, episodes: [d.episodes[0], ...d.episodes.slice(1).reverse()] })],
      ['an episode added besides', (d) => ({ ...d, episodes: [...d.episodes, { id: 'ep-z', title: 'Z', date: '2025-01-01', duration: 100 }] })],
    ],
    'new-entries': [
      ['a new entry with a mention of another episode', (d) => (find(d, 'london').mentions.push(mention('ep-a', 50, 'Also here.')), d)],
      ['a new entry with only another episode', (d) => (d.entries.push(entry('Paris', { language: null, category: 'name' }, mention('ep-b', 50, 'A city.'))), d)],
    ],
    entries: [
      ['an existing entry removed', (d) => ({ ...d, entries: d.entries.filter((e) => e.slug !== 'bath') })],
      ['an existing entry renamed', (d) => (Object.assign(find(d, 'bath'), { slug: 'baths', term: 'baths' }), d)],
      ['a gloss changed', (d) => (Object.assign(find(d, 'meal-flour'), { slug: 'meal-grain', gloss: 'grain' }), d)],
      ['a gloss added with another field changed', (d) => (Object.assign(find(d, 'bath'), { slug: 'bath-tub', gloss: 'tub', category: 'name' }), d)],
      ['no mentions of the episode', (d) => ({ ...d, entries: small().entries })],
    ],
    'existing-entries': [
      ['a field changed', (d) => ((find(d, 'inch').language = 'Latin'), d)],
      ['a gloss added without the slug', (d) => ((find(d, 'bath').gloss = 'tub'), d)],
      ['a mention of another episode added', (d) => (find(d, 'inch').mentions.push(mention('ep-c', 20, 'Again.')), d)],
      ['a mention of another episode removed', (d) => ((find(d, 'cartouche').mentions = find(d, 'cartouche').mentions.slice(1)), d)],
      ['a mention moved to another episode', (d) => ((find(d, 'acrobat').mentions[0].episode_id = 'ep-a'), d)],
    ],
    'other-mentions': [
      ["a note's text changed", (d) => ((find(d, 'inch').mentions[0].note += ' Also a unit.'), d)],
      ['a link retargeted', (d) => ((find(d, 'inch').mentions[0].note = 'From Latin [[from:uncia]], a twelfth, like [[see:inch]]s.'), d)],
      ['a link type changed', (d) => ((find(d, 'inch').mentions[0].note = 'From Latin [[same-root:uncia]], a twelfth, like [[see:ounce]]s.'), d)],
      ['a link to a glossed entry, without the gloss', (d) => ((find(d, 'oatmeal').mentions[0].note = 'Porridge of [[see:meal]].'), d)],
      ['a timestamp changed', (d) => ((find(d, 'inch').mentions[0].t = 31), d)],
      ['a role changed', (d) => ((find(d, 'inch').mentions[0].role = 'aside'), d)],
      ['a confidence changed', (d) => ((find(d, 'cartuccia').mentions[0].confidence = 'high'), d)],
    ],
    errors: [['a malformed link in a new note', (d) => ((find(d, 'london').mentions[0].note = 'Named after [[Londinium]].'), d)]],
  }

  for (const [rule, list] of Object.entries(cases)) {
    for (const [name, change, options] of list) {
      test(`${rule}: ${name}`, () => {
        const failures = check(change(withEpisode(small())), options)
        assert.ok(rules(failures).includes(rule), `[${rule}] among ${failures.join(' | ') || 'no failures'}`)
      })
    }
  }

  test('a link retargeted to the new gloss of another entry than the one it named', () => {
    // cartridge got a gloss, but the cartouche note's link to cartuccia was pointed at it.
    const after = setGloss(withEpisode(small()), 'cartridge', 'ammunition')
    find(after, 'cartouche').mentions[0].note = 'A doublet of [[same-root:cartridge (ammunition)]]; both from Italian [[from:cartridge (ammunition)]].'
    assert.deepEqual(rules(check(after)), ['other-mentions'])
  })

  test('data the verifier cannot read as entries', () => {
    assert.throws(() => check({ entries: null, episodes: [] }))
  })
})
