// Link markup in notes: [[type:target]]trail, or [[type?:target]] for an uncertain relation.
// Letters straight after "]]" (the trail) are part of the link text: [[see:ounce]]s reads
// "ounces". A target may end in " (gloss)" to name a glossed entry; the gloss isn't shown.

export const LINK_TYPES = ['from', 'gave', 'same-root', 'equivalent', 'unrelated', 'see']

const ANY_LINK = /\[\[((?:(?!\[\[).)*?)\]\]/g // the innermost [[...]]; a target may contain "]"
const TYPED_LINK = /^([a-z-]+)(\?)?:([^|]+)$/ // the inside of [[type:target]] or [[type?:target]]
const GLOSS = /\s*\([^()]*\)$/ // the " (gloss)" at the end of a target
const TRAIL = /^\p{L}*/u

/**
 * A note split into parts: plain strings, and links as { type, uncertain, target, text }, where
 * text is what the link shows. Malformed links (no type or target, or a |alias) become plain text.
 */
export function parseNote(note) {
  const parts = []
  const add = (text) => {
    if (!text) return
    if (typeof parts.at(-1) === 'string') parts[parts.length - 1] += text
    else parts.push(text)
  }
  let last = 0
  for (const m of (note ?? '').matchAll(ANY_LINK)) {
    add(note.slice(last, m.index))
    last = m.index + m[0].length
    const typed = m[1].match(TYPED_LINK)
    const target = typed?.[3].trim()
    if (!target) {
      const bar = m[1].indexOf('|')
      const alias = bar < 0 ? '' : m[1].slice(bar + 1)
      add((alias || (bar < 0 ? m[1] : m[1].slice(0, bar))).trim())
      continue
    }
    const trail = note.slice(last).match(TRAIL)[0]
    last += trail.length
    parts.push({ type: typed[1], uncertain: Boolean(typed[2]), target, text: target.replace(GLOSS, '') + trail })
  }
  add(note?.slice(last))
  return parts
}
