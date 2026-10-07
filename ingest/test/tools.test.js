// The agent's tools, called directly: what each one does, how each refuses, and that nothing
// they do reaches beyond the episode (checked with the verifier's own rules).

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { dataChanges } from '../../toolkit/src/checks/invariants.js'
import { problems } from '../../toolkit/src/checks/problems.js'
import { data as makeData, entry, mention, small } from '../../toolkit/test/fixtures/data.js'
import { checkChange } from '../4-verify/verify.js'
import { MAX_GLOSSES, MAX_NOTE_WORDS, createTools } from '../3-extract/tools.js'
import { EPISODE, ID, LINES, item } from './project.js'

const TRANSCRIPT = Object.keys(LINES)
  .map((t) => `[00:${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}] ${LINES[t]}`)
  .join('\n')

/** The tools on `data`, with what they saved and recorded. */
function setup(data = small()) {
  const state = { before: structuredClone(data), saved: null, saves: 0, record: {} }
  const tools = createTools({
    data,
    episode: EPISODE,
    transcript: TRANSCRIPT,
    save: (d) => {
      state.saved = d
      state.saves++
    },
    record: (fields) => Object.assign(state.record, fields),
  })
  return { tools, state }
}

const codes = (result) => (result.errors ?? result.warnings ?? []).map((p) => p.code)
const own = (data, slug) => data.entries.find((e) => e.slug === slug)?.mentions.find((m) => m.episode_id === ID)

/** Asserts the saved data changed only what the verifier allows, against the data at start. */
function assertInScope(state) {
  const { failures } = checkChange({ episode: EPISODE, before: state.before, after: state.saved, changed: ['data/entries.json', 'data/episodes.json'] })
  assert.deepEqual(failures, [])
}

const LONDON = item({ term: 'London', language: null, category: 'name' }, '00:01:00', 'Named after the Roman Londinium, from a Celtic name.')
const OUNCE = item('ounce', '00:02:00', 'A twelfth of a pound, as in an ounce of prevention.', 'aside')

describe('search', () => {
  test('takes several queries and says how many matched', () => {
    const { tools } = setup()
    const { results } = tools.search({ queries: ['meal', 'cartouche'] })
    assert.deepEqual(results.map((r) => r.query), ['meal', 'cartouche'])
    assert.ok(results[0].total >= 3)
    assert.deepEqual(results[0].results.slice(0, 2).map((r) => r.slug).sort(), ['meal-flour', 'meal-repast'])
    assert.equal(results[1].results[0].slug, 'cartouche')
    assert.equal(results[1].results[0].episodes, 2)
  })

  test('pages with limit and offset, and reports the total', () => {
    const { tools } = setup()
    const all = tools.search({ queries: ['bat'] }).results[0]
    assert.ok(all.total >= 3)
    const page = tools.search({ queries: ['bat'], limit: 1, offset: 1 }).results[0]
    assert.equal(page.total, all.total)
    assert.deepEqual(page.results.map((r) => r.slug), [all.results[1].slug])
  })
})

describe('entry', () => {
  test('gives fields, homographs, mentions with episode titles and backlinks', () => {
    const { tools } = setup()
    const meal = tools.entry({ slug: 'meal-flour' })
    assert.equal(meal.name, 'meal (flour)')
    assert.deepEqual(meal.homographs.map((e) => e.slug), ['meal-repast'])
    assert.equal(meal.mentions[0].episode, 'Episode A')
    assert.equal(meal.mentions[0].timestamp, '00:03:20')
    assert.deepEqual(meal.backlinks.map((e) => e.slug).sort(), ['meal-repast', 'oatmeal'])
  })

  test('refuses an unknown slug and names close ones', () => {
    const { tools } = setup()
    const r = tools.entry({ slug: 'meal' })
    assert.deepEqual(codes(r), ['unknown-entry'])
    assert.match(r.errors[0].message, /meal-flour/)
  })
})

