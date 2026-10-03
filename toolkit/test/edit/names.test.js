import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renameEntry, setGloss } from '../../src/edit/names.js'
import { data, entry, mention, small } from '../fixtures/data.js'
import { assertEdit, assertLinksFollow, assertRefused } from '../helpers.js'

const find = (d, slug) => d.entries.find((e) => e.slug === slug)
const note = (d, slug) => find(d, slug).mentions[0].note

/** Runs a renaming edit through every invariant, the links included. */
function renamed(edit, d, args, from, to) {
  const before = structuredClone(d)
  const { after } = assertEdit(edit, d, args, { touched: [from, to], retargets: true })
  assertLinksFollow(before, after, { [from]: to })
  return after
}

test('setGloss changes the slug and adds the gloss to links, keeping the text they show', () => {
  const after = renamed(setGloss, small(), ['ounce', 'weight'], 'ounce', 'ounce-weight')
  assert.deepEqual([find(after, 'ounce-weight').gloss, find(after, 'ounce-weight').term], ['weight', 'ounce'])
  assert.equal(find(after, 'ounce'), undefined)
  // The link by original form stays as it was; the one by name gets the gloss, trail and all.
  assert.equal(note(after, 'inch'), 'From Latin [[from:uncia]], a twelfth, like [[see:ounce (weight)]]s.')
})

test('setGloss keeps the case of the link text, and leaves links to other homographs alone', () => {
  const after = renamed(setGloss, small(), ['gift', 'present'], 'gift', 'gift-present')
  assert.equal(note(after, 'gift-german'), 'Poison, from the same root as English [[same-root:gift (present)]].')
  assert.equal(note(after, 'gift-present'), 'A present; [[unrelated:Gift (German)]] means poison.')
  const d = data([entry('Ounce', {}, mention('ep-a', 1, '')), entry('inch', {}, mention('ep-a', 2, 'Like the [[see:OUNCE]].'))])
  assert.equal(note(renamed(setGloss, d, ['ounce', 'weight'], 'ounce', 'ounce-weight'), 'inch'), 'Like the [[see:OUNCE (weight)]].')
})

test('setGloss replaces an existing gloss in links', () => {
  const after = renamed(setGloss, small(), ['meal-flour', 'grain'], 'meal-flour', 'meal-grain')
  assert.equal(note(after, 'oatmeal'), 'Porridge of [[see:meal (grain)]].')
  assert.equal(note(after, 'meal-repast'), 'A repast, unrelated to [[unrelated:meal (grain)]].')
})

test('setGloss with null removes the gloss, from links too', () => {
  const after = renamed(setGloss, small(), ['meal-flour', null], 'meal-flour', 'meal')
  assert.equal('gloss' in find(after, 'meal'), false)
  assert.equal(note(after, 'oatmeal'), 'Porridge of [[see:meal]].')
})

test("setGloss rewrites links in the entry's own notes", () => {
  const d = data([entry('burgundy', {}, mention('ep-a', 1, 'From the [[from:Burgundy]] region.'))])
  const { after } = assertEdit(setGloss, d, ['burgundy', 'colour'], { touched: ['burgundy', 'burgundy-colour'] })
  assert.equal(note(after, 'burgundy-colour'), 'From the [[from:Burgundy (colour)]] region.')
})

test('setGloss refuses a slug that is taken, and an empty gloss', () => {
  assertRefused((d) => setGloss(d, 'gift', 'German'), small(), 'slug-duplicate')
  assertRefused((d) => setGloss(d, 'gift-german', null), small(), 'slug-duplicate')
  assertRefused((d) => setGloss(d, 'gift', ''), small(), 'entry-field')
})

test('renameEntry changes the term and slug, and links name the new term', () => {
  const after = renamed(renameEntry, small(), ['cartuccia', 'cartoccio'], 'cartuccia', 'cartoccio')
  assert.equal(find(after, 'cartoccio').term, 'cartoccio')
  assert.equal(note(after, 'cartridge'), 'From [[from:cartoccio]], via French.')
  assert.equal(find(after, 'cartouche').mentions[0].note, 'A doublet of [[same-root:cartridge]]; both from Italian [[from:cartoccio]].')
})

test('renameEntry keeps the gloss, in the slug and in links', () => {
  const after = renamed(renameEntry, small(), ['meal-flour', 'meel'], 'meal-flour', 'meel-flour')
  assert.equal(note(after, 'oatmeal'), 'Porridge of [[see:meel (flour)]].')
})

test('renameEntry may change only the case, keeping the slug', () => {
  const { after } = assertEdit(renameEntry, small(), ['cartridge', 'Cartridge'], { touched: ['cartridge'], retargets: true })
  assert.equal(find(after, 'cartouche').mentions[0].note, 'A doublet of [[same-root:Cartridge]]; both from Italian [[from:cartuccia]].')
})

test('renameEntry refuses a slug that is taken, and an empty term', () => {
  assertRefused((d) => renameEntry(d, 'bath', 'Bat'), small(), 'slug-duplicate')
  assertRefused((d) => renameEntry(d, 'bath', ''), small(), 'entry-field')
})
