// Merging one entry into another.

import { entryName } from '../model/schema.js'
import { linkIndex, resolveLink } from '../query/links.js'
import { commit, findEntry, sortMentions } from './commit.js'
import { refuse } from './errors.js'
import { retarget } from './links.js'

/**
 * Moves the mentions of `from` to `into` and deletes `from`; `into` keeps its own fields. Links
 * that resolved to `from` (by its name or its original form) name `into`. Refused if both
 * entries have a mention in the same episode: delete one of the two first.
 */
export function mergeEntries(data, from, into) {
  if (from === into) refuse('merge-self', `${from} can't be merged into itself.`, [String(from)])
  findEntry(data, from)
  const target = findEntry(data, into)
  const index = linkIndex(data.entries)
  const entries = retarget(data.entries, (link, owner) => resolveLink(index, link.target, owner.slug) === from, () => entryName(target))
  const moved = entries.find((e) => e.slug === from).mentions
  const merged = entries
    .filter((e) => e.slug !== from)
    .map((e) => (e.slug === into ? { ...e, mentions: sortMentions(data, [...e.mentions, ...moved]) } : e))
  return commit(data, { ...data, entries: merged })
}
