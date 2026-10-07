// An episode's metadata (from step 1) and timestamps.

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { StepError, YOUTUBE } from './paths.js'

/** { id, title, date, duration } from the episode's .info.json in 1-youtube/. */
export function episodeMetadata(id) {
  let files = []
  try {
    files = readdirSync(YOUTUBE).filter((f) => f.endsWith(`[${id}].info.json`))
  } catch {}
  if (!files.length) throw new StepError(`No metadata for ${id} in ingest/1-youtube/. Run ingest/1-download.sh ${id}.`)
  const info = JSON.parse(readFileSync(join(YOUTUBE, files[0]), 'utf8'))
  const day = String(info.upload_date ?? '')
  const episode = {
    id,
    title: info.title,
    date: /^\d{8}$/.test(day) ? `${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6)}` : null,
    duration: Number.isInteger(info.duration) ? info.duration : Math.round(Number(info.duration)) || null,
  }
  const missing = Object.keys(episode).filter((k) => !episode[k])
  if (missing.length) throw new StepError(`The metadata of ${id} (${files[0]}) has no ${missing.join(', ')}.`)
  return episode
}

const TIMESTAMP = /^(\d\d):([0-5]\d):([0-5]\d)$/

/** Seconds from "HH:MM:SS", or null if it isn't one. */
export function parseTimestamp(text) {
  const m = String(text ?? '').match(TIMESTAMP)
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null
}

/** "HH:MM:SS" from seconds. */
export const formatTimestamp = (t) => [Math.floor(t / 3600), Math.floor(t / 60) % 60, t % 60].map((n) => String(n).padStart(2, '0')).join(':')
