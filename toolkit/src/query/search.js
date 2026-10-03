// Search over entries' names, as on the site.

import Fuse from 'fuse.js'
import { fold } from '../model/slugs.js'
import { episodeCounts } from './entries.js'

const OPTIONS = {
  keys: [
    { name: 'term', weight: 3 },
    { name: 'gloss', weight: 0.5 },
    { name: 'original', weight: 1.5 },
    { name: 'translation', weight: 1 },
  ],
  threshold: 0.34,
  ignoreLocation: true,
  ignoreDiacritics: true,
  includeScore: true,
}

/** The Fuse.js instance buildIndex() keeps; entries that score the same keep this order. */
export const searchEngine = (entries) => new Fuse(entries, OPTIONS)

/**
 * The entries matching `query`, best first. Fuse ranks by fuzziness only; exact and prefix
 * matches of the term come first, and within each tier, entries that are only ever mentioned
 * come after those that are discussed.
 */
export function search(index, query) {
  const q = fold(query.trim())
  const tier = (e) => {
    const t = fold(e.term)
    return t === q ? 0 : t.startsWith(q) ? 1 : 2
  }
  return index.fuse
    .search(query.trim())
    .map((r) => ({ entry: r.item, score: r.score, tier: tier(r.item), mentionOnly: episodeCounts(r.item).discussed === 0 }))
    .sort((a, b) => a.tier - b.tier || a.mentionOnly - b.mentionOnly || a.score - b.score)
    .map((r) => r.entry)
}
