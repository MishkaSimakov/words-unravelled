#!/usr/bin/env node
// Step 3: the extraction agent adds one episode to data/.
//
//   node ingest/3-extract/run.js <video_id> [--model claude-opus-5-5] [--timeout 90]
//
// Runs `claude -p` with prompt.md and the episode's transcript, in a sandbox whose only tools
// are those of server.js (see claudeArgs()). The server saves the agent's changes to data/ and
// its work to ingest/runs/<id>/3-record.json; this script writes the agent's log,
// runs/<id>/3-agent-log.md, as it goes.
//
// Before starting it needs a clean working tree, the transcript and metadata of steps 1-2, an
// episode that isn't in data/ yet and no runs/<id>/. If claude fails (a usage limit, a crash,
// a timeout), offers tools other than the server's, or stops without calling finish, data/ is
// put back as it is at HEAD and runs/<id>/ moves to ingest/failed/.

import { spawn } from 'node:child_process'
import { createWriteStream, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { episodeMetadata } from '../lib/episode.js'
import { abortRun, runStep } from '../lib/fail.js'
import { changedPaths } from '../lib/git.js'
import { DATA, ROOT, StepError, checkVideoId, runDir, runFile, transcriptPath } from '../lib/paths.js'
import { readRecord, updateRecord, writeRecord } from '../lib/record.js'
import { LogWriter } from './log.js'

export const DEFAULT_MODEL = 'claude-opus-5-5'
const STEP = 'Step 3 (extract)'
const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`
const HERE = fileURLToPath(new URL('.', import.meta.url))

export const SERVER = 'wordhoard'
export const TOOLS = ['search', 'entry', 'list', 'submit', 'add', 'edit', 'remove', 'merge', 'set_gloss', 'complain', 'finish']
export const ALLOWED_TOOLS = TOOLS.map((t) => `mcp__${SERVER}__${t}`)

/**
 * The arguments of the sandboxed claude run: no built-in tools (--tools ""), no MCP server but
 * ours (--strict-mcp-config), no settings, hooks or CLAUDE.md from the user or the project
 * (--setting-sources "", and an empty working directory), no skills or slash commands, and
 * every permission prompt denied (dontAsk), so only the allowed MCP tools can run.
 */
export function claudeArgs({ model, mcpConfig, systemPrompt }) {
  return [
    '-p',
    '--model', model,
    '--system-prompt', systemPrompt,
    '--tools', '',
    '--strict-mcp-config',
    '--mcp-config', mcpConfig,
    '--allowedTools', ALLOWED_TOOLS.join(','),
    '--setting-sources', '',
    '--disable-slash-commands',
    '--permission-mode', 'dontAsk',
    '--no-session-persistence',
    '--output-format', 'stream-json',
    '--verbose',
  ]
}

/** The first message: what to do, and the transcript. */
export const kickoff = (episode, transcript) =>
  `Add this episode to the Wordhoard: "${episode.title}" (video ${episode.id}, published ${episode.date}, ` +
  `${Math.round(episode.duration / 60)} minutes). Its transcript follows.\n\n<transcript>\n${transcript.trim()}\n</transcript>\n`

/** Checks what the run needs; returns the episode. Changes nothing. */
function preflight(id) {
  const changed = changedPaths()
  if (changed.length) {
    throw new StepError(
      `The working tree has changes (${changed.slice(0, 5).join(', ')}${changed.length > 5 ? ', …' : ''}). ` +
        'Commit or stash them first (git stash -u): a failed run puts data/ back as it is at HEAD.',
    )
  }
  if (existsSync(runDir(id))) {
    throw new StepError(`${relative(ROOT, runDir(id))}/ exists: the episode was extracted before. Delete the folder to extract it again.`)
  }
  if (!existsSync(transcriptPath(id))) throw new StepError(`No transcript ${relative(ROOT, transcriptPath(id))}. Run steps 1 and 2 first.`)
  const episode = episodeMetadata(id)
  const episodes = JSON.parse(readFileSync(join(DATA, 'episodes.json'), 'utf8'))
  if (episodes.some((ep) => ep.id === id)) throw new StepError(`Episode ${id} is already in data/episodes.json.`)
  return episode
}

/**
 * Runs claude; resolves to { code, signal, result, failure }: `result` is claude's final result
 * event, `failure` why the run must be undone, if it must.
 */
function runClaude({ id, episode, model, timeoutMinutes }) {
  const work = mkdtempSync(join(tmpdir(), 'wordhoard-'))
  const cwd = join(work, 'cwd') // empty: no CLAUDE.md or .claude/ to find
  mkdirSync(cwd)
  const mcpConfig = join(work, 'mcp.json')
  const server = { command: process.execPath, args: [join(HERE, 'server.js'), '--data', DATA, '--transcript', transcriptPath(id), '--record', runFile(id, 'record')] }
  writeFileSync(mcpConfig, JSON.stringify({ mcpServers: { [SERVER]: { type: 'stdio', ...server } } }))
  const args = claudeArgs({ model, mcpConfig, systemPrompt: readFileSync(join(HERE, 'prompt.md'), 'utf8') })

  const log = new LogWriter(createWriteStream(runFile(id, 'log')), { episode, model })
  const child = spawn(process.env.CLAUDE_BIN ?? 'claude', args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] })
  const stderr = []
  let result = null
  let failure = null
  const stop = (reason) => {
    failure ??= reason
    child.kill('SIGTERM')
  }
  const timer = setTimeout(() => stop(`claude took longer than ${timeoutMinutes} minutes and was stopped.`), timeoutMinutes * 60_000)
  const interrupt = () => stop('interrupted (Ctrl-C).')
  process.on('SIGINT', interrupt)
  process.on('SIGTERM', interrupt)

  createInterface({ input: child.stderr }).on('line', (line) => {
    stderr.push(line)
    if (stderr.length > 30) stderr.shift()
  })
  createInterface({ input: child.stdout }).on('line', (line) => {
    let event
    try {
      event = JSON.parse(line)
    } catch {
      return log.raw(line)
    }
    log.event(event)
    if (event.type === 'system' && event.subtype === 'init') {
      const extra = (event.tools ?? []).filter((t) => !ALLOWED_TOOLS.includes(t))
      if (extra.length) stop(`claude offered tools outside the sandbox: ${extra.join(', ')}.`)
      const ours = (event.mcp_servers ?? []).find((s) => s.name === SERVER)
      if (ours && ours.status !== 'connected') stop(`the ${SERVER} MCP server didn't start (${ours.status}).`)
      const others = (event.mcp_servers ?? []).filter((s) => s.name !== SERVER)
      if (others.length) stop(`claude loaded other MCP servers: ${others.map((s) => s.name).join(', ')}.`)
    }
    if (event.type === 'result') result = event
  })
  child.stdin.on('error', () => {}) // claude may exit before reading it all; its exit says why
  child.stdin.end(kickoff(episode, readFileSync(transcriptPath(id), 'utf8')))

  return new Promise((resolve) => {
    let spawnError = null
    child.on('error', (error) => {
      spawnError = error
    })
    child.on('close', async (code, signal) => {
      clearTimeout(timer)
      process.off('SIGINT', interrupt)
      process.off('SIGTERM', interrupt)
      await log.close(stderr)
      rmSync(work, { recursive: true, force: true })
      if (spawnError) failure ??= `claude could not be started (${spawnError.message}). Is the claude CLI installed?`
      else if (result?.is_error || (result && result.subtype !== 'success')) failure ??= `claude reported an error: ${resultError(result)}`
      else if (code !== 0) failure ??= `claude exited with ${signal ?? `code ${code}`}.${stderr.length ? ` Its last output: ${stderr.slice(-5).join(' / ')}` : ''}`
      else if (!result) failure ??= 'claude ended without a result.'
      resolve({ result, failure })
    })
  })
}

