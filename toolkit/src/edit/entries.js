// Edits to an entry's own fields, and deleting entries.

import { ENTRY_KEYS, ordered } from '../model/schema.js'
import { commit, findEntry, onlyFields, replaceEntry } from './commit.js'

// Fields that don't change the slug; term and gloss do, so they have edits of their own.
const SETTABLE = ['original', 'translation', 'language', 'category']

/**
 * Sets an entry's original, translation, language or category. Links aren't rewritten: a link
 * that resolved by the old original form no longer does.
 */
export function setFields(data, slug, fields) {
  onlyFields(fields, SETTABLE, 'setFields')
  const entry = findEntry(data, slug)
  return commit(data, replaceEntry(data, slug, ordered(ENTRY_KEYS, { ...entry, ...fields })))
}

/** Deletes an entry with its mentions. Links to it are left as they are and show as plain text. */
export function deleteEntry(data, slug) {
  findEntry(data, slug)
  return commit(data, replaceEntry(data, slug, null))
}
