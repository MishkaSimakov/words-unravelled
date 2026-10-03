// Warnings about likely duplicate entries, and the name keys they compare (also used to find
// entries close to a link target that resolves to nothing).

import { fold, slugText } from '../model/slugs.js'
import { groupBy } from '../query/groups.js'
import { problem } from './codes.js'

const LEADING = ['to-', 'a-', 'an-', 'the-']

/** A slug without a leading article or "to": "to-break-the-ice" -> "break-the-ice". */
export function core(slug) {
  const p = LEADING.find((p) => slug.startsWith(p) && slug.length > p.length)
  return p ? slug.slice(p.length) : slug
}

/** A rough singular of an English word: "ladies" -> "lady", "boxes" -> "box", "cats" -> "cat". */
export function singular(word) {
  if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y'
  if (word.length > 4 && word.endsWith('es') && /(s|x|z|ch|sh)$/.test(word.slice(0, -2))) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s') && !/(ss|us|is)$/.test(word)) return word.slice(0, -1)
  return word
}

const singularPhrase = (slug) => slug.replace(/[^-]+$/, singular)

/** Keys under which slugs that differ only by an article, spacing, hyphens, or also a plural ending, meet. */
export const variantKey = (slug) => core(slug).replace(/-/g, '')
export const pluralKey = (slug) => singularPhrase(core(slug)).replace(/-/g, '')

/** How far apart two spellings may be (in edits) and still count as variants; null if too short to compare. */
export function spellingLimit(a, b) {
  if (Math.min(a.length, b.length) < 5) return null
  return Math.min(a.length, b.length) >= 9 ? 2 : 1
}

/** Whether the Levenshtein distance between a and b is at most `limit`. */
export function withinDistance(a, b, limit) {
  if (Math.abs(a.length - b.length) > limit) return false
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur.push(Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] !== b[j - 1])))
    }
    if (Math.min(...cur) > limit) return false
    prev = cur
  }
  return prev[b.length] <= limit
}

export function duplicateProblems(entries) {
  const found = new Map() // "a b" -> problem; a pair gets the first reason found
  const bySlug = new Map(entries.map((e) => [e.slug, e]))
  // Same term, different glosses: told apart on purpose (meal-flour, meal-repast).
  const homographs = (a, b) =>
    fold(bySlug.get(a).term) === fold(bySlug.get(b).term) && fold(bySlug.get(a).gloss ?? '') !== fold(bySlug.get(b).gloss ?? '')
  const add = (a, b, code) => {
    if (a === b) return
    const [x, y] = [a, b].sort()
    const key = `${x} ${y}`
    if (found.has(key) || homographs(x, y)) return
    found.set(key, problem(code, `${x} and ${y} look like duplicates: ${pairReason[code]}.`, [x, y]))
  }
  const buckets = (keyOf, code) => {
    for (const group of groupBy(entries, (e) => keyOf(e.slug)).values()) {
      for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) add(group[i].slug, group[j].slug, code)
    }
  }

  buckets(variantKey, 'duplicate-variant')
  buckets(pluralKey, 'duplicate-plural')

  // Spelling variants: a small edit distance, compared within the same first letter.
  const keyed = entries.map((e) => [variantKey(e.slug), e.slug]).filter(([key]) => key.length >= 5)
  for (const items of groupBy(keyed, ([key]) => key[0]).values()) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const [[ka, a], [kb, b]] = [items[i], items[j]]
        if (withinDistance(ka, kb, spellingLimit(ka, kb))) add(a, b, 'duplicate-spelling')
      }
    }
  }

  // One expression inside another ("cat out of the bag" in "let the cat out of the bag"): the
  // shorter one, at least 3 words long, is a run of consecutive words in the longer one.
  for (const e of entries) {
    const words = e.slug.split('-')
    for (let i = 0; i < words.length; i++) {
      for (let j = i + 3; j <= words.length; j++) {
        const part = words.slice(i, j).join('-')
        if (j - i < words.length && bySlug.has(part)) add(part, e.slug, 'duplicate-contained')
      }
    }
  }

  // The same thing under two names: one entry's term is another entry's original form.
  const byOriginal = groupBy(entries.filter((e) => slugText(e.original)), (e) => slugText(e.original))
  for (const e of entries) {
    for (const other of byOriginal.get(slugText(e.term)) ?? []) add(e.slug, other.slug, 'duplicate-original')
  }
  return [...found.values()]
}

const pairReason = {
  'duplicate-variant': 'they differ only by an article or "to", spacing or hyphens',
  'duplicate-plural': 'they differ only by a plural ending',
  'duplicate-spelling': 'their spellings are one or two letters apart',
  'duplicate-contained': 'one expression is part of the other',
  'duplicate-original': "one's term is the other's original form",
}
