// What every edit shares: lookups that refuse, keeping the data's order, and the final check.

import { errors, introduced } from '../checks/problems.js'
import { ToolkitError, refuse } from './errors.js'

/**
 * `after`, unless it has errors that `before` doesn't: then a ToolkitError with them. Every
 * edit ends with this, so no edit can make valid data invalid.
 */
export function commit(before, after) {
  const found = errors(introduced(before, after, { warnings: false }))
  if (found.length) throw new ToolkitError(found)
  return after
}

/** The entry with this slug, or a refusal. */
export function findEntry(data, slug) {
  const entry = data.entries.find((e) => e.slug === slug)
  return entry ?? refuse('unknown-entry', `There is no entry ${slug}.`, [String(slug)])
}

/** The episode with this id, or a refusal. */
export function findEpisode(data, id) {
  const episode = data.episodes.find((ep) => ep.id === id)
  return episode ?? refuse('unknown-episode', `There is no episode ${id}.`, [], { episode: String(id) })
}

/** Refuses if `fields` has keys other than `allowed`. */
export function onlyFields(fields, allowed, what) {
  const extra = Object.keys(fields ?? {}).filter((k) => !allowed.includes(k))
  if (extra.length) refuse('field-not-settable', `${what} can't set ${extra.join(', ')}; only ${allowed.join(', ')}.`, [], { detail: extra.join(',') })
}

/** Entries in slug order, as the data file keeps them. */
export const sortEntries = (entries) => [...entries].sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0))

/** Mentions in the order the data file keeps them: by episode date, then timestamp. */
export function sortMentions(data, mentions) {
  const date = new Map(data.episodes.map((ep) => [ep.id, ep.date ?? '']))
  const key = (m) => date.get(m.episode_id) ?? ''
  return [...mentions].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : a.t - b.t))
}

/** `data` with the entry `slug` replaced by `entry` (or removed, if null), in slug order. */
export function replaceEntry(data, slug, entry) {
  const entries = data.entries.filter((e) => e.slug !== slug)
  return { ...data, entries: sortEntries(entry ? [...entries, entry] : entries) }
}
