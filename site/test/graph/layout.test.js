import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LINK, components, galaxyLayout, stressLayout } from '#lib/graph/layout.js'

/** A link graph like linkGraph() makes, from [a, b] slug pairs. */
function graphOf(pairs) {
  const bySlug = new Map()
  const node = (slug) => bySlug.get(slug) ?? bySlug.set(slug, { slug }).get(slug)
  const neighbors = new Map()
  for (const [a, b] of pairs) {
    for (const [x, y] of [[node(a), node(b)], [node(b), node(a)]]) {
      if (!neighbors.has(x)) neighbors.set(x, new Set())
      neighbors.get(x).add(y)
    }
  }
  return { entries: [...bySlug.values()], neighbors }
}
const dist = ([x1, y1], [x2, y2]) => Math.hypot(x1 - x2, y1 - y2)

test('components come largest first', () => {
  assert.deepEqual(components([[4], [2], [1, 3], [2], [0]]), [[1, 2, 3], [0, 4]])
})

test('a path is drawn with steps of one link', () => {
  const X = stressLayout([[1], [0, 2], [1, 3], [2]], [0, 1, 2, 3], Math.random)
  for (let i = 0; i < 3; i++) assert.ok(Math.abs(dist(X[i], X[i + 1]) - LINK) < LINK * 0.05)
  assert.ok(Math.abs(dist(X[0], X[3]) - 3 * LINK) < LINK * 0.15)
})

test('entries with the same links are kept apart', () => {
  // month and moon both link to the same five entries and to each other.
  const others = ['a', 'b', 'c', 'd', 'e']
  const g = graphOf([['month', 'moon'], ...others.flatMap((o) => [['month', o], ['moon', o]])])
  const layout = galaxyLayout(g)
  assert.ok(dist(layout.get('month'), layout.get('moon')) >= 19)
})

test('every entry is placed, and islands keep clear of the core and of each other', () => {
  // A core (a star of 12) and fourteen islands: pairs and triangles.
  const pairs = Array.from({ length: 12 }, (_, i) => ['hub', `leaf${i}`])
  for (let k = 0; k < 8; k++) pairs.push([`p${k}a`, `p${k}b`])
  for (let k = 0; k < 6; k++) pairs.push([`t${k}a`, `t${k}b`], [`t${k}b`, `t${k}c`], [`t${k}c`, `t${k}a`])
  const g = graphOf(pairs)
  const layout = galaxyLayout(g)
  assert.deepEqual([...layout.keys()].sort(), g.entries.map((e) => e.slug).sort())
  const core = ['hub', ...Array.from({ length: 12 }, (_, i) => `leaf${i}`)].map((s) => layout.get(s))
  const islands = [
    ...Array.from({ length: 8 }, (_, k) => [`p${k}a`, `p${k}b`]),
    ...Array.from({ length: 6 }, (_, k) => [`t${k}a`, `t${k}b`, `t${k}c`]),
  ].map((members) => {
    const P = members.map((s) => layout.get(s))
    const c = [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length]
    return { c, r: Math.max(...P.map((p) => dist(p, c))) }
  })
  islands.forEach(({ c, r }, k) => {
    assert.ok(Math.min(...core.map((p) => dist(p, c))) > r, `island ${k} clear of the core`)
    for (const other of islands.slice(k + 1)) assert.ok(dist(c, other.c) > r + other.r, `island ${k} clear of the others`)
  })
})

test('the same graph gives the same layout', () => {
  const pairs = [['a', 'b'], ['b', 'c'], ['d', 'e'], ['f', 'a']]
  assert.deepEqual(galaxyLayout(graphOf(pairs)), galaxyLayout(graphOf(pairs)))
})
