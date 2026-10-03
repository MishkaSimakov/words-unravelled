// All checks together: problems() and introduced().

import { CODES, problemKey } from './codes.js'
import { duplicateProblems } from './duplicates.js'
import { linkProblems } from './links.js'
import { noteProblems } from './notes.js'
import { entryReadable, mentionReadable, schemaProblems } from './schema.js'
import { slugProblems } from './slugs.js'

const ORDER = Object.keys(CODES)

/**
 * Every problem in `data` ({ entries, episodes }), errors first, then by code and slug.
 * `warnings: false` skips the warnings, among them the slow duplicate detection.
 * `transcripts` ({ episode id: transcript text }) adds the check that timestamps start a line.
 */
export function problems(data, { warnings = true, transcripts = {} } = {}) {
  const found = schemaProblems(data, { transcripts })
  // The other checks read only entries and mentions whose fields have the right types.
  const entries = data.entries
    .filter(entryReadable)
    .map((e) => (e.mentions.every(mentionReadable) ? e : { ...e, mentions: e.mentions.filter(mentionReadable) }))
  found.push(...slugProblems(entries), ...linkProblems(entries, { warnings }))
  if (warnings) found.push(...duplicateProblems(entries), ...noteProblems(entries))
  const level = (p) => (p.level === 'error' ? 0 : 1)
  return found.sort(
    (a, b) => level(a) - level(b) || ORDER.indexOf(a.code) - ORDER.indexOf(b.code) || (problemKey(a) < problemKey(b) ? -1 : 1),
  )
}

/**
 * The problems of `after` that `before` doesn't have, compared by problemKey(). Keys are
 * counted, so a second copy of a known problem (a second identical bad link in a note) is new.
 */
export function introduced(before, after, options) {
  const known = new Map()
  for (const p of problems(before, options)) known.set(problemKey(p), (known.get(problemKey(p)) ?? 0) + 1)
  return problems(after, options).filter((p) => {
    const n = known.get(problemKey(p)) ?? 0
    known.set(problemKey(p), n - 1)
    return n <= 0
  })
}

export const errors = (list) => list.filter((p) => p.level === 'error')
