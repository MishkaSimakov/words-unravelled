// Edits to episodes.

import { EPISODE_KEYS, ordered } from '../model/schema.js'
import { commit, onlyFields } from './commit.js'

/** Adds an episode ({ id, title, date, duration }), newest first like the file. */
export function addEpisode(data, episode) {
  onlyFields(episode, EPISODE_KEYS, 'addEpisode')
  const added = ordered(EPISODE_KEYS, episode)
  const at = data.episodes.findIndex((ep) => ep.date < added.date)
  const episodes = [...data.episodes]
  episodes.splice(at < 0 ? episodes.length : at, 0, added)
  return commit(data, { ...data, episodes })
}
