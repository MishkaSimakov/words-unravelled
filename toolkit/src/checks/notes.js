// Warnings about how notes read.

import { problem } from './codes.js'

// Openings that refer to the note's neighbours in the episode ("Another flat adverb"), which
// make no sense on the entry's page. "Also called" and "Also known as" read fine on their own.
const CONTEXT = /^(Another\b|Also\b(?! called\b| known\b)|One of the\b|The same\b)/

export function noteProblems(entries) {
  const found = []
  for (const entry of entries) {
    for (const m of entry.mentions) {
      const opening = m.note.match(CONTEXT)?.[0]
      if (!opening) continue
      found.push(
        problem('note-context', `${entry.slug} in ${m.episode_id}: the note starts with "${opening}", which may refer to other entries.`, [entry.slug], {
          mention: { slug: entry.slug, episode_id: m.episode_id },
        }),
      )
    }
  }
  return found
}
