// Errors and warnings about links in notes.

import { LINK_TYPES, malformedLinks, parseNote, targetTerm } from '../model/links.js'
import { entryName } from '../model/schema.js'
import { slugify } from '../model/slugs.js'
import { addTo } from '../query/groups.js'
import { linkIndex, resolveLink } from '../query/links.js'
import { problem } from './codes.js'
import { pluralKey, spellingLimit, variantKey, withinDistance } from './duplicates.js'

const names = (entries) => entries.map(entryName).join(', ')

/** Errors in links, and with `warnings`, targets close to an entry that resolve to nothing. */
export function linkProblems(entries, { warnings = true } = {}) {
  const index = linkIndex(entries)
  const close = warnings ? closeEntries(entries, index.byTerm) : null

  const found = []
  for (const entry of entries) {
    for (const m of entry.mentions) {
      const at = `${entry.slug} in ${m.episode_id}`
      const where = (detail) => ({ mention: { slug: entry.slug, episode_id: m.episode_id }, detail })
      const add = (code, message, detail) => found.push(problem(code, `${at}: ${message}`, [entry.slug], where(detail)))

      for (const raw of malformedLinks(m.note)) add('link-malformed', `malformed link markup ${raw}.`, raw)
      for (const part of parseNote(m.note)) {
        if (typeof part === 'string') continue
        const { target } = part
        if (!LINK_TYPES.includes(part.type)) {
          add('link-type-unknown', `unknown link type "${part.type}" in [[${part.type}:${target}]].`, target)
          continue
        }
        if (resolveLink(index, target, entry.slug)) continue
        const slug = slugify(target)
        if (index.bySlug.has(slug)) {
          // Names the entry itself: resolves to nothing.
          if (close) add('link-unresolved-close', `the link to "${target}" names this entry itself, so it links nowhere.`, target)
          continue
        }
        const originals = (index.byOriginal.get(slug) ?? []).filter((e) => e !== entry)
        if (originals.length > 1) {
          add('link-ambiguous', `the link to "${target}" matches the original forms of ${names(originals)}.`, target)
          continue
        }
        const glossed = (index.byTerm.get(slug) ?? []).filter((e) => e !== entry && e.gloss)
        if (targetTerm(target) === target && glossed.length) {
          add('link-needs-gloss', `the link to "${target}" needs a gloss: ${names(glossed)}.`, target)
          continue
        }
        const near = close?.(target)
        if (near?.length) add('link-unresolved-close', `the link to "${target}" resolves to nothing, but is close to ${names(near)}.`, target)
      }
    }
  }
  return found
}

/**
 * A function from a link target to the entries it is close to: the same term with another or
 * no gloss, or the same name up to an article, spacing, hyphens, a plural ending or a spelling
 * variant.
 */
function closeEntries(entries, byTerm) {
  const byKey = new Map()
  const byLetter = new Map()
  for (const e of entries) {
    const key = variantKey(e.slug)
    addTo(byKey, key, e)
    if (pluralKey(e.slug) !== key) addTo(byKey, pluralKey(e.slug), e)
    if (key.length >= 5) addTo(byLetter, key[0], e)
  }
  return (target) => {
    const sameTerm = byTerm.get(slugify(targetTerm(target)))
    if (sameTerm) return sameTerm
    const slug = slugify(target)
    const near = [...new Set([...(byKey.get(variantKey(slug)) ?? []), ...(byKey.get(pluralKey(slug)) ?? [])])]
    if (near.length) return near
    const key = variantKey(slug)
    return (byLetter.get(key[0]) ?? []).filter((e) => {
      const other = variantKey(e.slug)
      const limit = spellingLimit(key, other)
      return limit !== null && withinDistance(key, other, limit)
    })
  }
}