describe('submit', () => {
  test("adds the episode's mentions, new entries and the episode, and saves", () => {
    const { tools, state } = setup()
    const r = tools.submit({ entries: [LONDON, OUNCE] })
    assert.equal(r.ok, true)
    assert.deepEqual([r.mentions, r.new_entries], [2, 1])
    assert.equal(state.saved.episodes[0].id, ID)
    assert.equal(own(state.saved, 'london').t, 60)
    assert.equal(own(state.saved, 'ounce').role, 'aside')
    assert.deepEqual([state.record.mentions, state.record.new_entries], [2, 1])
    assertInScope(state)
  })

  test('replaces an earlier submission', () => {
    const { tools, state } = setup()
    tools.submit({ entries: [LONDON, OUNCE] })
    const r = tools.submit({ entries: [OUNCE] })
    assert.equal(r.mentions, 1)
    assert.equal(state.saved.entries.find((e) => e.slug === 'london'), undefined)
    assertInScope(state)
  })

  test('returns only the warnings it introduces', () => {
    // The data already has a note-context warning in ep-a, which the agent must not see.
    const data = small()
    data.entries.find((e) => e.slug === 'bat').mentions[0].note = 'Another animal name.'
    assert.ok(problems(data).some((p) => p.code === 'note-context'))
    const { tools, state } = setup(data)
    const r = tools.submit({ entries: [LONDON, item('batter', '00:03:00', 'Also a player who bats.')] })
    assert.deepEqual(codes(r), ['note-context'])
    assert.equal(r.warnings[0].message.includes('batter'), true)
    assert.deepEqual(state.record.warnings.map((w) => w.code), ['note-context'])
  })

  test('returns existing entries a new entry may duplicate', () => {
    const { tools } = setup()
    const r = tools.submit({
      entries: [item({ term: 'ounces' }, '00:02:00', 'Twelfths of a pound.'), item({ term: 'uncia', language: 'Latin' }, '00:01:00', 'A twelfth in Latin.')],
    })
    assert.ok(r.possible_matches.ounces.some((e) => e.slug === 'ounce'), 'plural')
    assert.ok(r.possible_matches.uncia.some((e) => e.slug === 'ounce'), 'original form')
  })

  test('warns when a new glossed entry has an unglossed homograph', () => {
    const { tools } = setup()
    const r = tools.submit({ entries: [item({ term: 'batter', gloss: 'cricket' }, '00:03:00', 'A player who bats.')] })
    assert.deepEqual(codes(r), ['homograph-unglossed'])
    assert.match(r.warnings[0].message, /set_gloss/)
  })

  const refusals = {
    'note-too-long': [item({ term: 'Paris' }, '00:01:00', Array(MAX_NOTE_WORDS + 1).fill('word').join(' '))],
    'note-empty': [item({ term: 'Paris' }, '00:01:00', ' ')],
    'timestamp-not-in-transcript': [item({ term: 'Paris' }, '00:01:01', 'A city.')],
    'timestamp-format': [item({ term: 'Paris' }, '1:00', 'A city.')],
    'unknown-entry': [item('londinium', '00:01:00', 'A city.')],
    'entry-exists': [item({ term: 'ounce' }, '00:02:00', 'A weight.')],
    'mention-twice': [OUNCE, item('ounce', '00:03:00', 'Again.')],
    'field-not-settable': [{ ...OUNCE, episode_id: 'ep-a' }],
    'link-malformed': [item({ term: 'Paris' }, '00:01:00', 'A city, see [[London|Londinium]].')],
    'no-items': [],
  }
  for (const [code, entries] of Object.entries(refusals)) {
    test(`refuses the whole list for ${code}, changing nothing`, () => {
      const { tools, state } = setup()
      const r = tools.submit({ entries: [LONDON, ...entries].slice(code === 'no-items' ? 1 : 0) })
      assert.equal(r.ok, false)
      assert.ok(codes(r).includes(code), `${code} among ${codes(r)}`)
      assert.equal(state.saves, 0)
      assert.equal(tools.list().mentions.length, 0)
    })
  }

  test('a link counts as its text toward the word limit', () => {
    const { tools } = setup()
    const words = Array(MAX_NOTE_WORDS - 1).fill('word').join(' ')
    assert.equal(tools.submit({ entries: [item({ term: 'London' }, '00:01:00', `${words} [[see:Londinium Augusta]]`)] }).ok, false)
    assert.equal(tools.submit({ entries: [item({ term: 'London' }, '00:01:00', `${words} [[see:ounce]]s`)] }).ok, true)
  })
})

