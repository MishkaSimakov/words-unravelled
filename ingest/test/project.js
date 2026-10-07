// A small copy of the project in a temporary git repository, for running the pipeline's scripts
// on: the toolkit, the ingest scripts, data/ from the toolkit's test fixture, and the files
// steps 1 and 2 would have made for one new episode. The scripts find everything relative to
// themselves, so they work on the copy as they do on the real checkout.

import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatJson } from '../../toolkit/src/io/files.js'
import { small } from '../../toolkit/test/fixtures/data.js'

const REPO = fileURLToPath(new URL('../../', import.meta.url))
export const MOCK_CLAUDE = fileURLToPath(new URL('./mocks/claude.js', import.meta.url))

export const ID = 'newEpisode1'
export const EPISODE = { id: ID, title: 'Words for towns', date: '2026-04-01', duration: 3000 }
// The caption lines of the episode: seconds -> text. Mentions must use these times.
export const LINES = { 10: 'Welcome to the show.', 60: 'London was Londinium.', 120: 'An ounce of prevention.', 180: 'Batter up, says the batter.', 240: 'Goodbye.' }

const json3 = () => ({ events: Object.entries(LINES).map(([t, text]) => ({ tStartMs: Number(t) * 1000, segs: [{ utf8: text }] })) })
const transcript = () =>
  `# video_id: ${ID}\n# title: ${EPISODE.title}\n\n` +
  Object.entries(LINES)
    .map(([t, text]) => `[00:${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}] ${text}`)
    .join('\n') +
  '\n'

/**
 * A new project in a temporary directory, committed. `data` replaces the fixture data;
 * `captions` puts the episode's captions and metadata in 1-youtube/ (step 1's output), and
 * `transcript` its transcript in 2-transcripts/ (step 2's).
 */
export function makeProject({ data = small(), captions = true, transcript: withTranscript = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'wordhoard-test-'))
  const at = (...p) => join(root, ...p)
  const copy = (path) => cpSync(join(REPO, path), at(path), { recursive: true })
  for (const path of ['toolkit/src', 'toolkit/package.json', 'ingest/lib', 'ingest/3-extract', 'ingest/4-verify', 'ingest/5-report']) copy(path)
  for (const path of ['ingest/1-download.sh', 'ingest/2-make-transcripts.py', 'ingest/new-episode.sh', 'ingest/package.json']) copy(path)
  symlinkSync(join(REPO, 'toolkit/node_modules'), at('toolkit/node_modules'))
  symlinkSync(join(REPO, 'ingest/node_modules'), at('ingest/node_modules'))
  writeFileSync(at('.gitignore'), readFileSync(join(REPO, '.gitignore'), 'utf8') + 'node_modules\n')
  mkdirSync(at('data'))
  writeFileSync(at('data/entries.json'), formatJson(data.entries))
  writeFileSync(at('data/episodes.json'), formatJson(data.episodes))
  writeFileSync(at('data/silenced.json'), '[]\n')

  const git = (...args) => {
    const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' })
    if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`)
    return r.stdout
  }
  git('init', '--quiet', '--initial-branch=main')
  git('config', 'user.email', 'test@example.com')
  git('config', 'user.name', 'Test')
  git('add', '-A')
  git('commit', '--quiet', '-m', 'Start')

  if (captions) {
    mkdirSync(at('ingest/1-youtube'))
    const base = at('ingest/1-youtube', `${EPISODE.title} [${ID}]`)
    writeFileSync(`${base}.info.json`, JSON.stringify({ id: ID, title: EPISODE.title, upload_date: EPISODE.date.replace(/-/g, ''), duration: EPISODE.duration }))
    writeFileSync(`${base}.en-orig.json3`, JSON.stringify(json3()))
  }
  if (withTranscript) {
    mkdirSync(at('ingest/2-transcripts'))
    writeFileSync(at('ingest/2-transcripts', `${ID}.txt`), transcript())
  }

  const project = {
    root,
    at,
    git,
    read: (path) => readFileSync(at(path), 'utf8'),
    json: (path) => JSON.parse(readFileSync(at(path), 'utf8')),
    write: (path, text) => writeFileSync(at(path), text),
    /** Runs `command` (a path in the project, or node with a script) with the mock claude playing `script`. */
    run(command, args = [], { script = {}, env = {} } = {}) {
      const mock = mkdtempSync(join(tmpdir(), 'wordhoard-mock-'))
      writeFileSync(join(mock, 'script.json'), JSON.stringify(script))
      const isNode = command.endsWith('.js')
      const r = spawnSync(isNode ? process.execPath : at(command), isNode ? [at(command), ...args] : args, {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, CLAUDE_BIN: MOCK_CLAUDE, MOCK_SCRIPT: join(mock, 'script.json'), MOCK_LOG: join(mock, 'log.json'), ...env },
      })
      let log = null
      try {
        log = JSON.parse(readFileSync(join(mock, 'log.json'), 'utf8'))
      } catch {}
      rmSync(mock, { recursive: true, force: true })
      return { status: r.status, stdout: r.stdout, stderr: r.stderr, out: r.stdout + r.stderr, log }
    },
    /** Paths that differ from HEAD, untracked included. */
    status: () => git('status', '--porcelain', '--untracked-files=all').split('\n').filter(Boolean),
    remove: () => rmSync(root, { recursive: true, force: true }),
  }
  return project
}

/** A mention item for the tools: a new entry, or an existing one by slug. */
export const item = (what, timestamp, note, role = 'subject', confidence = 'high') =>
  typeof what === 'string'
    ? { slug: what, timestamp, role, note, confidence }
    : { entry: { original: null, translation: null, language: 'English', category: 'word', ...what }, timestamp, role, note, confidence }

/** A mock script that submits `entries` and finishes. */
export const submitAndFinish = (entries, extra = []) => ({
  calls: [{ tool: 'submit', args: { entries } }, ...extra, { tool: 'finish', args: { retro: 'The transcript was short.' } }],
})
