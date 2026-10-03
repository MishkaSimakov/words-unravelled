// Checks on the real dataset, data/entries.json.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { entrySlug } from '../src/model/slugs.js'
import { LINK_TYPES, parseNote } from '../src/model/links.js'

const entries = JSON.parse(readFileSync(new URL('../../data/entries.json', import.meta.url), 'utf8'))

test('every slug is the slug of its term and gloss', () => {
  const wrong = entries.filter((e) => e.slug !== entrySlug(e.term, e.gloss)).map((e) => e.slug)
  assert.deepEqual(wrong, [])
})

test('every note has only well-formed links of known types', () => {
  const wrong = []
  for (const e of entries) {
    for (const m of e.mentions) {
      for (const part of parseNote(m.note)) {
        const bad = typeof part === 'string' ? /\[\[|\]\]/.test(part) : !LINK_TYPES.includes(part.type)
        if (bad) wrong.push(`${e.slug} ${m.episode_id}: ${m.note}`)
      }
    }
  }
  assert.deepEqual(wrong, [])
})