describe('add, edit, remove and merge', () => {
  test('add appends mentions', () => {
    const { tools, state } = setup()
    tools.submit({ entries: [LONDON] })
    const r = tools.add({ entries: [OUNCE] })
    assert.equal(r.mentions, 2)
    assert.ok(own(state.saved, 'ounce'))
    assert.deepEqual(codes(tools.add({ entries: [OUNCE] })), ['mention-twice'])
  })

  test("edit changes a mention's fields", () => {
    const { tools, state } = setup()
    tools.submit({ entries: [LONDON, OUNCE] })
    const r = tools.edit({ slug: 'ounce', fields: { timestamp: '00:03:00', role: 'subject', note: 'A weight.', confidence: 'low' } })
    assert.equal(r.ok, true)
    assert.deepEqual(own(state.saved, 'ounce'), { episode_id: ID, t: 180, role: 'subject', note: 'A weight.', confidence: 'low' })
    assertInScope(state)
  })

  test('edit renames a new entry, and links in this episode follow', () => {
    const { tools, state } = setup()
    tools.submit({ entries: [LONDON, item('ounce', '00:02:00', 'A weight, compared with [[see:London]].')] })
    const r = tools.edit({ slug: 'london', fields: { term: 'Londinium', language: 'Latin' } })
    assert.equal(r.ok, true)
    assert.equal(own(state.saved, 'london'), undefined)
    assert.equal(state.saved.entries.find((e) => e.slug === 'londinium').language, 'Latin')
    assert.equal(own(state.saved, 'ounce').note, 'A weight, compared with [[see:Londinium]].')
    assertInScope(state)
  })

  test('edit gives a new entry a gloss, and removes it again', () => {
    const { tools, state } = setup()
    tools.submit({ entries: [LONDON] })
    assert.equal(tools.edit({ slug: 'london', fields: { gloss: 'city' } }).ok, true)
    assert.ok(own(state.saved, 'london-city'))
    assert.equal(tools.edit({ slug: 'london-city', fields: { gloss: null } }).ok, true)
    assert.ok(own(state.saved, 'london'))
  })

  test("edit refuses an existing entry's fields, and entries not in the episode", () => {
    const { tools, state } = setup()
    tools.submit({ entries: [OUNCE] })
    const saves = state.saves
    assert.deepEqual(codes(tools.edit({ slug: 'ounce', fields: { language: 'English' } })), ['entry-read-only'])
    assert.deepEqual(codes(tools.edit({ slug: 'inch', fields: { note: 'x' } })), ['not-in-episode'])
    assert.deepEqual(codes(tools.edit({ slug: 'ounce', fields: { timestamp: '00:00:11' } })), ['timestamp-not-in-transcript'])
    assert.equal(state.saves, saves)
  })

  test('remove drops a mention, and a new entry with it', () => {
    const { tools, state } = setup()
    tools.submit({ entries: [LONDON, OUNCE] })
    assert.equal(tools.remove({ slug: 'london' }).mentions, 1)
    assert.equal(state.saved.entries.find((e) => e.slug === 'london'), undefined)
    assert.deepEqual(codes(tools.remove({ slug: 'london' })), ['not-in-episode'])
  })

  test('merge turns a new entry into a mention of an existing one, and links follow', () => {
    const { tools, state } = setup()
    tools.submit({
      entries: [item({ term: 'ounces' }, '00:02:00', 'Twelfths of a pound.'), item({ term: 'London', category: 'name', language: null }, '00:01:00', 'Its pound has [[see:ounces]].')],
    })
    const r = tools.merge({ slug: 'ounces', into: 'ounce' })
    assert.equal(r.ok, true)
    assert.equal(own(state.saved, 'ounce').note, 'Twelfths of a pound.')
    assert.equal(state.saved.entries.find((e) => e.slug === 'ounces'), undefined)
    assert.equal(own(state.saved, 'london').note, 'Its pound has [[see:ounce]].')
    assertInScope(state)
  })

  test('merge refuses existing entries and an entry already in the episode', () => {
    const { tools } = setup()
    tools.submit({ entries: [LONDON, OUNCE] })
    assert.deepEqual(codes(tools.merge({ slug: 'ounce', into: 'inch' })), ['entry-read-only'])
    assert.deepEqual(codes(tools.merge({ slug: 'london', into: 'ounce' })), ['mention-twice'])
    assert.deepEqual(codes(tools.merge({ slug: 'london', into: 'nowhere' })), ['unknown-entry'])
  })
})

