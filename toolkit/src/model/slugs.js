// Slugs and the A-to-Z filing form of entries.

const INVISIBLE = /[­​-‏‪-‮⁠-⁤﻿]/g
// Letters that don't fold to a-z by dropping accents, spelt out.
const UNFOLDABLE = { ß: 'ss', æ: 'ae', œ: 'oe', ø: 'o', ł: 'l', đ: 'd', ð: 'd', þ: 'th', ı: 'i' }
const UNFOLDABLE_RE = new RegExp(`[${Object.keys(UNFOLDABLE).join('')}]`, 'g')

/** Lowercase, drop invisible characters, fold diacritics, anything that isn't a letter or digit to hyphens. */
export const slugify = (text) => slugText(text) || 'entry'

/** slugify() without the fallback: '' for text with no letters or digits. */
export function slugText(text) {
  return (text ?? '')
    .replace(INVISIBLE, '')
    .toLowerCase()
    .replace(UNFOLDABLE_RE, (c) => UNFOLDABLE[c])
    .replace(/&/g, ' and ')
    .normalize('NFKD')
    .replace(/\p{Mn}/gu, '')
    .replace(/['’‘`´]/g, '') // "don't" -> "dont", not "don-t"
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

/** The slug of an entry: its term, plus the gloss if it has one ("meal (flour)" -> meal-flour). */
export const entrySlug = (term, gloss = null) => slugify(gloss ? `${term} ${gloss}` : term)

/**
 * Lowercase and drop accents one character at a time, so indices in the result match the input:
 * a character whose folded form would be longer or shorter is kept as it is.
 */
export const fold = (s) =>
  [...(s ?? '')]
    .map((c) => {
      const folded = [...c.normalize('NFD')][0].toLowerCase()
      return folded.length === c.length ? folded : c
    })
    .join('')

/**
 * How an entry files in the A to Z: folded, with unfoldable letters spelt out as slugs spell them
 * and anything before the first letter or digit dropped, so "-able" files next to "able" and
 * "ælf" under A.
 */
export const fileAs = (term) =>
  fold(term).replace(UNFOLDABLE_RE, (c) => UNFOLDABLE[c]).replace(/^[^\p{L}\p{N}]+/u, '')

/** The letter heading an entry files under: A to Z, or # for digits and other scripts. */
export function fileLetter(filed) {
  const c = filed[0]?.toUpperCase() ?? ''
  return /[A-Z]/.test(c) ? c : '#'
}
