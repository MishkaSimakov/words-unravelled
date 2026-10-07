#!/usr/bin/env node
// Step 5: the report for the maintainer's review, runs/<id>/5-report.md.
//
//   node ingest/5-report/report.js <video_id>         writes the report
//   node ingest/5-report/report.js <video_id> --pr    prints a pull request's title and body
//
// From the run's record (step 3) and the data compared with HEAD: a summary, the warnings the
// agent's work introduced, its complaints about existing entries, its retrospective, and for
// each new entry the places that may want a link to it: links in other episodes' notes that led
// nowhere before and now lead to it, and notes that name it in plain text.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { linkResolutions } from '../../toolkit/src/checks/invariants.js'
import { entryName } from '../../toolkit/src/model/schema.js'
import { slugText } from '../../toolkit/src/model/slugs.js'
import { buildIndex, episode as findEpisode } from '../../toolkit/src/query/index.js'
import { plainMentions } from '../../toolkit/src/query/plain.js'
import { formatTimestamp } from '../lib/episode.js'
import { abortRun, runStep } from '../lib/fail.js'
import { headFile } from '../lib/git.js'
import { DATA, ROOT, StepError, checkVideoId, runFile } from '../lib/paths.js'
import { readRecord } from '../lib/record.js'

const STEP = 'Step 5 (report)'
export const PER_ENTRY = 10 // links and plain-text mentions listed per new entry

/** For each new entry of episode `id`: { entry, captured, plain }, each list capped at PER_ENTRY, with totals. */
export function possibleLinks(before, after, id, glosses = []) {
  const index = buildIndex(after)
  const created = after.entries.filter((e) => e.mentions.length && e.mentions.every((m) => m.episode_id === id))
  const newSlugs = new Set(created.map((e) => e.slug))
  // Links of other episodes that resolved to nothing at HEAD and now resolve to a new entry.
  const oldSlug = new Map(glosses.map((g) => [g.to, g.from]))
  const was = linkResolutions(before)
  const captured = new Map()
  for (const [key, slug] of linkResolutions(after)) {
    if (!newSlugs.has(slug)) continue
    const [owner, episode, n] = key.split('|')
    if (episode === id || was.get(`${oldSlug.get(owner) ?? owner}|${episode}|${n}`) !== null) continue
    const entry = index.links.bySlug.get(owner)
    const mention = entry.mentions.find((m) => m.episode_id === episode)
    const list = captured.get(slug) ?? []
    if (!list.some((x) => x.mention === mention)) list.push({ entry, mention })
    captured.set(slug, list)
  }
  // Notes don't link language names ("from Scottish Gaelic"), so their plain-text mentions aren't missing links.
  const languages = new Set(after.entries.map((e) => slugText(e.language)).filter(Boolean))
  return created.map((entry) => {
    const plain = languages.has(slugText(entry.term)) ? [] : plainMentions(index, entry.slug).filter((x) => x.mention.episode_id !== id)
    const links = captured.get(entry.slug) ?? []
    return { entry, captured: links.slice(0, PER_ENTRY), capturedTotal: links.length, plain: plain.slice(0, PER_ENTRY), plainTotal: plain.length }
  })
}

const counts = (after, id) => {
  const own = after.entries.flatMap((e) => e.mentions.filter((m) => m.episode_id === id))
  const by = (role) => own.filter((m) => m.role === role).length
  return { mentions: own.length, subject: by('subject'), aside: by('aside'), mention: by('mention'), low: own.filter((m) => m.confidence === 'low').length }
}

