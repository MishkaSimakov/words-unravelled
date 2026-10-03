import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseNote } from '../../src/model/links.js'

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
