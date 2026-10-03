import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addMention, deleteMention, editMention, replaceEpisodeMentions } from '../../src/edit/mentions.js'
import { small } from '../fixtures/data.js'
import { assertEdit, assertRefused } from '../helpers.js'

const find = (d, slug) => d.entries.find((e) => e.slug === slug)
const slugs = (d) => d.entries.map((e) => e.slug)
const m = (fields) => ({ t: 5, role: 'subject', note: 'A note.', confidence: 'high', ...fields })
const pound = (fields = {}) => ({ term: 'pound', original: 'pondus', translation: null, language: 'English', category: 'word', ...fields })

// ep-b has gift, Gift (German), inch and ounce, each only in ep-b.
const EP_B = ['gift', 'gift-german', 'inch', 'ounce', 'pound']

test('replaceEpisodeMentions replaces mentions, creates declared entries and removes those left empty', () => {
  const items = [
    m({ slug: 'gift', t: 12, note: 'A present.' }),
    m({ slug: 'gift-german', t: 20, note: 'Poison.' }),
    m({ slug: 'inch', t: 30, note: 'From Latin [[from:uncia]].' }),
    m({ entry: pound(), t: 50, note: 'From Latin [[from:pondus]], weight.' }),
  ]
  const { after } = assertEdit(replaceEpisodeMentions, small(), ['ep-b', items], { touched: EP_B })
  assert.ok(!slugs(after).includes('ounce'))
  assert.deepEqual(find(after, 'gift').mentions, [{ episode_id: 'ep-b', t: 12, role: 'subject', note: 'A present.', confidence: 'high' }])
  assert.deepEqual(find(after, 'pound'), {
    slug: 'pound', term: 'pound', original: 'pondus', translation: null, language: 'English', category: 'word',
    mentions: [{ episode_id: 'ep-b', t: 50, role: 'subject', note: 'From Latin [[from:pondus]], weight.', confidence: 'high' }],
  })
})

test('replaceEpisodeMentions keeps the other episodes of an entry', () => {
  // cartouche is in ep-a and ep-c; everything else in ep-c is only there.
  const { after } = assertEdit(replaceEpisodeMentions, small(), ['ep-c', []], {
    touched: ['acrobat', 'bat', 'bath', 'batter', 'break-a-leg', 'cartouche'],
  })
  assert.deepEqual(find(after, 'cartouche').mentions.map((x) => x.episode_id), ['ep-a'])
  assert.deepEqual(['acrobat', 'bat', 'bath', 'batter', 'break-a-leg'].filter((s) => slugs(after).includes(s)), [])
})

test('replaceEpisodeMentions sorts a reused entry\'s mentions by episode date', () => {
  const { after } = assertEdit(replaceEpisodeMentions, small(), ['ep-b', [m({ slug: 'cartouche', t: 7 })]], { touched: [...EP_B, 'cartouche'] })
  assert.deepEqual(find(after, 'cartouche').mentions.map((x) => x.episode_id), ['ep-a', 'ep-b', 'ep-c'])
})

test('replaceEpisodeMentions with the same items again gives the same data', () => {
  const items = [m({ slug: 'gift' }), m({ entry: pound(), t: 6 })]
  const once = replaceEpisodeMentions(small(), 'ep-b', items)
  assert.deepEqual(replaceEpisodeMentions(once, 'ep-b', items), once)
})

test('replaceEpisodeMentions may declare again an entry that only this episode has', () => {
  const once = replaceEpisodeMentions(small(), 'ep-b', [m({ entry: pound() })])
  const { after } = assertEdit(replaceEpisodeMentions, once, ['ep-b', [m({ entry: pound({ language: 'Latin' }) })]], { touched: ['pound'] })
  assert.equal(find(after, 'pound').language, 'Latin')
})

