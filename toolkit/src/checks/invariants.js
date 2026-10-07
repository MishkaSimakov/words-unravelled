// What changed between two versions of the data: used to check that an edit changed only what it
// should (the tests' helpers, and the verifier of the extraction agent's work).

import { parseNote, rewriteLinks } from '../model/links.js'
import { linkIndex, resolveLink } from '../query/links.js'

/** Every link in the data: "owner slug|episode id|n" (the nth link of that note) -> the slug it resolves to, or null. */
export function linkResolutions(data) {
  const index = linkIndex(data.entries)
  const out = new Map()
  for (const entry of data.entries) {
    for (const m of entry.mentions) {
      let n = 0
      for (const part of parseNote(m.note)) {
        if (typeof part !== 'string') out.set(`${entry.slug}|${m.episode_id}|${n++}`, resolveLink(index, part.target, entry.slug))
      }
    }
  }
  return out
}

/** Whether two notes are the same apart from the targets of their links. */
export const sameButTargets = (a, b) => rewriteLinks(a, () => '') === rewriteLinks(b, () => '')

// Equal as the data files would write them, key order included.
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/**
 * The changes from `before` to `after`, by slug and by mention ({ slug, episode_id }):
 * entries added, removed and changed, and mentions added, removed and changed. A mention whose
 * note differs only in link targets is listed in `retargeted` instead of `changed`.
 */
export function dataChanges(before, after) {
  const was = new Map(before.entries.map((e) => [e.slug, e]))
  const now = new Map(after.entries.map((e) => [e.slug, e]))
  const changes = {
    entries: { added: [], removed: [], changed: [] },
    mentions: { added: [], removed: [], changed: [], retargeted: [] },
  }
  const mentionsOf = (entry) => new Map((entry?.mentions ?? []).map((m) => [m.episode_id, m]))
  for (const slug of new Set([...was.keys(), ...now.keys()])) {
    const [a, b] = [was.get(slug), now.get(slug)]
    if (!a) changes.entries.added.push(slug)
    else if (!b) changes.entries.removed.push(slug)
    else if (!same(a, b)) changes.entries.changed.push(slug)
    if (a && b && a === b) continue
    const [ma, mb] = [mentionsOf(a), mentionsOf(b)]
    for (const episode_id of new Set([...ma.keys(), ...mb.keys()])) {
      const [x, y] = [ma.get(episode_id), mb.get(episode_id)]
      const at = { slug, episode_id }
      if (!x) changes.mentions.added.push(at)
      else if (!y) changes.mentions.removed.push(at)
      else if (same(x, y)) continue
      else if (same({ ...x, note: '' }, { ...y, note: '' }) && sameButTargets(x.note, y.note)) changes.mentions.retargeted.push(at)
      else changes.mentions.changed.push(at)
    }
  }
  return changes
}
