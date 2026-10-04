// The one flow every change goes through: preview the edit list on the dev server, show its side
// effects (EditHost), apply it once confirmed, reload the data, and offer to undo it.
import { goto } from '$app/navigation'
import { reload } from '../db.js'
import * as api from './api.js'

// The edit waiting for confirmation: its preview's `result` is { version, effects }, or why it
// can't be applied ({ problems }, { conflict } or { error }).
export const pending = $state({ title: '', ops: null, result: null, busy: false, then: null })

// The merge being set up in MergeDialog, by slug (`into` null until chosen). Slugs, not entries:
// the toolkit's index looks entries up by identity, which a state proxy would break.
export const merging = $state({ from: null, into: null })

export function openMerge(from, into = null) {
  Object.assign(merging, { from, into })
}

// The last change saved or undone, for the banner.
export const saved = $state({ message: '', introduced: [], undo: 0 })

// The page each undoable change was made on, latest last, to go back to when it is undone. A
// page reload forgets them; the server's undo stack is kept.
const pages = []

/**
 * Previews `ops` ([{ op, args }]) and asks for confirmation. `then` runs after the change is
 * saved and the data reloaded, e.g. to go to an entry's new page.
 */
export async function propose(title, ops, { then = null } = {}) {
  const asked = ++proposals
  Object.assign(pending, { title, ops, result: null, busy: true, then })
  const result = await api.preview(ops)
  // Unless the dialog was closed, or another edit proposed, in the meantime.
  if (asked === proposals && pending.ops) Object.assign(pending, { result, busy: false })
}
let proposals = 0

export async function confirm() {
  const { title, ops, result, then } = pending
  pending.busy = true
  const applied = await api.apply(ops, result.version)
  if (!applied.version) {
    Object.assign(pending, { result: applied, busy: false })
    return
  }
  pages.push(location.href)
  pages.splice(0, Math.max(0, pages.length - applied.undo))
  close()
  await reload()
  Object.assign(saved, { message: `${title}: saved.`, introduced: result.effects.introduced, undo: applied.undo })
  await then?.()
}

export function close() {
  Object.assign(pending, { title: '', ops: null, result: null, busy: false, then: null })
}

export async function undoLast() {
  const result = await api.undo()
  if (!result.version) {
    Object.assign(saved, { message: result.conflict ?? result.error, introduced: [] })
    return
  }
  await reload()
  const back = pages.pop()
  Object.assign(saved, { message: 'Undone.', introduced: [], undo: result.undo })
  if (back && back !== location.href) await goto(back)
}

export function dismiss() {
  Object.assign(saved, { message: '', introduced: [] })
}
