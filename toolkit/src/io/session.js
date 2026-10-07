// Node only: editing the data files through the toolkit, as the review tool does. Every call
// reads the files from disk, so edits made by hand or by an agent in the meantime are never
// overwritten. An edit is previewed (its side effects), then applied to the very version the
// preview saw, and can be undone while the files are still as it left them.

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { sideEffects } from '../checks/effects.js'
import { problems } from '../checks/problems.js'
import { applySilenced, silence, unsilence } from '../checks/silenced.js'
import { applyEdits } from '../edit/batch.js'
import { ToolkitError } from '../edit/errors.js'
import { FILES, loadSilenced, saveData, saveSilenced, writeAtomic } from './files.js'

/**
 * An editing session on the data files in `dir`. Each method returns a result object:
 * - problems(): { version, active, silenced, stale }: the active problems (warnings too), the
 *   silenced ones, and the silenced records that match no problem (see applySilenced());
 * - silence(list), unsilence(problem): problems() after silencing the warnings in `list` (all
 *   or none) or lifting one's silence (or removing a stale record), or { problems } if refused;
 * - preview(ops): { version, effects } (see sideEffects()), or { problems } if refused;
 * - apply(ops, version): { version, undo }, the version saved and how many steps can be
 *   undone (at most UNDO_STEPS); { problems } if refused; { conflict } if the files are no longer `version`;
 * - undo(): { version, undo }, or { conflict } if there is nothing to undo or the files changed
 *   since the last apply.
 * `version` identifies the files' contents.
 */
export function editSession(dir) {
  const undos = [] // { before, after }: the files' texts before each apply, and the version it saved
  let found = null // { version, problems } of the last version checked

  const read = () => {
    const texts = Object.fromEntries(Object.entries(FILES).map(([key, name]) => [key, readFileSync(join(dir, name), 'utf8')]))
    return { texts, version: versionOf(texts), data: { entries: JSON.parse(texts.entries), episodes: JSON.parse(texts.episodes) } }
  }
  const problemsOf = (state) => {
    if (found?.version !== state.version) found = { version: state.version, problems: problems(state.data) }
    return found.problems
  }
  const refusals = (run) => {
    try {
      return run()
    } catch (error) {
      if (error instanceof ToolkitError) return { problems: error.problems }
      throw error
    }
  }

  const sorted = (state) => {
    const { active, silenced, stale } = applySilenced(problemsOf(state), loadSilenced(dir))
    return { version: state.version, active, silenced, stale }
  }
  const silencing = (change) => {
    const state = read()
    return refusals(() => {
      saveSilenced(dir, change(loadSilenced(dir), problemsOf(state)))
      return sorted(state)
    })
  }

  return {
    problems: () => sorted(read()),

    silence: (list) => silencing((records, found) => list.reduce((done, problem) => silence(done, problem, found), records)),

    unsilence: (problem) => silencing((records) => unsilence(records, problem)),

    preview(ops) {
      const state = read()
      return refusals(() => ({ version: state.version, effects: sideEffects(state.data, applyEdits(state.data, ops), { known: problemsOf(state) }) }))
    },

    apply(ops, version) {
      const state = read()
      if (state.version !== version) return { conflict: 'The data files changed since the preview. Review the edit again.' }
      return refusals(() => {
        saveData(dir, applyEdits(state.data, ops))
        const saved = read()
        undos.push({ before: state.texts, after: saved.version })
        if (undos.length > UNDO_STEPS) undos.shift()
        return { version: saved.version, undo: undos.length }
      })
    },

    undo() {
      const last = undos.at(-1)
      if (!last) return { conflict: 'There is nothing to undo in this session.' }
      const state = read()
      if (state.version !== last.after) return { conflict: 'The data files changed since the last edit, so it can no longer be undone here. Use git.' }
      for (const [key, name] of Object.entries(FILES)) if (state.texts[key] !== last.before[key]) writeAtomic(join(dir, name), last.before[key])
      undos.pop()
      return { version: versionOf(last.before), undo: undos.length }
    },
  }
}

// Each step keeps a copy of the files (some MB), so only the latest are kept.
const UNDO_STEPS = 20

const versionOf = (texts) => {
  const hash = createHash('sha256')
  for (const key of Object.keys(FILES)) hash.update(texts[key]).update('\0')
  return hash.digest('hex').slice(0, 16)
}
