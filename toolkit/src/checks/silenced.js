// Silenced warnings: warnings looked at and found fine, kept in data/silenced.json so that
// `check` and the review tool list them apart. A record is a problem's identity (problemKey():
// code, slugs, mention, episode, detail), not its wording, and silences exactly one problem with
// that identity: other problems of the same entry, mention or code stay active.

import { CODES, problemKey } from './codes.js'
import { refuse } from '../edit/errors.js'

const RECORD_KEYS = ['code', 'slugs', 'mention', 'episode', 'detail']

/** The record silenced.json keeps for a problem: { code, slugs, mention?, episode?, detail? }. */
export function silenceRecord(p) {
  const record = { code: p.code, slugs: [...p.slugs] }
  if (p.mention) record.mention = { slug: p.mention.slug, episode_id: p.mention.episode_id }
  if (p.episode !== undefined) record.episode = p.episode
  if (p.detail !== undefined) record.detail = p.detail
  return record
}

/**
 * Splits the problems `found` by the silenced `records`: { active, silenced, stale }. Each
 * record silences one problem with its key, so of two problems with the same key (two identical
 * bad links in one note) one record silences one. `stale` are the records that match no problem,
 * e.g. after the entries they name were renamed or merged.
 */
export function applySilenced(found, records) {
  const left = new Map()
  for (const r of records) left.set(problemKey(r), [...(left.get(problemKey(r)) ?? []), r])
  const active = []
  const silenced = []
  for (const p of found) {
    const waiting = left.get(problemKey(p))
    if (waiting?.length) {
      waiting.pop()
      silenced.push(p)
    } else {
      active.push(p)
    }
  }
  return { active, silenced, stale: [...left.values()].flat() }
}

/** Records in file order: by key, so that a git diff shows only what changed. */
const sortRecords = (records) => [...records].sort((a, b) => (problemKey(a) < problemKey(b) ? -1 : problemKey(a) > problemKey(b) ? 1 : 0))

/**
 * `records` with the warning `problem` silenced. Refused if it is an error (errors are fixed,
 * not silenced), or if no active problem in `found` (the data's problems) has its key.
 */
export function silence(records, problem, found) {
  if (CODES[problem?.code]?.level !== 'warning' || CODES[problem.code].refusal) {
    refuse('silence-not-warning', `Only warnings can be silenced, not ${problem?.code}.`, problem?.slugs ?? [], { detail: String(problem?.code) })
  }
  const key = problemKey(problem)
  if (!applySilenced(found, records).active.some((p) => problemKey(p) === key)) {
    refuse('silence-unknown', `No active warning is ${key}.`, problem.slugs, { detail: key })
  }
  return sortRecords([...records, silenceRecord(problem)])
}

/** `records` without one record of `problem` (a silenced problem, or a stale record). */
export function unsilence(records, problem) {
  const key = problemKey(problem)
  const i = records.findIndex((r) => problemKey(r) === key)
  if (i < 0) refuse('silence-unknown', `No silenced warning is ${key}.`, problem?.slugs ?? [], { detail: key })
  return records.filter((_, j) => j !== i)
}

/** What is wrong with the contents of silenced.json, as messages; [] if nothing. */
export function silencedFileProblems(records) {
  if (!Array.isArray(records)) return ['silenced.json must be a list.']
  const out = []
  records.forEach((r, i) => {
    const at = `silenced.json item ${i}`
    if (!r || typeof r !== 'object' || Array.isArray(r)) return out.push(`${at} is not an object.`)
    const extra = Object.keys(r).filter((k) => !RECORD_KEYS.includes(k))
    if (extra.length) out.push(`${at} has unknown keys: ${extra.join(', ')}.`)
    if (CODES[r.code]?.level !== 'warning' || CODES[r.code].refusal) out.push(`${at}: ${r.code} is not a warning code.`)
    if (!Array.isArray(r.slugs) || !r.slugs.every((s) => typeof s === 'string')) out.push(`${at}: slugs must be a list of strings.`)
    if ('mention' in r && (typeof r.mention?.slug !== 'string' || typeof r.mention?.episode_id !== 'string')) {
      out.push(`${at}: mention must be { slug, episode_id }.`)
    }
    for (const key of ['episode', 'detail']) if (key in r && typeof r[key] !== 'string') out.push(`${at}: ${key} must be a string.`)
  })
  return out
}
