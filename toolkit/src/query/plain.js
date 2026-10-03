// Notes that name an entry in plain text, without linking to it.

import { slugText } from '../model/slugs.js'
import { noteParts } from './index.js'

// An inflection allowed after the last word: "ounce" also finds "ounces".
const INFLECTION = '(?:s|es|ed|d|ing|er|ers)?'

/**
 * The mentions of other entries whose notes name this entry's term or original form outside
 * links, as [{ entry, mention }], at most `limit`. Text is compared by slug, so case, accents
 * and punctuation don't matter, and a match must cover whole words.
 */
export function plainMentions(index, slug, { limit = Infinity } = {}) {
  const target = index.links.bySlug.get(slug)
  if (!target) return []
  const forms = new Set([target.term, target.original].map(slugText).filter(Boolean))
  const patterns = [...forms].map((form) => new RegExp(`(?:^|-)${form}${INFLECTION}(?:-|$)`, 'u'))
  const found = []
  for (const entry of index.data.entries) {
    if (entry === target) continue
    for (const mention of entry.mentions) {
      if (found.length >= limit) return found
      const texts = noteParts(index, mention).filter((p) => typeof p === 'string').map(slugText)
      if (texts.some((text) => patterns.some((re) => re.test(text)))) found.push({ entry, mention })
    }
  }
  return found
}
