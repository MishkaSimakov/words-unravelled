// Merging one entry into another.

import { entryName } from '../model/schema.js'
import { linkIndex, resolveLink } from '../query/links.js'
import { commit, findEntry, sortMentions } from './commit.js'
import { refuse } from './errors.js'
import { retarget } from './links.js'

const SIDES = ['from', 'into']

/**
 * Moves the mentions of `from` to `into` and deletes `from`; `into` keeps its own fields. Links
 * that resolved to `from` (by its name or its original form) name `into`. Where both entries
 * have a mention in one episode, `keep` ({ episode id: 'from' | 'into' }) says whose mention
 * stays; the other is dropped with its note. A clash that `keep` doesn't settle is refused.
 */
export function mergeEntries(data, from, into, { keep = {} } = {}) {
  if (from === into) refuse('merge-self', `${from} can't be merged into itself.`, [String(from)])
  const source = findEntry(data, from)
  const target = findEntry(data, into)
  const clashes = new Set(source.mentions.filter((m) => target.mentions.some((n) => n.episode_id === m.episode_id)).map((m) => m.episode_id))
  const kept = new Map(Object.entries(keep ?? {}))
  const invalid = [...kept].filter(([episode, side]) => !clashes.has(episode) || !SIDES.includes(side)).map(([episode]) => episode)
  if (invalid.length) {
    refuse('merge-keep-invalid', `keep names episodes where ${from} and ${into} don't both have a mention, or a side other than from or into: ${invalid.join(', ')}.`, [from, into], {
      detail: invalid.join(','),
    })
  }
  // Whether a mention of `side` stays: unless keep chose the other side's in its episode.
  const stays = (side) => (m) => !kept.has(m.episode_id) || kept.get(m.episode_id) === side

  const index = linkIndex(data.entries)
  const entries = retarget(data.entries, (link, owner) => resolveLink(index, link.target, owner.slug) === from, () => entryName(target))
  const moved = entries.find((e) => e.slug === from).mentions.filter(stays('from'))
  const merged = entries
    .filter((e) => e.slug !== from)
    .map((e) => (e.slug === into ? { ...e, mentions: sortMentions(data, [...e.mentions.filter(stays('into')), ...moved]) } : e))
  return commit(data, { ...data, entries: merged })
}
