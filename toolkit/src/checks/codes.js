// Every problem code, with its level and what it means. Errors make data invalid: edits refuse
// to introduce them and `check` fails on them. Warnings are only reported. Refusals are never
// found in data: an edit throws them when it can't be applied at all.

export const CODES = {
  // Fields and values
  'entry-field': { level: 'error', about: 'an entry field is missing, unknown or of the wrong type' },
  'mention-field': { level: 'error', about: 'a mention field is missing, unknown or of the wrong type' },
  'episode-field': { level: 'error', about: 'an episode field is missing, unknown or of the wrong type' },
  'category-unknown': { level: 'error', about: 'an entry has no category, or one that is not in the list' },
  'role-unknown': { level: 'error', about: 'a mention has a role that is not subject, aside or mention' },
  'confidence-unknown': { level: 'error', about: 'a mention has a confidence that is not high or low' },
  // Entries, episodes and mentions
  'entry-empty': { level: 'error', about: 'an entry has no mentions' },
  'episode-duplicate': { level: 'error', about: 'two episodes have the same id' },
  'mention-episode-unknown': { level: 'error', about: 'a mention is of an episode that is not in episodes.json' },
  'mention-after-end': { level: 'error', about: "a mention's timestamp is after the end of the episode" },
  'mention-twice': { level: 'error', about: 'an entry has two mentions in one episode' },
  'timestamp-not-in-transcript': { level: 'error', about: "a mention's timestamp starts no line of the transcript" },
  // Slugs
  'slug-mismatch': { level: 'error', about: 'a slug is not the slug of its term and gloss' },
  'slug-duplicate': { level: 'error', about: 'two entries have the same slug' },
  // Links
  'link-malformed': { level: 'error', about: 'link markup without a type or target, with an |alias, or a stray [[ or ]]' },
  'link-type-unknown': { level: 'error', about: 'a link type that is not in LINK_TYPES' },
  'link-ambiguous': { level: 'error', about: 'a link target that only original forms match, several of them' },
  'link-needs-gloss': { level: 'error', about: 'a link target names a term without a gloss, and only glossed entries have that term' },
  'link-unresolved-close': { level: 'warning', about: 'a link target that resolves to nothing, but is close to an entry' },
  // Likely duplicates
  'duplicate-variant': { level: 'warning', about: 'two entries differ only by a leading article or "to", spacing or hyphens' },
  'duplicate-plural': { level: 'warning', about: 'two entries differ only by a plural ending' },
  'duplicate-spelling': { level: 'warning', about: 'two entries are spelt within one or two letters of each other' },
  'duplicate-contained': { level: 'warning', about: 'an expression of three or more words is part of another' },
  'duplicate-original': { level: 'warning', about: "an entry's term is another entry's original form" },
  // Notes
  'note-context': { level: 'warning', about: 'a note that reads as if next to other entries ("Another…", "Also…")' },
  // Refusals
  'unknown-entry': { level: 'error', refusal: true, about: 'no entry has the slug an edit names' },
  'unknown-episode': { level: 'error', refusal: true, about: 'no episode has the id an edit names' },
  'unknown-mention': { level: 'error', refusal: true, about: 'the entry has no mention in the episode an edit names' },
  'field-not-settable': { level: 'error', refusal: true, about: 'an edit was asked to set a field it does not set' },
  'merge-self': { level: 'error', refusal: true, about: 'an entry was to be merged into itself' },
  'link-taken': { level: 'error', refusal: true, about: "a new name would take links that resolve to another entry, e.g. by its original form" },
}

/** The codes problems() can find, i.e. all but the refusals. */
export const PROBLEM_CODES = Object.keys(CODES).filter((code) => !CODES[code].refusal)
export const REFUSAL_CODES = Object.keys(CODES).filter((code) => CODES[code].refusal)

/**
 * A problem: { level, code, message, slugs, mention?, episode?, detail? }. `slugs` are the
 * entries it is about, `mention` ({ slug, episode_id }) the mention, `episode` the episode id
 * for episode problems, and `detail` the link, field or value, which tells apart two problems of
 * one code in the same place.
 */
export function problem(code, message, slugs = [], { mention, episode, detail } = {}) {
  if (!CODES[code]) throw new Error(`Unknown problem code: ${code}`)
  const p = { level: CODES[code].level, code, message, slugs: [...slugs].sort() }
  if (mention) p.mention = { slug: mention.slug, episode_id: mention.episode_id }
  if (episode !== undefined) p.episode = episode
  if (detail !== undefined) p.detail = detail
  return p
}

/** A problem's identity: its code, slugs, mention, episode and detail, not its wording. */
export const problemKey = (p) =>
  JSON.stringify([p.code, p.slugs, p.mention?.slug ?? null, p.mention?.episode_id ?? null, p.episode ?? null, p.detail ?? null])
