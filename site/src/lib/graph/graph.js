// The link graph the site's graph page draws: entries joined by the links in their notes.

import { noteParts } from '#toolkit/query/index.js'

/**
 * Link types the graph leaves out. "See" links are most of the links but the loosest: they would
 * tie most entries into one tangle.
 */
const IGNORED_LINK_TYPES = new Set(['see'])

/**
 * The graph over the index's entries: { entries, edges, neighbors }. An edge { a, b, types } joins
 * two entries when a note of one links to the other, whichever way and however often; types holds
 * every link type between them. Entries without edges are left out; entries keep data order.
 */
export function linkGraph(index) {
  const neighbors = new Map() // entry -> Set of entries
  const edges = []
  const byKey = new Map()
  for (const entry of index.data.entries) {
    for (const mention of entry.mentions) {
      for (const part of noteParts(index, mention)) {
        // A link resolves to another entry or to nothing (slug null), never to its own entry.
        if (typeof part === 'string' || !part.slug || IGNORED_LINK_TYPES.has(part.type)) continue
        const other = index.links.bySlug.get(part.slug)
        const [a, b] = entry.slug < other.slug ? [entry, other] : [other, entry]
        const key = `${a.slug}\n${b.slug}`
        let edge = byKey.get(key)
        if (!edge) {
          edge = { a, b, types: new Set() }
          byKey.set(key, edge)
          edges.push(edge)
          for (const [x, y] of [[a, b], [b, a]]) {
            if (!neighbors.has(x)) neighbors.set(x, new Set())
            neighbors.get(x).add(y)
          }
        }
        edge.types.add(part.type)
      }
    }
  }
  return { entries: index.data.entries.filter((e) => neighbors.has(e)), edges, neighbors }
}