/** What a failed result says: a usage limit, an API error, too many turns. */
function resultError(result) {
  const text = typeof result.result === 'string' && result.result.trim() ? result.result.trim() : null
  return [text ?? result.subtype, result.api_error_status && `(API status ${result.api_error_status})`].filter(Boolean).join(' ')
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { model: { type: 'string', default: DEFAULT_MODEL }, timeout: { type: 'string', default: '90' } },
  })
  if (positionals.length !== 1) throw new StepError('Usage: run.js <video_id> [--model M] [--timeout minutes]')
  const id = checkVideoId(positionals[0])
  const timeoutMinutes = Number(values.timeout)
  if (!(timeoutMinutes > 0)) throw new StepError(`--timeout must be a number of minutes, not ${values.timeout}.`)
  const episode = preflight(id)

  mkdirSync(runDir(id), { recursive: true })
  const recordPath = runFile(id, 'record')
  writeRecord(recordPath, { episode, model: values.model, started: new Date().toISOString() })
  console.log(`${STEP}: ${values.model} is extracting "${episode.title}" (${id}). Log: ${relative(ROOT, runFile(id, 'log'))}`)

  const { result, failure } = await runClaude({ id, episode, model: values.model, timeoutMinutes })
  if (result) {
    updateRecord(recordPath, {
      result: { subtype: result.subtype, cost_usd: result.total_cost_usd ?? null, turns: result.num_turns ?? null, duration_ms: result.duration_ms ?? null },
    })
  }
  if (failure) abortRun(id, STEP, failure)
  const record = readRecord(recordPath)
  if (!record.finished) abortRun(id, STEP, 'the agent stopped without calling finish.')

  const cost = record.result?.cost_usd == null ? '' : `, $${record.result.cost_usd.toFixed(2)}`
  console.log(
    `${STEP}: ${plural(record.mentions, 'mention')}, ${plural(record.new_entries, 'new entry', 'new entries')}, ` +
      `${plural(record.warnings?.length ?? 0, 'warning')}, ${plural(record.complaints?.length ?? 0, 'complaint')} ` +
      `(${record.result?.turns ?? '?'} turns${cost}).`,
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await runStep(main)
