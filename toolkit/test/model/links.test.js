import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatLink, malformedLinks, parseNote, plainSpans, rewriteLinks } from '../../src/model/links.js'

const link = (type, target, text, uncertain = false) => ({ type, uncertain, target, text })

test('parseNote splits a note into text and links', () => {
  assert.deepEqual(parseNote('A doublet of [[same-root:cartouche]]; both from Italian.'), [
    'A doublet of ',
    link('same-root', 'cartouche', 'cartouche'),
    '; both from Italian.',
  ])
})

test('parseNote reads a "?" after the type as uncertain', () => {
  assert.deepEqual(parseNote('[[from?:shesep ankh]]'), [link('from', 'shesep ankh', 'shesep ankh', true)])
})

test('letters straight after a link are part of its text', () => {
  assert.deepEqual(parseNote('Sixteen [[see:ounce]]s, or [[see:pound]].'), [
    'Sixteen ',
    link('see', 'ounce', 'ounces'),
    ', or ',
    link('see', 'pound', 'pound'),
    '.',
  ])
  assert.deepEqual(parseNote('[[see:café]]é'), [link('see', 'café', 'caféé')])
})

test('a link to a glossed entry shows only the term', () => {
  assert.deepEqual(parseNote('Like [[same-root:meal (flour)]]s.'), [
    'Like ',
    link('same-root', 'meal (flour)', 'meals'),
    '.',
  ])
})

test('malformed links become plain text', () => {
  assert.deepEqual(parseNote('An [[untyped]] link'), ['An untyped link'])
  assert.deepEqual(parseNote('An [[see:target|alias]] link'), ['An alias link'])
  assert.deepEqual(parseNote('No [[see: ]] target'), ['No see: target'])
})

test('a note without links is one part, and an empty note none', () => {
  assert.deepEqual(parseNote('Plain.'), ['Plain.'])
  assert.deepEqual(parseNote(''), [])
  assert.deepEqual(parseNote(null), [])
})

test('formatLink writes link markup, with "?" when uncertain', () => {
  assert.equal(formatLink({ type: 'see', target: 'ounce' }), '[[see:ounce]]')
  assert.equal(formatLink({ type: 'from', uncertain: true, target: 'meal (flour)' }), '[[from?:meal (flour)]]')
})

test('rewriteLinks replaces targets and keeps everything else as written', () => {
  const note = 'Like [[see:ounce]]s and [[from?:meal]], not [[untyped]] or [[see:x|y]]; [[see:pound]].'
  assert.equal(
    rewriteLinks(note, ({ target }) => (target === 'ounce' ? 'inch' : target === 'meal' ? 'meal (flour)' : null)),
    'Like [[see:inch]]s and [[from?:meal (flour)]], not [[untyped]] or [[see:x|y]]; [[see:pound]].',
  )
})

test('rewriteLinks passes type and certainty, and keeps a note without links', () => {
  const seen = []
  rewriteLinks('[[gave?:a]] [[same-root:b]]', (link) => void seen.push(link))
  assert.deepEqual(seen, [
    { type: 'gave', uncertain: true, target: 'a' },
    { type: 'same-root', uncertain: false, target: 'b' },
  ])
  assert.equal(rewriteLinks('Plain.', () => 'x'), 'Plain.')
})

test('malformedLinks finds links without a type or target, aliases and stray brackets', () => {
  assert.deepEqual(malformedLinks('An [[untyped]] link, [[see:x|alias]], [[see: ]], a ]] and a [[ stray'), [
    '[[untyped]]',
    '[[see:x|alias]]',
    '[[see: ]]',
    ']]',
    '[[',
  ])
})

test('malformedLinks accepts well-formed links, whatever their type', () => {
  assert.deepEqual(malformedLinks('[[see:ounce]]s and [[nonsense:x]]'), [])
  assert.deepEqual(malformedLinks(''), [])
})

test('plainSpans leaves out link markup and trails, malformed links included', () => {
  const note = 'Like [[see:ounce]]s and [[broken]], then text.'
  assert.deepEqual(plainSpans(note).map(([a, b]) => note.slice(a, b)), ['Like ', ' and ', ', then text.'])
  assert.deepEqual(plainSpans('[[see:ounce]]'), [])
  assert.deepEqual(plainSpans(''), [])
})
