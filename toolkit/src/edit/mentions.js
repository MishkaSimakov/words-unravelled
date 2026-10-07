// Edits to mentions, including the replacement of a whole episode's mentions.
//
// A mention item is { slug, t, role, note, confidence } for an existing entry, or
// { entry: { term, gloss?, original, translation, language, category }, t, role, note,
// confidence } for a new one, whose slug is derived from its term and gloss.

import { entrySlug } from '../model/slugs.js'
import { ENTRY_FIELDS, ENTRY_KEYS, MENTION_KEYS, ordered } from '../model/schema.js'
import { commit, findEntry, findEpisode, onlyFields, replaceEntry, sortEntries, sortMentions } from './commit.js'
import { refuse } from './errors.js'

const MENTION_FIELDS = MENTION_KEYS.filter((k) => k !== 'episode_id')

/** The mention an item describes, in `episodeId`. */
function itemMention(item, episodeId) {
  onlyFields(item, ['slug', 'entry', ...MENTION_FIELDS], 'A mention item')
  if ('slug' in item && 'entry' in item) refuse('field-not-settable', 'A mention item gives either a slug or a new entry, not both.', [String(item.slug)], { detail: 'slug,entry' })
  return ordered(MENTION_KEYS, { ...item, episode_id: episodeId })
}

/** A new entry declared by an item, without mentions. */
function newEntry(fields) {
  onlyFields(fields, ENTRY_FIELDS, 'A new entry')
  return ordered(ENTRY_KEYS, { ...fields, slug: entrySlug(fields.term, fields.gloss), mentions: [] })
}

/**
 * `entries` with the items' mentions added: to the entry with the item's slug, or to a new
 * entry. A new entry whose slug is taken is added anyway, so that commit() refuses it as a
 * duplicate slug.
 */
function addItems(data, entries, episodeId, items) {
  const bySlug = new Map(entries.map((e) => [e.slug, { ...e, mentions: [...e.mentions] }]))
  const created = []
  const touched = new Set()
  for (const item of items) {
    const mention = itemMention(item, episodeId)
    if ('entry' in item) {
      const entry = newEntry(item.entry)
      entry.mentions.push(mention)
      created.push(entry)
    } else {
      const entry = bySlug.get(item.slug) ?? refuse('unknown-entry', `There is no entry ${item.slug}.`, [String(item.slug)])
      entry.mentions.push(mention)
      touched.add(entry.slug)
    }
  }
  // Untouched entries stay the same objects.
  const kept = entries.map((e) => (touched.has(e.slug) ? { ...bySlug.get(e.slug), mentions: sortMentions(data, bySlug.get(e.slug).mentions) } : e))
  return sortEntries([...kept, ...created])
}

/**
 * Replaces all of an episode's mentions with `items`: entries the items declare are created,
 * and entries that had a mention only in this episode and none among the items are removed.
 */
export function replaceEpisodeMentions(data, episodeId, items) {
  findEpisode(data, episodeId)
  const emptied = new Set()
  const entries = []
  for (const e of data.entries) {
    if (!e.mentions.some((m) => m.episode_id === episodeId)) {
      entries.push(e)
      continue
    }
    const mentions = e.mentions.filter((m) => m.episode_id !== episodeId)
    if (!mentions.length) emptied.add(e.slug)
    entries.push({ ...e, mentions })
  }
  const result = addItems(data, entries, episodeId, items).filter((e) => !(emptied.has(e.slug) && e.mentions.length === 0))
  return commit(data, { ...data, entries: result })
}

/** Adds one mention, to an existing entry or a new one (see the item format above). */
export function addMention(data, episodeId, item) {
  findEpisode(data, episodeId)
  return commit(data, { ...data, entries: addItems(data, data.entries, episodeId, [item]) })
}

/** The entry and the index of its mention in `episodeId`, or a refusal. */
function findMention(data, slug, episodeId) {
  const entry = findEntry(data, slug)
  const i = entry.mentions.findIndex((m) => m.episode_id === episodeId)
  if (i < 0) refuse('unknown-mention', `${slug} has no mention in ${episodeId}.`, [slug], { mention: { slug, episode_id: String(episodeId) } })
  return { entry, i }
}

/** Changes a mention's t, role, note or confidence. */
export function editMention(data, slug, episodeId, fields) {
  onlyFields(fields, MENTION_FIELDS, 'editMention')
  const { entry, i } = findMention(data, slug, episodeId)
  const mentions = entry.mentions.map((m, j) => (j === i ? ordered(MENTION_KEYS, { ...m, ...fields }) : m))
  return commit(data, replaceEntry(data, slug, { ...entry, mentions: sortMentions(data, mentions) }))
}

/** Deletes a mention; an entry left without mentions is deleted with it. */
export function deleteMention(data, slug, episodeId) {
  const { entry, i } = findMention(data, slug, episodeId)
  const mentions = entry.mentions.filter((_, j) => j !== i)
  return commit(data, replaceEntry(data, slug, mentions.length ? { ...entry, mentions } : null))
}
