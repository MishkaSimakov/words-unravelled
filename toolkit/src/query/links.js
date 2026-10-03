// Resolving link targets to entries.

import { slugify } from '../model/slugs.js'
import { groupBy } from './groups.js'

/** The lookups resolveLink() and the link checks need, built once from all entries. */
export function linkIndex(entries) {
  return {
    bySlug: new Map(entries.map((e) => [e.slug, e])),
    byOriginal: groupBy(entries.filter((e) => e.original), (e) => slugify(e.original)), // slug of an original form -> entries with it
    byTerm: groupBy(entries, (e) => slugify(e.term)), // slug of a term -> entries spelt that way, glossed or not
  }
}

/**
 * The slug of the entry a link target names, or null: the entry whose slug is the target's slug
 * (term, plus the gloss if given), else the one entry whose original form has that slug. A link
 * never resolves to its own entry, and a target that several original forms match resolves to
 * nothing.
 */
export function resolveLink(index, target, ownSlug = null) {
  const slug = slugify(target)
  if (index.bySlug.has(slug)) return slug === ownSlug ? null : slug
  const matches = (index.byOriginal.get(slug) ?? []).filter((e) => e.slug !== ownSlug)
  return matches.length === 1 ? matches[0].slug : null
}
