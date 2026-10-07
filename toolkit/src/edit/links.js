// Rewriting the links that name an entry, for edits that change its name or merge it away.

import { rewriteLinks } from '../model/links.js'

/**
 * The entries with link targets rewritten: every link for which match(link, owner) holds gets
 * the target newTarget(link). Entries and mentions without such links stay the same objects.
 */
export function retarget(entries, match, newTarget) {
  return entries.map((entry) => {
    let changed = false
    const mentions = entry.mentions.map((m) => {
      const note = rewriteLinks(m.note, (link) => (match(link, entry) ? newTarget(link) : null))
      if (note === m.note) return m
      changed = true
      return { ...m, note }
    })
    return changed ? { ...entry, mentions } : entry
  })
}
