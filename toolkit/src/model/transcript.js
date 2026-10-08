// Transcripts made by ingest/2-make-transcripts.py: one "[HH:MM:SS] text" line per caption.

const LINE_TIME = /^\[(\d+):(\d\d):(\d\d)\]/

/** The times, in seconds, at which the transcript's lines start. */
export function transcriptTimes(text) {
  const times = new Set()
  for (const line of (text ?? '').split('\n')) {
    const m = line.match(LINE_TIME)
    if (m) times.add(Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]))
  }
  return times
}