describe('set_gloss', () => {
  test('glosses an existing entry and rewrites the links to it, everywhere', () => {
    const { tools, state } = setup()
    tools.submit({ entries: [item({ term: 'cartridge', gloss: 'printer' }, '00:01:00', 'An ink cartridge.')] })
    const r = tools.set_gloss({ slug: 'cartridge', gloss: 'ammunition' })
    assert.equal(r.ok, true)
    assert.equal(r.slug, 'cartridge-ammunition')
    const note = state.saved.entries.find((e) => e.slug === 'cartouche').mentions[0].note
    assert.equal(note, 'A doublet of [[same-root:cartridge (ammunition)]]; both from Italian [[from:cartuccia]].')
    assert.deepEqual(state.record.glosses, [{ from: 'cartridge', to: 'cartridge-ammunition' }])
    // The homograph warning went with the gloss: the entry it named has one now.
    assert.deepEqual(codes(r), [])
    assertInScope(state)
  })

  test('refuses entries with a gloss, new entries, unknown entries and empty glosses', () => {
    const { tools, state } = setup()
    tools.submit({ entries: [LONDON] })
    const saves = state.saves
    assert.deepEqual(codes(tools.set_gloss({ slug: 'meal-flour', gloss: 'grain' })), ['gloss-exists'])
    assert.deepEqual(codes(tools.set_gloss({ slug: 'london', gloss: 'city' })), ['unknown-entry'])
    assert.deepEqual(codes(tools.set_gloss({ slug: 'nowhere', gloss: 'x' })), ['unknown-entry'])
    assert.deepEqual(codes(tools.set_gloss({ slug: 'bat', gloss: ' ' })), ['gloss-empty'])
    assert.equal(state.saves, saves)
  })

  test(`refuses more than ${MAX_GLOSSES} glosses`, () => {
    const entries = Array.from({ length: MAX_GLOSSES + 1 }, (_, i) => entry(`word${i}`, {}, mention('ep-a', i, 'A word.')))
    const { tools } = setup(makeData(entries))
    for (let i = 0; i < MAX_GLOSSES; i++) assert.equal(tools.set_gloss({ slug: `word${i}`, gloss: 'sense' }).ok, true)
    assert.deepEqual(codes(tools.set_gloss({ slug: `word${MAX_GLOSSES}`, gloss: 'sense' })), ['glosses-full'])
  })

  test('refuses a gloss whose slug would take links from another entry', () => {
    const data = makeData([
      entry('felis', { language: 'Latin' }, mention('ep-a', 10, 'Latin for cat.')),
      entry('cat', { original: 'felis cat' }, mention('ep-a', 20, 'A pet.')),
      entry('kitten', {}, mention('ep-b', 30, 'From [[from:felis cat]].')),
    ])
    const { tools } = setup(data)
    assert.deepEqual(codes(tools.set_gloss({ slug: 'felis', gloss: 'cat' })), ['link-taken'])
  })
})

describe('complain, list and finish', () => {
  test('complain records remarks about existing entries only', () => {
    const { tools, state } = setup()
    tools.submit({ entries: [LONDON] })
    assert.equal(tools.complain({ slug: 'inch', text: 'The language should be English.' }).ok, true)
    assert.deepEqual(state.record.complaints, [{ slug: 'inch', name: 'inch', text: 'The language should be English.' }])
    assert.deepEqual(codes(tools.complain({ slug: 'london', text: 'x' })), ['unknown-entry'])
    assert.deepEqual(codes(tools.complain({ slug: 'inch', text: ' ' })), ['complaint-empty'])
    assert.deepEqual(codes(tools.complain({ slug: 'inch', text: 'x'.repeat(1001) })), ['complaint-too-long'])
  })

  test("list shows the episode's mentions in time order", () => {
    const { tools } = setup()
    tools.submit({ entries: [OUNCE, LONDON] })
    const { mentions } = tools.list()
    assert.deepEqual(mentions.map((m) => [m.slug, m.new, m.timestamp]), [['london', true, '00:01:00'], ['ounce', false, '00:02:00']])
    assert.equal(mentions[0].entry.category, 'name')
  })

  test('finish needs mentions and a retrospective, and ends all changes', () => {
    const { tools, state } = setup()
    assert.deepEqual(codes(tools.finish({ retro: 'x' })), ['no-mentions'])
    tools.submit({ entries: [LONDON] })
    assert.deepEqual(codes(tools.finish({ retro: '' })), ['retro-empty'])
    assert.equal(tools.finish({ retro: 'Fine.' }).ok, true)
    assert.equal(state.record.finished, true)
    assert.equal(state.record.retro, 'Fine.')
    for (const r of [tools.submit({ entries: [OUNCE] }), tools.add({ entries: [OUNCE] }), tools.set_gloss({ slug: 'bat', gloss: 'animal' }), tools.finish({ retro: 'x' })]) {
      assert.deepEqual(codes(r), ['finished'])
    }
  })
})

test('the tools refuse an episode that is in the data already', () => {
  const data = small()
  data.episodes.unshift({ ...EPISODE })
  assert.throws(() => setup(data), /twice/)
})

test('a long session of edits changes only this episode', () => {
  const { tools, state } = setup()
  tools.submit({ entries: [LONDON, OUNCE, item({ term: 'batter', gloss: 'cricket' }, '00:03:00', 'One who bats.')] })
  tools.set_gloss({ slug: 'batter', gloss: 'mixture' })
  tools.edit({ slug: 'london', fields: { note: 'Named after [[from:Londinium]].' } })
  tools.add({ entries: [item('acrobat', '00:00:10', 'A walker on tiptoe.', 'mention')] })
  tools.remove({ slug: 'acrobat' })
  tools.complain({ slug: 'bath', text: 'Pointed back to which episode?' })
  const changes = dataChanges(state.before, state.saved)
  assert.deepEqual(changes.entries.removed, ['batter'])
  assert.deepEqual(changes.entries.added.sort(), ['batter-cricket', 'batter-mixture', 'london'])
  assertInScope(state)
})