const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`

/** The report's Markdown. */
export function report({ record, before, after, verify }) {
  const { episode } = record
  const id = episode.id
  const c = counts(after, id)
  const links = possibleLinks(before, after, id, record.glosses)
  const index = buildIndex(after)
  const warnings = record.warnings ?? []
  const complaints = record.complaints ?? []
  const glosses = record.glosses ?? []
  const where = ({ entry, mention }) => `**${entryName(entry)}** in *${findEpisode(index, mention.episode_id)?.title ?? mention.episode_id}* (${formatTimestamp(mention.t)}): ${mention.note}`
  const result = record.result ?? {}
  const run = [
    record.model,
    result.turns != null && plural(result.turns, 'turn'),
    result.duration_ms != null && `${Math.round(result.duration_ms / 60_000)} min`,
    result.cost_usd != null && `$${result.cost_usd.toFixed(2)}`,
  ].filter(Boolean)

  const out = [
    `# ${episode.title}`,
    '',
    `[${id}](https://www.youtube.com/watch?v=${id}), published ${episode.date}, ${Math.round(episode.duration / 60)} min. Extracted by ${run.join(', ')}.`,
    '',
    '## Summary',
    '',
    `- ${plural(c.mentions, 'mention')} (${c.subject} subject, ${c.aside} aside, ${c.mention} mention), ${c.low} low-confidence; ${plural(links.length, 'new entry', 'new entries')}.`,
    `- ${glosses.length ? `Glosses added to existing entries: ${glosses.map((g) => `${g.from} → ${g.to}`).join(', ')}.` : 'No glosses added to existing entries.'}`,
    `- ${plural(warnings.length, 'warning')}, ${plural(complaints.length, 'complaint')}.`,
    `- Verify: ${verify.split('\n')[0]}`,
    '',
    `## Warnings (${warnings.length})`,
    '',
    'Introduced by this episode, as the agent left them.',
    '',
    ...(warnings.length ? warnings.map((w) => `- \`${w.code}\` ${w.message}`) : ['None.']),
    '',
    `## Complaints (${complaints.length})`,
    '',
    'What the agent reported about existing entries.',
    '',
    ...(complaints.length ? complaints.map((x) => `- **${x.name}** (\`${x.slug}\`): ${x.text}`) : ['None.']),
    '',
    '## Retrospective',
    '',
    record.retro ?? '(none)',
    '',
    '## Possible links to the new entries',
    '',
    `For each new entry: links in other episodes' notes that led nowhere and now lead to it (check they mean this sense), and notes of other episodes that name it in plain text. At most ${PER_ENTRY} of each.`,
    '',
  ]
  const found = links.filter((x) => x.capturedTotal || x.plainTotal)
  if (!found.length) out.push('None found.', '')
  for (const x of found) {
    out.push(`### ${entryName(x.entry)} (\`${x.entry.slug}\`)`, '')
    if (x.capturedTotal) out.push(`Links that now lead here (${x.capturedTotal}):`, '', ...x.captured.map((m) => `- ${where(m)}`), '')
    if (x.plainTotal) out.push(`Named in plain text (${x.plainTotal}):`, '', ...x.plain.map((m) => `- ${where(m)}`), '')
  }
  return out.join('\n')
}

/** A pull request's title and body: short, the report has the rest. */
export function pullRequest({ record, after }) {
  const { episode } = record
  const c = counts(after, episode.id)
  const created = after.entries.filter((e) => e.mentions.length && e.mentions.every((m) => m.episode_id === episode.id)).length
  const glosses = record.glosses?.length ?? 0
  return [
    `Episode: ${episode.title}`,
    '',
    `Adds "${episode.title}" (${episode.date}): ${plural(c.mentions, 'mention')}, ${plural(created, 'new entry', 'new entries')}` +
      `${glosses ? `, ${plural(glosses, 'gloss', 'glosses')} added` : ''}; ` +
      `${plural(record.warnings?.length ?? 0, 'warning')}, ${plural(record.complaints?.length ?? 0, 'complaint')}.`,
    '',
    `Report: ${relative(ROOT, runFile(episode.id, 'report'))}`,
  ].join('\n')
}

async function main() {
  const args = process.argv.slice(2)
  const pr = args.includes('--pr')
  const rest = args.filter((a) => a !== '--pr')
  if (rest.length !== 1) throw new StepError('Usage: report.js <video_id> [--pr]')
  const id = checkVideoId(rest[0])
  for (const name of ['record', 'verify']) {
    if (!existsSync(runFile(id, name))) throw new StepError(`No ${relative(ROOT, runFile(id, name))}. Run steps 3 and 4 first.`)
  }
  const verify = readFileSync(runFile(id, 'verify'), 'utf8')
  if (!verify.startsWith('Passed')) throw new StepError(`${relative(ROOT, runFile(id, 'verify'))} doesn't say the change passed.`)
  const read = (name) => JSON.parse(readFileSync(join(DATA, name), 'utf8'))
  const after = { entries: read('entries.json'), episodes: read('episodes.json') }
  const record = readRecord(runFile(id, 'record'))
  if (pr) return console.log(pullRequest({ record, after }))

  if (existsSync(runFile(id, 'report'))) throw new StepError(`${relative(ROOT, runFile(id, 'report'))} exists: the report was written already.`)
  try {
    const before = { entries: JSON.parse(headFile('data/entries.json')), episodes: JSON.parse(headFile('data/episodes.json')) }
    writeFileSync(runFile(id, 'report'), report({ record, before, after, verify }))
  } catch (error) {
    abortRun(id, STEP, `the report could not be written: ${error.stack ?? error}`)
  }
  console.log(`${STEP}: ${relative(ROOT, runFile(id, 'report'))}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await runStep(main)
