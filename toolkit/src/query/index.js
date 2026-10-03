// Lookups over the whole dataset, built once and shared by every query.

import { parseNote } from '../model/links.js'
import { slugify } from '../model/slugs.js'
import { addTo } from './groups.js'
import { linkIndex, resolveLink } from './links.js'
import { searchEngine } from './search.js'

/**
 * The indexes over `data` ({ entries, episodes }). Lists keep the order of data.entries. The data
 * isn't changed: parsed notes and counts are kept in the index.
 */
export function buildIndex(data) {
  const links = linkIndex(data.entries)
  const byEpisode = new Map(data.episodes.map((ep) => [ep.id, []]))
  const counts = new Map() // entry -> { discussed, all }
  const notes = new Map() // mention -> note parts, links with the slug they resolve to (or null)
  const linkedFrom = new Map() // slug -> entries whose notes link to it
  for (const entry of data.entries) {
    const episodes = (mentions) => new Set(mentions.map((m) => m.episode_id)).size
    counts.set(entry, { discussed: episodes(entry.mentions.filter((m) => m.role !== 'mention')), all: episodes(entry.mentions) })
    for (const mention of entry.mentions) {
      byEpisode.get(mention.episode_id)?.push({ entry, mention })
      const parts = parseNote(mention.note).map((part) =>
        typeof part === 'string' ? part : { ...part, slug: resolveLink(links, part.target, entry.slug) },
      )
      notes.set(mention, parts)
      for (const part of parts) {
        if (typeof part === 'string' || !part.slug) continue
        if (linkedFrom.get(part.slug)?.at(-1) !== entry) addTo(linkedFrom, part.slug, entry)
      }
    }
  }
  for (const list of byEpisode.values()) list.sort((a, b) => a.mention.t - b.mention.t)
  return {
    data,
    links,
    episodeById: new Map(data.episodes.map((ep) => [ep.id, ep])),
    byEpisode,
    counts,
    notes,
    linkedFrom,
    fuse: searchEngine(data.entries),
  }
}

/** The entry with this slug, or null. */
export const entry = (index, slug) => index.links.bySlug.get(slug) ?? null

/** The episode with this id, or null. */
export const episode = (index, id) => index.episodeById.get(id) ?? null

/** An episode's mentions as [{ entry, mention }], in timestamp order. */
export const episodeMentions = (index, id) => index.byEpisode.get(id) ?? []

/**
 * How many episodes an entry appears in: `discussed` counts those that discuss it (role subject
 * or aside), `all` also those that only point to it ("as we discussed in...").
 */
export const episodeCounts = (index, entry) => index.counts.get(entry)

/**
 * A mention's note as parts: strings, and links as { type, uncertain, target, text, slug }, where
 * slug is the entry the link resolves to, or null.
 */
export const noteParts = (index, mention) => index.notes.get(mention) ?? []

/** The entries whose notes link to this one ("Linked from"). */
export const backlinks = (index, slug) => index.linkedFrom.get(slug) ?? []

/** The entries spelt like `spelling`, glossed or not ("meal" -> meal (flour), meal (repast)). */
export const homographs = (index, spelling) => index.links.byTerm.get(slugify(spelling)) ?? []
