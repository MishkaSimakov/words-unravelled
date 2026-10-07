// The shape of the data: field order, allowed values, and entry names.

export const CATEGORIES = ['word', 'name', 'expression', 'about-language', 'word-part']
export const ROLES = ['subject', 'aside', 'mention']
export const CONFIDENCES = ['high', 'low']

// Keys in the order the data files keep them, so that new objects serialize like the old ones.
export const ENTRY_KEYS = ['slug', 'term', 'gloss', 'original', 'translation', 'language', 'category', 'mentions']
export const MENTION_KEYS = ['episode_id', 't', 'role', 'note', 'confidence']
export const EPISODE_KEYS = ['id', 'title', 'date', 'duration']

// The entry fields a caller gives when declaring a new entry (the slug is derived).
export const ENTRY_FIELDS = ['term', 'gloss', 'original', 'translation', 'language', 'category']

/** `fields` with its keys in `keys` order; `gloss` is left out when empty, other missing keys are null. */
export function ordered(keys, fields) {
  const out = {}
  for (const key of keys) {
    const value = fields[key] ?? null
    if (key === 'gloss' && value === null) continue
    out[key] = value
  }
  return out
}

/** An entry's name: the term, plus the gloss that tells it apart from homographs ("meal (flour)"). */
export const entryName = (entry) => (entry.gloss ? `${entry.term} (${entry.gloss})` : entry.term)
