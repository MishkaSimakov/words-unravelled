// A list of edits applied as one: all of them or none.

import { addEpisode } from './episodes.js'
import { deleteEntry, setFields } from './entries.js'
import { refuse } from './errors.js'
import { mergeEntries } from './merges.js'
import { addMention, deleteMention, editMention, replaceEpisodeMentions } from './mentions.js'
import { renameEntry, setGloss } from './names.js'

/** The edits applyEdits() runs, by name. */
export const EDITS = {
  addEpisode,
  replaceEpisodeMentions,
  addMention,
  editMention,
  deleteMention,
  setFields,
  deleteEntry,
  setGloss,
  renameEntry,
  mergeEntries,
}

/**
 * `data` after the edits `ops` ([{ op, args }], e.g. { op: 'setFields', args: [slug, fields] }),
 * in order. Edits never change their input, so when one refuses, the ToolkitError leaves
 * nothing applied.
 */
export function applyEdits(data, ops) {
  if (!Array.isArray(ops)) refuse('unknown-edit', 'Edits must be a list of { op, args }.')
  return ops.reduce((current, item) => {
    const { op, args } = item ?? {}
    if (!Object.hasOwn(EDITS, op ?? '') || !Array.isArray(args)) {
      refuse('unknown-edit', `${JSON.stringify(item)} is not { op, args: [...] } with an edit in EDITS.`, [], { detail: String(op) })
    }
    return EDITS[op](current, ...args)
  }, data)
}
