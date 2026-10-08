#!/usr/bin/env node
// Step 4: checks that step 3 changed only what it may: this episode's records, plus glosses
// added to existing entries and the link rewrites that come with them.
//
//   node ingest/4-verify/verify.js <video_id>
//
// It compares the working tree with HEAD and is independent of step 3: it doesn't use the
// toolkit's edits or the agent's record, only link parsing and slugs (toolkit/src/model/) and
// the toolkit's error checks. It writes runs/<id>/4-verify.txt. If any rule fails, the change
// is discarded: the diff is saved as 4-verify.diff, data/ goes back to HEAD and the run folder
// moves to ingest/failed/.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { errors, introduced } from '../../toolkit/src/checks/problems.js'
import { parseNote, targetTerm } from '../../toolkit/src/model/links.js'
import { entrySlug, slugify } from '../../toolkit/src/model/slugs.js'
import { episodeMetadata } from '../lib/episode.js'
import { abortRun, runStep } from '../lib/fail.js'
import { changedPaths, git, headFile } from '../lib/git.js'
import { DATA, ROOT, StepError, checkVideoId, runDir, runFile } from '../lib/paths.js'
import { readRecord } from '../lib/record.js'

const STEP = 'Step 4 (verify)'
const DATA_FILES = ['data/entries.json', 'data/episodes.json']

// Deep equality, ignoring key order.
const equal = (a, b) => {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null || Array.isArray(a) !== Array.isArray(b)) return false
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((k) => Object.hasOwn(b, k) && equal(a[k], b[k]))
}

const without = (object, ...keys) => Object.fromEntries(Object.entries(object).filter(([k]) => !keys.includes(k)))

/**
 * The rules that fail for the change from `before` to `after` (both { entries, episodes }),
 * given the episode's metadata and the paths that differ from HEAD; [] if the change is
 * allowed. Also returns what the change did: { failures, added, glossed, mentions }.
 */
export function checkChange({ episode, before, after, changed }) {
  const id = episode.id
  const failures = []
  const fail = (rule, message) => failures.push(`[${rule}] ${message}`)

  // 1. Files: only the data files, besides the run's own folder.
  const others = changed.filter((p) => !DATA_FILES.includes(p) && !p.startsWith(`ingest/runs/${id}/`))
  if (others.length) fail('files', `only ${DATA_FILES.join(' and ')} may change, but so did: ${others.join(', ')}.`)

  // 2. Episodes: HEAD's list plus exactly this episode, with its metadata.
  const added = after.episodes.filter((ep) => ep?.id === id)
  if (before.episodes.some((ep) => ep.id === id)) fail('episodes', `${id} was in episodes.json already.`)
  if (added.length !== 1) fail('episodes', `episodes.json must gain ${id} once; it has it ${added.length} times.`)
  else if (!equal(added[0], episode)) fail('episodes', `${id} in episodes.json is ${JSON.stringify(added[0])}, not the metadata ${JSON.stringify(episode)}.`)
  if (!equal(after.episodes.filter((ep) => ep?.id !== id), before.episodes)) fail('episodes', 'other episodes in episodes.json changed, or their order did.')

  // 3. Entries.
  const was = new Map(before.entries.map((e) => [e.slug, e]))
  const now = new Map(after.entries.map((e) => [e.slug, e]))
  // Existing entries given a gloss: old slug -> the entry now. The slug is term + gloss, and
  // nothing else of the entry changed but its mentions (checked below).
  const glossed = new Map()
  for (const old of before.entries) {
    if (now.has(old.slug)) continue
    const candidates = old.gloss
      ? []
      : after.entries.filter((e) => !was.has(e.slug) && e.term === old.term && typeof e.gloss === 'string' && e.gloss.trim() && e.slug === entrySlug(e.term, e.gloss))
    // The one that kept the old entry's fields and its mentions in other episodes (a new entry
    // of this episode may share its term, and its fields).
    const same = candidates.filter(
      (e) => equal(without(e, 'slug', 'gloss', 'mentions'), without(old, 'slug', 'gloss', 'mentions')) && old.mentions.every((m) => e.mentions?.some((n) => n.episode_id === m.episode_id)),
    )
    if (same.length === 1) glossed.set(old.slug, same[0])
    else fail('entries', `existing entry ${old.slug} is gone${candidates.length ? ', or was changed beyond a new gloss' : ''}.`)
  }
  const oldSlugOf = new Map([...glossed].map(([from, e]) => [e.slug, from]))

  // A note of another episode may differ only in link targets that now name a glossed entry.
  const allowedNote = (a, b) => {
    if (a === b) return true
    const [pa, pb] = [parseNote(a), parseNote(b)]
    if (pa.length !== pb.length) return false
    return pa.every((x, i) => {
      const y = pb[i]
      if (typeof x === 'string' || typeof y === 'string') return x === y
      const trail = (link) => link.text.slice(targetTerm(link.target).length)
      if (x.type !== y.type || x.uncertain !== y.uncertain || trail(x) !== trail(y)) return false
      if (x.target === y.target) return true
      const to = glossed.get(slugify(x.target))
      return Boolean(to) && slugify(y.target) === to.slug
    })
  }

  let mentions = 0
  const created = []
  for (const entry of after.entries) {
    const ownMentions = (entry.mentions ?? []).filter((m) => m.episode_id === id)
    mentions += ownMentions.length
    const old = was.get(entry.slug) ?? before.entries.find((e) => e.slug === oldSlugOf.get(entry.slug))
    if (!old) {
      created.push(entry.slug)
      if (ownMentions.length !== (entry.mentions ?? []).length) fail('new-entries', `new entry ${entry.slug} has mentions of other episodes.`)
      continue
    }
    const fieldsOld = oldSlugOf.has(entry.slug) ? without(old, 'slug', 'gloss', 'mentions') : without(old, 'mentions')
    const fieldsNow = oldSlugOf.has(entry.slug) ? without(entry, 'slug', 'gloss', 'mentions') : without(entry, 'mentions')
    if (!equal(fieldsOld, fieldsNow)) fail('existing-entries', `the fields of existing entry ${old.slug} changed.`)
    if (ownMentions.length > 1) fail('existing-entries', `${entry.slug} has ${ownMentions.length} mentions of ${id}.`)
    const others = entry.mentions.filter((m) => m.episode_id !== id)
    const oldMentions = new Map(old.mentions.map((m) => [m.episode_id, m]))
    if (others.length !== old.mentions.length || others.some((m) => !oldMentions.has(m.episode_id))) {
      fail('existing-entries', `the mentions of existing entry ${old.slug} in other episodes were added or removed.`)
      continue
    }
    for (const m of others) {
      const o = oldMentions.get(m.episode_id)
      if (!equal(without(m, 'note'), without(o, 'note'))) fail('other-mentions', `${old.slug} in ${m.episode_id}: the mention changed.`)
      else if (!allowedNote(o.note, m.note)) fail('other-mentions', `${old.slug} in ${m.episode_id}: the note changed beyond links renamed by a new gloss.`)
    }
  }
  if (!mentions) fail('entries', `the data has no mentions of ${id}.`)

  // 4. Valid data: no errors that HEAD doesn't have.
  try {
    const found = errors(introduced(before, after, { warnings: false }))
    if (found.length) fail('errors', `the data has errors: ${found.slice(0, 10).map((p) => p.message).join(' ')}`)
  } catch (error) {
    fail('errors', `the data can't be checked: ${error.message}`)
  }

  return { failures, created, glossed: [...glossed].map(([from, e]) => ({ from, to: e.slug })), mentions }
}

