// Node only: reading and writing the data files. Files are written whole and atomically (a
// temporary file renamed over the old one), with one-space JSON indentation, so a failed save
// leaves the old file as it was and git diffs show only what changed.

import { readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { silencedFileProblems } from '../checks/silenced.js'

export const FILES = { entries: 'entries.json', episodes: 'episodes.json' }
// The warnings silenced in review (checks/silenced.js); not part of the data the site shows.
export const SILENCED = 'silenced.json'

/** The text a value is saved as. */
export const formatJson = (value) => JSON.stringify(value, null, 1) + '\n'

/** { entries, episodes } from the data files in `dir`. */
export function loadData(dir) {
  const read = (name) => JSON.parse(readFileSync(join(dir, name), 'utf8'))
  return { entries: read(FILES.entries), episodes: read(FILES.episodes) }
}

/**
 * Writes `text` to `path` through a temporary file (`<path>.tmp`, ignored by git), so the old
 * file stays whole if anything fails.
 */
export function writeAtomic(path, text) {
  const tmp = `${path}.tmp`
  try {
    writeFileSync(tmp, text)
    renameSync(tmp, path)
  } catch (error) {
    try {
      rmSync(tmp, { force: true })
    } catch {} // e.g. the temporary path is a directory: not ours to remove
    throw error
  }
}

/** Saves { entries, episodes } to the data files in `dir`, skipping a file whose text is unchanged. */
export function saveData(dir, data) {
  for (const key of Object.keys(FILES)) {
    if (!Array.isArray(data?.[key])) throw new TypeError(`saveData: data.${key} must be an array`)
  }
  // Format both before writing either, so that a value that can't be saved writes nothing.
  const texts = Object.entries(FILES).map(([key, name]) => [join(dir, name), formatJson(data[key])])
  for (const [path, text] of texts) {
    let old = null
    try {
      old = readFileSync(path, 'utf8')
    } catch {}
    if (old !== text) writeAtomic(path, text)
  }
}

/** The silenced warnings' records from `dir`. Throws if the file isn't a list of valid records. */
export function loadSilenced(dir) {
  const records = JSON.parse(readFileSync(join(dir, SILENCED), 'utf8'))
  const found = silencedFileProblems(records)
  if (found.length) throw new TypeError(found.join('\n'))
  return records
}

/** Saves the silenced warnings' records to `dir`, like saveData(). */
export function saveSilenced(dir, records) {
  const found = silencedFileProblems(records)
  if (found.length) throw new TypeError(found.join('\n'))
  const path = join(dir, SILENCED)
  const text = formatJson(records)
  let old = null
  try {
    old = readFileSync(path, 'utf8')
  } catch {}
  if (old !== text) writeAtomic(path, text)
}
