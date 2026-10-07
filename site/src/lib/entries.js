import { fold } from '#toolkit/model/slugs.js'

// Categories in display order. `label` tags an entry, `title` is its
// chip, and `noun` names a count of them in running text ("1,950 names"), with `one` its singular.
export const CATEGORIES = [
  { id: 'word', label: 'word', title: 'Words', noun: 'words', one: 'word' },
  { id: 'name', label: 'name', title: 'Names', noun: 'names', one: 'name' },
  { id: 'expression', label: 'expression', title: 'Expressions', noun: 'expressions', one: 'expression' },
  { id: 'about-language', label: 'about language', title: 'About language', noun: 'entries about language', one: 'entry about language' },
  { id: 'word-part', label: 'word part', title: 'Word parts', noun: 'word parts', one: 'word part' },
]
export const categoryById = new Map(CATEGORIES.map((c) => [c.id, c]))

// Original form and literal translation, minus any that merely restate the headword
// ("raining frogs" / "it's raining frogs" say the same thing twice).
const bare = (s) =>
  fold(s).replace(/^(to|it's|it is)\s+/, '').replace(/[^\p{L}\p{N}]/gu, '')
export function forms(entry) {
  const differs = (s) => s && bare(s) !== bare(entry.term)
  return {
    original: differs(entry.original) ? entry.original : null,
    translation: differs(entry.translation) ? entry.translation : null,
  }
}

// Roles in order of importance.
const ROLE_RANK = { subject: 0, aside: 1, mention: 2 }
// A missing or unknown role ranks last.
export const roleRank = (m) => ROLE_RANK[m.role] ?? Object.keys(ROLE_RANK).length

const LINK_TITLES = {
  from: 'from', gave: 'gave', 'same-root': 'same root', equivalent: 'equivalent',
  unrelated: 'unrelated', see: 'see also',
}
export const linkTitle = (type, uncertain) => {
  const title = LINK_TITLES[type] ?? type
  return uncertain ? `possibly ${title}` : title
}
