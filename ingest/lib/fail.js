// Failing a run once it has started: nothing it did is kept in the working tree. data/ goes back
// to HEAD and the run folder moves to ingest/failed/, out of git, for a look at what happened.

import { existsSync, mkdirSync, renameSync } from 'node:fs'
import { join, relative } from 'node:path'
import { restoreData } from './git.js'
import { FAILED, ROOT, StepError, runDir } from './paths.js'

/** Undoes the run of episode `id` and exits with 1, saying which step failed and why. */
export function abortRun(id, step, reason) {
  const lines = [`${step} failed: ${reason}`]
  try {
    restoreData()
    lines.push('data/ is back as it is at HEAD.')
  } catch (error) {
    lines.push(`Restoring data/ failed too (${error.message.trim()}). Run: git checkout HEAD -- data && git clean -fd -- data`)
  }
  if (existsSync(runDir(id))) {
    mkdirSync(FAILED, { recursive: true })
    const to = join(FAILED, `${id}-${new Date().toISOString().replace(/[:.]/g, '-')}`)
    renameSync(runDir(id), to)
    lines.push(`The run's files are in ${relative(ROOT, to)}/.`)
  }
  console.error(lines.join('\n'))
  process.exit(1)
}

/**
 * Runs main(), printing a StepError's message without a stack trace. Errors before the run
 * started change nothing, so they need no undoing.
 */
export async function runStep(main) {
  try {
    await main()
  } catch (error) {
    if (!(error instanceof StepError)) throw error
    console.error(error.message)
    process.exit(1)
  }
}