test('replaceEpisodeMentions refuses a new entry whose slug is taken, and an entry twice', () => {
  assertRefused((d) => replaceEpisodeMentions(d, 'ep-b', [m({ entry: pound({ term: 'Cartouche' }) })]), small(), 'slug-duplicate')
  assertRefused((d) => replaceEpisodeMentions(d, 'ep-b', [m({ entry: pound() }), m({ entry: pound(), t: 9 })]), small(), 'slug-duplicate')
  assertRefused((d) => replaceEpisodeMentions(d, 'ep-b', [m({ slug: 'gift' }), m({ slug: 'gift', t: 9 })]), small(), 'mention-twice')
})

test('replaceEpisodeMentions refuses invalid mentions and entries', () => {
  assertRefused((d) => replaceEpisodeMentions(d, 'ep-b', [m({ slug: 'gift', role: 'topic' })]), small(), 'role-unknown')
  assertRefused((d) => replaceEpisodeMentions(d, 'ep-b', [m({ slug: 'gift', t: 1.5 })]), small(), 'mention-field')
  assertRefused((d) => replaceEpisodeMentions(d, 'ep-b', [m({ slug: 'gift', t: 3001 })]), small(), 'mention-after-end')
  assertRefused((d) => replaceEpisodeMentions(d, 'ep-b', [m({ entry: pound({ category: 'noun' }) })]), small(), 'category-unknown')
  assertRefused((d) => replaceEpisodeMentions(d, 'ep-b', [m({ entry: pound({ term: '' }) })]), small(), 'entry-field')
  assertRefused((d) => replaceEpisodeMentions(d, 'ep-b', [m({ slug: 'gift', note: 'See [[form:x]].' })]), small(), 'link-type-unknown')
})

test('addMention adds a mention to an existing entry, in episode order', () => {
  const { after } = assertEdit(addMention, small(), ['ep-c', m({ slug: 'gift', t: 8 })], { touched: ['gift'] })
  assert.deepEqual(find(after, 'gift').mentions.map((x) => `${x.episode_id}@${x.t}`), ['ep-b@10', 'ep-c@8'])
})

test('addMention creates a declared entry', () => {
  const { after } = assertEdit(addMention, small(), ['ep-a', m({ entry: pound() })], { touched: ['pound'] })
  assert.equal(find(after, 'pound').mentions[0].episode_id, 'ep-a')
})

test('addMention refuses a second mention in one episode and a taken slug', () => {
  assertRefused((d) => addMention(d, 'ep-b', m({ slug: 'gift' })), small(), 'mention-twice')
  assertRefused((d) => addMention(d, 'ep-a', m({ entry: pound({ term: 'gift' }) })), small(), 'slug-duplicate')
})

test('editMention changes the given fields only', () => {
  const { after } = assertEdit(editMention, small(), ['gift', 'ep-b', { note: 'A present.', confidence: 'low' }], { touched: ['gift'] })
  assert.deepEqual(find(after, 'gift').mentions, [{ episode_id: 'ep-b', t: 10, role: 'subject', note: 'A present.', confidence: 'low' }])
})

test('editMention refuses an invalid value', () => {
  assertRefused((d) => editMention(d, 'gift', 'ep-b', { t: 3001 }), small(), 'mention-after-end')
  assertRefused((d) => editMention(d, 'gift', 'ep-b', { role: null }), small(), 'role-unknown')
  assertRefused((d) => editMention(d, 'gift', 'ep-b', { note: 'See [[meal]].' }), small(), 'link-malformed')
})

test('deleteMention deletes one mention, and an entry left without mentions', () => {
  const { after } = assertEdit(deleteMention, small(), ['cartouche', 'ep-c'], { touched: ['cartouche'] })
  assert.deepEqual(find(after, 'cartouche').mentions.map((x) => x.episode_id), ['ep-a'])
  const gone = assertEdit(deleteMention, small(), ['acrobat', 'ep-c'], { touched: ['acrobat'] }).after
  assert.ok(!slugs(gone).includes('acrobat'))
})
