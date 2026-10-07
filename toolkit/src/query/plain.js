// Notes that name an entry in plain text, without linking to it. A note names an entry by its
// term or original form, compared without case or accents, as whole words.

import { formatLink, parseNote, plainSpans } from '../model/links.js'
import { entryName } from '../model/schema.js'
import { fold, slugText } from '../model/slugs.js'
import { addTo } from './groups.js'
import { linkIndex, resolveLink } from './links.js'

// An inflection allowed after the last word: "ounce" also finds "ounces".
const INFLECTIONS = ['', 's', 'es', 'ed', 'd', 'ing', 'er', 'ers']
const WORD = /[\p{L}\p{N}]+/gu
// What can't stand between the words of a term: the end of a sentence, clause or quotation.
const BREAK = /[.,;:!?()[\]{}"“”…]/u

/** The tokens from `i` on if they spell `words`, the last one perhaps inflected: { end, stem }, or null. */
function matchAt(text, tokens, i, words) {
  for (let j = 0; j < words.length; j++) {
    const token = tokens[i + j]
    if (!token) return null
    if (j > 0) {
      const before = tokens[i + j - 1]
      if (BREAK.test(text.slice(before.index + before[0].length, token.index))) return null
    }
    const ok = j === words.length - 1 ? INFLECTIONS.some((ending) => token[0] === words[j] + ending) : token[0] === words[j]
    if (!ok) return null
  }
  const last = tokens[i + words.length - 1]
  return { end: last.index + last[0].length, stem: last.index + words.at(-1).length }
}

/**
 * A finder of the places where a note names one of `entries` outside links: find(note) is
 * [{ entry, start, end, stem }] in note order, where note.slice(start, end) names the entry and
 * note.slice(start, stem) is that text without its inflection ("Eggcorns": stem is before the s).
 * A match inside a longer one is dropped: "rhyming slang" doesn't name slang.
 */
export function termFinder(entries) {
  const byFirst = new Map() // first word of a form -> [{ entry, words }]
  for (const entry of entries) {
    const forms = new Set([entry.term, entry.original].map((form) => fold(form).match(WORD)?.join(' ')).filter(Boolean))
    for (const form of forms) addTo(byFirst, form.split(' ')[0], { entry, words: form.split(' ') })
  }
  return (note) => {
    const found = []
    for (const [from, to] of plainSpans(note)) {
      const text = fold(note.slice(from, to))
      const tokens = [...text.matchAll(WORD)]
      tokens.forEach((token, i) => {
        for (const ending of INFLECTIONS) {
          if (!token[0].endsWith(ending) || token[0].length === ending.length) continue
          for (const { entry, words } of byFirst.get(token[0].slice(0, token[0].length - ending.length)) ?? []) {
            const match = matchAt(text, tokens, i, words)
            const start = from + token.index
            if (match && !found.some((f) => f.entry === entry && f.start === start)) {
              found.push({ entry, start, end: from + match.end, stem: from + match.stem })
            }
          }
        }
      })
    }
    const inside = (a, b) => a !== b && b.start <= a.start && a.end <= b.end && b.end - b.start > a.end - a.start
    return found.filter((a) => !found.some((b) => inside(a, b))).sort((a, b) => a.start - b.start)
  }
}

/**
 * The mentions of other entries whose notes name this entry's term or original form outside
 * links, as [{ entry, mention }], at most `limit`.
 */
export function plainMentions(index, slug, { limit = Infinity } = {}) {
  const target = index.links.bySlug.get(slug)
  if (!target) return []
  const find = termFinder([target])
  const found = []
  for (const entry of index.data.entries) {
    if (entry === target) continue
    for (const mention of entry.mentions) {
      if (found.length >= limit) return found
      if (find(mention.note).length) found.push({ entry, mention })
    }
  }
  return found
}

// The categories of entries a note should link wherever it names them: terms that describe other
// entries, like eggcorn or collective noun.
const LINKED_CATEGORIES = ['about-language']
// Shorter terms ("/s", "wh") are found inside too much else.
const MIN_LENGTH = 3

/**
 * The entries a note should link wherever it names them: those of LINKED_CATEGORIES with a term
 * of at least MIN_LENGTH letters or digits, but not names of languages (the `language` of some
 * entry), which notes name all the time ("from Latin").
 */
export function linkTargets(entries) {
  const languages = new Set(entries.map((e) => slugText(e.language)).filter(Boolean))
  return entries.filter(
    (e) => LINKED_CATEGORIES.includes(e.category) && slugText(e.term).replace(/-/g, '').length >= MIN_LENGTH && !languages.has(slugText(e.term)),
  )
}

/**
 * Where notes name a link target (linkTargets()) in plain text without linking to it anywhere in
 * the note: [{ entry, mention, target, text, note }], one for each note and target, at the first
 * place. `text` is what the note says there, and `note` the note with that text made a `see`
 * link that reads the same: "Eggcorns are" becomes "[[see:Eggcorn]]s are". The link names the
 * target by the note's own words if they resolve to it, with its gloss if it has one, else by
 * the target's name. An entry's own notes don't count.
 */
export function missingLinks(entries) {
  const find = termFinder(linkTargets(entries))
  const index = linkIndex(entries)
  const found = []
  for (const entry of entries) {
    for (const mention of entry.mentions) {
      const places = find(mention.note).filter((p) => p.entry !== entry)
      if (!places.length) continue
      const links = parseNote(mention.note).filter((part) => typeof part !== 'string')
      const linked = new Set(links.map((link) => resolveLink(index, link.target, entry.slug)))
      for (const { entry: target, start, end, stem } of places) {
        if (linked.has(target.slug)) continue
        linked.add(target.slug)
        const said = mention.note.slice(start, stem)
        const named = target.gloss ? `${said} (${target.gloss})` : said
        const link = formatLink({ type: 'see', target: resolveLink(index, named, entry.slug) === target.slug ? named : entryName(target) })
        const note = mention.note.slice(0, start) + link + mention.note.slice(stem)
        found.push({ entry, mention, target, text: mention.note.slice(start, end), note })
      }
    }
  }
  return found
}
