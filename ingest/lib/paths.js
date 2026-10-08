// Where the pipeline reads and writes: the checkout these scripts are in.

import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = fileURLToPath(new URL('../../', import.meta.url))
export const DATA = join(ROOT, 'data')
export const INGEST = join(ROOT, 'ingest')
export const YOUTUBE = join(INGEST, '1-youtube') // step 1
export const TRANSCRIPTS = join(INGEST, '2-transcripts') // step 2
export const RUNS = join(INGEST, 'runs') // steps 3-5, one folder per episode, kept in git
export const FAILED = join(INGEST, 'failed') // runs that failed, not in git

// The files a run folder holds, named after the step that writes them.
export const RUN_FILES = {
  record: '3-record.json',
  log: '3-agent-log.md',
  verify: '4-verify.txt',
  report: '5-report.md',
}

export const runDir = (id) => join(RUNS, id)
export const runFile = (id, name) => join(RUNS, id, RUN_FILES[name])
export const transcriptPath = (id) => join(TRANSCRIPTS, `${id}.txt`)

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/

/** The video ID, or an error: it is used in paths and branch names. */
export function checkVideoId(id) {
  if (!VIDEO_ID.test(id ?? '')) throw new StepError(`"${id ?? ''}" is not a YouTube video ID (11 letters, digits, - or _).`)
  return id
}

/** A failure with a message for the person running the step; no stack trace is printed. */
export class StepError extends Error {}
