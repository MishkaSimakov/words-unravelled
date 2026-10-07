#!/usr/bin/env node
// Prints the video ID of the next episode to add, or nothing if there is none: the oldest of the
// channel's episodes newer than every episode in data/episodes.json that has no episode/<id>
// branch yet, locally or on origin (one in review). Used by new-episode.sh without an ID.
//   node lib/next-episode.js [--cookies FILE]

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { git } from './git.js'
import { DATA } from './paths.js'

const CHANNEL = 'https://www.youtube.com/@wordsunravelled/videos' // as in 1-download.sh
const MIN_MINUTES = Number(process.env.MIN_MINUTES ?? 15) // shorter videos are trailers and clips

/** The ID to add from the channel's videos, newest first ([{ id, duration }]); null if none. */
export function nextEpisode(videos, known, branches) {
  const newer = []
  for (const v of videos) {
    if (known.has(v.id)) break
    if (v.duration >= MIN_MINUTES * 60 && !branches.has(v.id)) newer.push(v.id)
  }
  return newer.at(-1) ?? null
}

const branchIds = (text) => new Set([...text.matchAll(/refs\/heads\/episode\/(\S+)/g)].map((m) => m[1]))

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cookies = process.argv[2] === '--cookies' ? ['--cookies', process.argv[3]] : []
  const lines = execFileSync('yt-dlp', [...cookies, '--flat-playlist', '--print', '%(id)s\t%(duration)s', CHANNEL], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  const videos = lines.split('\n').filter(Boolean).map((line) => {
    const [id, duration] = line.split('\t')
    return { id, duration: Number(duration) || 0 }
  })
  const known = new Set(JSON.parse(readFileSync(join(DATA, 'episodes.json'), 'utf8')).map((ep) => ep.id))
  let remote = ''
  try {
    remote = git('ls-remote', '--heads', 'origin', 'refs/heads/episode/*')
  } catch {} // no origin: only local branches count
  const branches = new Set([...branchIds(remote), ...branchIds(git('for-each-ref', '--format=%(refname)', 'refs/heads/episode/'))])
  const id = nextEpisode(videos, known, branches)
  if (id) console.log(id)
}
