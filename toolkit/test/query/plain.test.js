import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildIndex } from '../../src/query/index.js'
import { linkTargets, missingLinks, plainMentions, termFinder } from '../../src/query/plain.js'
import { data, entry, mention } from '../fixtures/data.js'

const sample = () =>
  data([
    entry('ounce', { original: 'uncia', language: 'Latin' }, mention('ep-a', 1, 'An ounce, from uncia.')),
    entry('inch', {}, mention('ep-a', 2, 'A twelfth, like the [[see:ounce]]s; twelve ounces is a troy pound.')),
    entry('troy', {}, mention('ep-a', 3, 'From Troyes, the fair where the Uncia was weighed.')),
    entry('bounce', {}, mention('ep-a', 4, 'Unrelated to anything here.')),
    entry('pound', {}, mention('ep-b', 5, 'A weight; [[see:ounce]] is a part of it.')),
  ])

const found = (d, slug, options) => plainMentions(buildIndex(d), slug, options).map(({ entry, mention }) => `${entry.slug}@${mention.t}`)

test('plainMentions finds the term with an inflection, and the original form, outside links', () => {
  assert.deepEqual(found(sample(), 'ounce'), ['inch@2', 'troy@3'])
})

test('plainMentions ignores links, the entry itself and words that only contain the term', () => {
  // pound links to ounce without naming it in text; bounce contains "ounce"; ounce names itself.
  assert.ok(!found(sample(), 'ounce').some((s) => /^(pound|bounce|ounce)@/.test(s)))
})

test('plainMentions matches several words as a run', () => {
  const d = data([
    entry('break a leg', {}, mention('ep-a', 1, 'Good luck.')),
    entry('luck', {}, mention('ep-a', 2, 'Actors say "Break a leg!" instead.')),
    entry('leg', {}, mention('ep-a', 3, 'Break the leg, not a leg.')),
  ])
  assert.deepEqual(found(d, 'break-a-leg'), ['luck@2'])
})

test('plainMentions stops at the limit, and knows no unknown slug', () => {
  assert.deepEqual(found(sample(), 'ounce', { limit: 1 }), ['inch@2'])
  assert.deepEqual(found(sample(), 'unicorn'), [])
})

const named = (entries, note) => termFinder(entries)(note).map((p) => [p.entry.term, note.slice(p.start, p.stem), note.slice(p.start, p.end)])

test('termFinder finds whole words without case or accents, with an inflection on the last word', () => {
  const egg = entry('eggcorn', {}, mention('ep-a', 1, '.'))
  assert.deepEqual(named([egg], 'Eggcorns, an eggcorned spelling; not eggcornish.'), [
    ['eggcorn', 'Eggcorn', 'Eggcorns'],
    ['eggcorn', 'eggcorn', 'eggcorned'],
  ])
  assert.deepEqual(named([entry('café', {}, mention('ep-a', 1, '.'))], 'A CAFE.'), [['café', 'CAFE', 'CAFE']])
})

test('termFinder matches several words across spaces and hyphens, not across punctuation', () => {
  const folk = entry('folk etymology', {}, mention('ep-a', 1, '.'))
  assert.deepEqual(named([folk], 'A folk-etymology; folk etymologies; a folk. Etymology.'), [
    ['folk etymology', 'folk-etymology', 'folk-etymology'],
  ])
})

test('termFinder skips links and their trails, and drops a match inside a longer one', () => {
  const slang = entry('slang', {}, mention('ep-a', 1, '.'))
  const rhyming = entry('rhyming slang', {}, mention('ep-a', 1, '.'))
  assert.deepEqual(named([slang, rhyming], 'In [[see:slang]] and [[see:back]]slang: rhyming slang, slang.'), [
    ['rhyming slang', 'rhyming slang', 'rhyming slang'],
    ['slang', 'slang', 'slang'],
  ])
})

test('termFinder keeps indices right after characters that fold to another length', () => {
  const note = '😀 Ælf eggcorn'
  const [p] = termFinder([entry('eggcorn', {}, mention('ep-a', 1, '.'))])(note)
  assert.equal(note.slice(p.start, p.end), 'eggcorn')
})

const about = (term, fields = {}, note = 'A term.') => entry(term, { category: 'about-language', ...fields }, mention('ep-a', 1, note))

test('linkTargets are terms about language, but not languages or very short terms', () => {
  const d = data([about('eggcorn'), about('Latin'), about('/s'), entry('liquid', {}, mention('ep-a', 2, '.')), entry('vinum', { language: 'Latin' }, mention('ep-a', 3, '.'))])
  assert.deepEqual(linkTargets(d.entries).map((e) => e.slug), ['eggcorn'])
})

const missing = (entries) => missingLinks(data(entries).entries).map((m) => [m.entry.slug, m.target.slug, m.text, m.note])

test('missingLinks makes the first naming in each note a see link that reads the same', () => {
  assert.deepEqual(
    missing([
      about('eggcorn'),
      about('collective noun'),
      entry('bait', {}, mention('ep-a', 2, 'The Eggcorned spelling; eggcorns everywhere.')),
      entry('pride', {}, mention('ep-a', 3, 'Two collective nouns: an eggcorn, too.')),
    ]),
    [
      ['bait', 'eggcorn', 'Eggcorned', 'The [[see:Eggcorn]]ed spelling; eggcorns everywhere.'],
      ['pride', 'collective-noun', 'collective nouns', 'Two [[see:collective noun]]s: an eggcorn, too.'],
      ['pride', 'eggcorn', 'eggcorn', 'Two collective nouns: an [[see:eggcorn]], too.'],
    ],
  )
})

test('missingLinks skips notes that link the target already, and the entry\'s own notes', () => {
  assert.deepEqual(
    missing([
      about('eggcorn', {}, 'An eggcorn is a misheard phrase.'),
      entry('bait', {}, mention('ep-a', 2, 'An [[see:eggcorn]]; the eggcorn again.')),
      entry('baste ball', {}, mention('ep-a', 3, 'Not [[see:eggcorns (misheard)]], an eggcorn.')),
    ]).map(([slug]) => slug),
    ['baste-ball'],
  )
})

test('missingLinks names a glossed target with its gloss, and by its name when the words resolve elsewhere', () => {
  const d = [
    about('cant', { gloss: 'jargon' }),
    about('Castilian', { original: 'castellano' }),
    entry('castellano', { language: 'Spanish' }, mention('ep-a', 2, 'A word.')),
    entry('rogue', {}, mention('ep-a', 3, 'In thieves\' cant; called castellano there.')),
  ]
  assert.deepEqual(
    missing(d).map((m) => m[3]),
    ["In thieves' [[see:cant (jargon)]]; called castellano there.", "In thieves' cant; called [[see:Castilian]] there."],
  )
})
