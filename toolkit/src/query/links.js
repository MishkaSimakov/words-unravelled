// Resolving link targets to entries.

import { slugify } from '../model/slugs.js'

/** The lookups resolveLink() needs, built once from all entries. */
export function linkIndex(entries) {
  const bySlug = new Map()
  const byOriginal = new Map() // slug of an original form -> entries with it
  for (const entry of entries) {
    bySlug.set(entry.slug, entry)
    if (!entry.original) continue
    const key = slugify(entry.original)
    if (!byOriginal.has(key)) byOriginal.set(key, [])
    byOriginal.get(key).push(entry)
  }
  return { bySlug, byOriginal }
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
