// Edits to an entry's name, the term and gloss its slug is made of. Links that name the entry
// are rewritten to name it again.

import { linkResolutions } from '../checks/invariants.js'
import { targetTerm } from '../model/links.js'
import { ENTRY_KEYS, entryName, ordered } from '../model/schema.js'
import { entrySlug, slugify } from '../model/slugs.js'
import { commit, findEntry, sortEntries } from './commit.js'
import { refuse } from './errors.js'
import { retarget } from './links.js'

/**
 * `data` with the entry `slug` renamed to `renamed`, and every link whose target was the old
 * slug given newTarget(link), committed. Refused if the new name takes a link that resolved to another
 * entry: a slug outranks an original form, so naming an entry "felis" would take
 * [[from:felis]] from the entry whose original form it is. Links that resolved to nothing may
 * start resolving to the renamed entry.
 */
function rename(data, slug, renamed, newTarget) {
  const entries = data.entries.map((e) => (e.slug === slug ? renamed : e))
  const after = commit(data, { ...data, entries: sortEntries(retarget(entries, (link) => slugify(link.target) === slug, newTarget)) })
  const now = linkResolutions(after)
  const taken = []
  for (const [key, was] of linkResolutions(data)) {
    const [owner, episode, n] = key.split('|')
    const newKey = `${owner === slug ? renamed.slug : owner}|${episode}|${n}`
    if (was && was !== slug && now.get(newKey) !== was) taken.push(`${owner} in ${episode}`)
  }
  if (taken.length) {
    refuse('link-taken', `Renaming ${slug} to ${renamed.slug} would take links that resolve to other entries, in ${taken.join(', ')}.`, [slug], {
      detail: renamed.slug,
    })
  }
  return after
}

/**
 * Sets an entry's gloss (null removes it) and so its slug. Every link that named the entry,
 * its own notes included, gets the new gloss and keeps the text it shows: [[see:meal]]s
 * becomes [[see:meal (flour)]]s.
 */
export function setGloss(data, slug, gloss) {
  const entry = findEntry(data, slug)
  const renamed = ordered(ENTRY_KEYS, { ...entry, gloss, slug: entrySlug(entry.term, gloss) })
  const newTarget = (link) => {
    const kept = gloss ? `${targetTerm(link.target)} (${gloss})` : targetTerm(link.target)
    return slugify(kept) === renamed.slug ? kept : entryName(renamed)
  }
  return rename(data, slug, renamed, newTarget)
}

/** Changes an entry's term and so its slug. Every link that named the entry names the new term (and the gloss). */
export function renameEntry(data, slug, term) {
  const entry = findEntry(data, slug)
  const renamed = ordered(ENTRY_KEYS, { ...entry, term, slug: entrySlug(term, entry.gloss) })
  return rename(data, slug, renamed, () => entryName(renamed))
}
