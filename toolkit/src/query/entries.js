// Facts about one entry, derived from its mentions.

/**
 * How many episodes the entry appears in: `discussed` counts those that discuss it (role subject
 * or aside), `all` also those that only point to it ("as we discussed in...").
 */
export function episodeCounts(entry) {
  const episodes = (mentions) => new Set(mentions.map((m) => m.episode_id)).size
  return { discussed: episodes(entry.mentions.filter((m) => m.role !== 'mention')), all: episodes(entry.mentions) }
}
