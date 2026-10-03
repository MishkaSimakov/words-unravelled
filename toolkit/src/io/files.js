// Node only: reading and writing the data files. Files are written whole and atomically (a
// temporary file renamed over the old one), with one-space JSON indentation, so a failed save
// leaves the old file as it was and git diffs show only what changed.

import { readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const FILES = { entries: 'entries.json', episodes: 'episodes.json' }

/** The text a value is saved as. */
export const formatJson = (value) => JSON.stringify(value, null, 1) + '\n'

/** { entries, episodes } from the data files in `dir`. */
export function loadData(dir) {
  const read = (name) => JSON.parse(readFileSync(join(dir, name), 'utf8'))
  return { entries: read(FILES.entries), episodes: read(FILES.episodes) }
}

/** Writes `text` to `path` through a temporary file, so the old file stays whole if anything fails. */
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