async function main() {
  const [arg, ...rest] = process.argv.slice(2)
  if (rest.length) throw new StepError('Usage: verify.js <video_id>')
  const id = checkVideoId(arg)
  const record = runFile(id, 'record')
  if (!existsSync(record) || !readRecord(record).finished) throw new StepError(`No finished extraction of ${id} (${relative(ROOT, record)}). Run step 3 first.`)
  if (existsSync(runFile(id, 'verify'))) throw new StepError(`${relative(ROOT, runFile(id, 'verify'))} exists: the run was verified already.`)

  const head = (name) => JSON.parse(headFile(`data/${name}`))
  let result
  try {
    const read = (name) => JSON.parse(readFileSync(join(DATA, name), 'utf8'))
    const after = { entries: read('entries.json'), episodes: read('episodes.json') }
    result = checkChange({ episode: episodeMetadata(id), before: { entries: head('entries.json'), episodes: head('episodes.json') }, after, changed: changedPaths() })
  } catch (error) {
    if (error instanceof StepError) throw error
    result = { failures: [`[files] the data can't be read or compared: ${error.message}`] }
  }

  const lines = result.failures.length
    ? ['Rejected:', ...result.failures.map((f) => `- ${f}`)]
    : [
        `Passed: ${result.mentions} mention${result.mentions === 1 ? '' : 's'} of ${id}, ${result.created.length} new ${result.created.length === 1 ? 'entry' : 'entries'}` +
          `${result.glossed.length ? `, glosses added to ${result.glossed.map((g) => `${g.from} (now ${g.to})`).join(', ')}` : ''}.`,
        'Checked against HEAD: only data/entries.json and data/episodes.json changed; episodes.json gained exactly this episode;',
        'new entries have mentions of this episode only; existing entries changed only by a mention of this episode or a new gloss;',
        'mentions of other episodes changed only in links renamed by a new gloss; the data has no new errors.',
      ]
  writeFileSync(runFile(id, 'verify'), lines.join('\n') + '\n')
  if (result.failures.length) {
    const diff = git('diff', 'HEAD', '--', '.') + changedPaths().filter((p) => !p.startsWith('ingest/runs/')).map((p) => `changed or new: ${p}\n`).join('')
    writeFileSync(join(runDir(id), '4-verify.diff'), diff)
    abortRun(id, STEP, `the change breaks the rules:\n${result.failures.map((f) => `  ${f}`).join('\n')}\nThe diff is saved as 4-verify.diff.`)
  }
  console.log(`${STEP}: ${lines[0]}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await runStep(main)
