import { test } from 'node:test'
import assert from 'node:assert/strict'
import { linkGraph } from '#lib/graph/graph.js'
import { buildIndex } from '#toolkit/query/index.js'

const entry = (slug, ...notes) => ({
  slug, term: slug, original: null, translation: null, language: 'English', category: 'word',
  mentions: notes.map((note, t) => ({ episode_id: 'ep', t, role: 'subject', note, confidence: 'high' })),
})
const graphOf = (...entries) => linkGraph(buildIndex({ entries, episodes: [{ id: 'ep', title: 'Ep', date: '2026-01-01' }] }))
const slugs = (list) => [...list].map((e) => e.slug)

test('an edge joins two entries however often and whichever way they link, with every type', () => {
  const g = graphOf(entry('a', '[[from:b]] and [[same-root:b]]'), entry('b', '[[gave:a]]'))
  assert.equal(g.edges.length, 1)
  assert.deepEqual(slugs([g.edges[0].a, g.edges[0].b]), ['a', 'b'])
  assert.deepEqual([...g.edges[0].types].sort(), ['from', 'gave', 'same-root'])
  assert.deepEqual(slugs(g.neighbors.get(g.entries[0])), ['b'])
})

test('see links, links to no entry and links to themselves are left out, and so are entries without edges', () => {
  const g = graphOf(entry('a', '[[see:b]] [[from:nowhere]] [[from:a]]'), entry('b'), entry('c', '[[unrelated:d]]'), entry('d'))
  assert.deepEqual(slugs(g.entries), ['c', 'd'])
  assert.deepEqual([...g.edges[0].types], ['unrelated'])
})
