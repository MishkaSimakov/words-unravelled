// Errors in slugs.

import { entrySlug } from '../model/slugs.js'
import { problem } from './codes.js'

export function slugProblems(entries) {
  const found = []
  const count = new Map()
  for (const entry of entries) {
    count.set(entry.slug, (count.get(entry.slug) ?? 0) + 1)
    const expected = entrySlug(entry.term, entry.gloss)
    if (entry.slug !== expected) {
      found.push(problem('slug-mismatch', `${entry.slug}: the slug of its term and gloss is ${expected}.`, [entry.slug], { detail: expected }))
    }
  }
  for (const [slug, n] of count) {
    if (n > 1) found.push(problem('slug-duplicate', `${n} entries have the slug ${slug}.`, [slug]))
  }
  return found
}
