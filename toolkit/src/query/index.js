// Lookups over the whole dataset, built once and shared by every query.

import { parseNote } from '../model/links.js'
import { slugify } from '../model/slugs.js'
import { linkIndex, resolveLink } from './links.js'
import { searchEngine } from './search.js'

const push = (map, key, value) => {
  if (!map.has(key)) map.set(key, [])
  map.get(key).push(value)
}

/**
 * The indexes over `data` ({ entries, episodes }). Lists keep the order of data.entries. The data
 * isn't changed: parsed notes are kept in the index, by mention.
 */
export function buildIndex(data) {
  const links = linkIndex(data.entries)
  const byEpisode = new Map(data.episodes.map((ep) => [ep.id, []]))
  const byTerm = new Map() // slug of a term -> entries spelt that way
  const notes = new Map() // mention -> note parts, links with the slug they resolve to (or null)
  const linkedFrom = new Map() // slug -> entries whose notes link to it
  for (const entry of data.entries) {
    push(byTerm, slugify(entry.term), entry)
    for (const mention of entry.mentions) {
      byEpisode.get(mention.episode_id)?.push({ entry, mention })
      const parts = parseNote(mention.note).map((part) =>
        typeof part === 'string' ? part : { ...part, slug: resolveLink(links, part.target, entry.slug) },
      )
      notes.set(mention, parts)
      for (const part of parts) {
        if (typeof part === 'string' || !part.slug) continue
        const from = linkedFrom.get(part.slug)
        if (from?.at(-1) !== entry) push(linkedFrom, part.slug, entry)
      }
    }
  }
  for (const list of byEpisode.values()) list.sort((a, b) => a.mention.t - b.mention.t)
  return {
    data,
    links,
    episodeById: new Map(data.episodes.map((ep) => [ep.id, ep])),
    byEpisode,
    byTerm,
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
 * A mention's note as parts: strings, and links as { type, uncertain, target, text, slug }, where
 * slug is the entry the link resolves to, or null.
 */
export const noteParts = (index, mention) => index.notes.get(mention) ?? []

/** The entries whose notes link to this one ("Linked from"). */
export const backlinks = (index, slug) => index.linkedFrom.get(slug) ?? []

/** The entries spelt like `spelling`, glossed or not ("meal" -> meal (flour), meal (repast)). */
export const homographs = (index, spelling) => index.byTerm.get(slugify(spelling)) ?? []
