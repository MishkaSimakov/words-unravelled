// Errors in fields and values: schema, enums, episode references and timestamps.

import { CATEGORIES, CONFIDENCES, ENTRY_KEYS, EPISODE_KEYS, MENTION_KEYS, ROLES } from '../model/schema.js'
import { transcriptTimes } from '../model/transcript.js'
import { problem } from './codes.js'

const isText = (v) => typeof v === 'string' && v.trim() !== ''
const isTextOrNull = (v) => v === null || isText(v)
const isCount = (v) => Number.isInteger(v) && v >= 0
const DATE = /^\d{4}-\d\d-\d\d$/

// Each field's type check. gloss may be absent (it is absent when there is none), so it is
// checked only when present; enums are checked separately, with codes of their own.
const ENTRY_TYPES = {
  slug: isText, term: isText, gloss: isText, original: isTextOrNull, translation: isTextOrNull,
  language: isTextOrNull, category: () => true, mentions: Array.isArray,
}
const MENTION_TYPES = {
  episode_id: isText, t: isCount, role: () => true, note: (v) => typeof v === 'string', confidence: () => true,
}
const EPISODE_TYPES = {
  id: isText, title: isText, date: (v) => typeof v === 'string' && DATE.test(v), duration: (v) => isCount(v) && v > 0,
}

/** The names of fields that are missing, unknown or of the wrong type. */
function badFields(object, keys, types, optional = []) {
  if (object === null || typeof object !== 'object' || Array.isArray(object)) return ['(not an object)']
  const bad = Object.keys(object).filter((k) => !keys.includes(k))
  for (const key of keys) {
    if (!(key in object)) {
      if (!optional.includes(key)) bad.push(key)
    } else if (!types[key](object[key])) bad.push(key)
  }
  return bad
}

/** Whether checks beyond these may read the entry: its fields have the right types. */
export const entryReadable = (entry) => badFields(entry, ENTRY_KEYS, ENTRY_TYPES, ['gloss']).length === 0
/** Whether checks beyond these may read the mention. */
export const mentionReadable = (mention) => badFields(mention, MENTION_KEYS, MENTION_TYPES).length === 0

export function schemaProblems(data, { transcripts = {} } = {}) {
  const found = []
  const episodes = new Map()
  for (const ep of data.episodes) {
    for (const field of badFields(ep, EPISODE_KEYS, EPISODE_TYPES)) {
      found.push(problem('episode-field', `Episode ${ep?.id}: field "${field}" is missing, unknown or invalid.`, [], { episode: String(ep?.id), detail: field }))
    }
    if (episodes.has(ep?.id)) found.push(problem('episode-duplicate', `Episode ${ep.id} is listed twice.`, [], { episode: ep.id }))
    episodes.set(ep?.id, ep)
  }
  const times = new Map(Object.entries(transcripts).map(([id, text]) => [id, transcriptTimes(text)]))

  for (const entry of data.entries) {
    const slug = String(entry?.slug)
    const slugs = [slug]
    for (const field of badFields(entry, ENTRY_KEYS, ENTRY_TYPES, ['gloss'])) {
      found.push(problem('entry-field', `${slug}: field "${field}" is missing, unknown or invalid.`, slugs, { detail: field }))
    }
    if (!entry || typeof entry !== 'object') continue
    if ('category' in entry && !CATEGORIES.includes(entry.category)) {
      found.push(problem('category-unknown', `${slug}: unknown category "${entry.category}".`, slugs, { detail: String(entry.category) }))
    }
    if (!Array.isArray(entry.mentions)) continue
    if (entry.mentions.length === 0) found.push(problem('entry-empty', `${slug} has no mentions.`, slugs))

    const seen = new Set()
    for (const m of entry.mentions) {
      const mention = { slug, episode_id: String(m?.episode_id) }
      const at = `${slug} in ${m?.episode_id}`
      for (const field of badFields(m, MENTION_KEYS, MENTION_TYPES)) {
        found.push(problem('mention-field', `${at}: field "${field}" is missing, unknown or invalid.`, slugs, { mention, detail: field }))
      }
      if (!m || typeof m !== 'object') continue
      if ('role' in m && !ROLES.includes(m.role)) {
        found.push(problem('role-unknown', `${at}: unknown role "${m.role}".`, slugs, { mention, detail: String(m.role) }))
      }
      if ('confidence' in m && !CONFIDENCES.includes(m.confidence)) {
        found.push(problem('confidence-unknown', `${at}: unknown confidence "${m.confidence}".`, slugs, { mention, detail: String(m.confidence) }))
      }
      if (seen.has(m.episode_id)) found.push(problem('mention-twice', `${slug} has two mentions in ${m.episode_id}.`, slugs, { mention }))
      seen.add(m.episode_id)
      const ep = episodes.get(m.episode_id)
      if (!ep) {
        found.push(problem('mention-episode-unknown', `${at}: no such episode.`, slugs, { mention }))
        continue
      }
      if (isCount(m.t) && isCount(ep.duration) && m.t > ep.duration) {
        found.push(problem('mention-after-end', `${at}: ${m.t} s is after the end of the episode (${ep.duration} s).`, slugs, { mention }))
      }
      if (times.has(m.episode_id) && !times.get(m.episode_id).has(m.t)) {
        found.push(problem('timestamp-not-in-transcript', `${at}: no transcript line starts at ${m.t} s.`, slugs, { mention }))
      }
    }
  }
  return found
}
