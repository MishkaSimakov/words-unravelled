import { fileAs, fileLetter } from '#toolkit/model/slugs.js'
import { buildIndex, episodeCounts } from '#toolkit/query/index.js'
import { search as searchIndex } from '#toolkit/query/search.js'
import { dataUrl } from './paths.js'

export const SUGGESTION_COUNT = 12
export const PAGE_SIZE = 60

// Filled by load(); the layout renders the pages only once it has resolved.
export const db = {
  episodes: [],
  entries: [], // A to Z
  index: null, // the toolkit's lookups (query/index.js)
  latest: null,
  random: [],
}

export function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

let loading = null

/** Fetches and indexes the data, once. */
export function load() {
  loading ??= fetchData()
  return loading
}

async function fetchData() {
  const get = async (name) => {
    const res = await fetch(dataUrl(name))
    if (!res.ok) throw new Error(`${name}.json: HTTP ${res.status}`)
    return res.json()
  }
  const [episodes, entries] = await Promise.all([get('episodes'), get('entries')])

  db.episodes = [...episodes].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  db.latest = db.episodes[0] ?? null
  // A to Z by filing form, # first (digits, other scripts), so that each letter heading is one run.
  // Then "-able" before "able", and homographs side by side, the one without a gloss first.
  // One collator for the whole sort: localeCompare() with options builds a new one on every call.
  const { compare } = new Intl.Collator('en', { sensitivity: 'base' })
  for (const e of entries) {
    e.fileAs = fileAs(e.term)
    e.letter = fileLetter(e.fileAs)
  }
  db.entries = entries.sort(
    (a, b) =>
      (a.letter === '#') !== (b.letter === '#') ? (a.letter === '#' ? -1 : 1)
        : compare(a.fileAs, b.fileAs) || compare(a.term, b.term) || compare(a.gloss ?? '', b.gloss ?? ''),
  )
  // Built from the A-to-Z list, so lists in the index (backlinks, search ties) are A to Z too.
  db.index = buildIndex({ entries: db.entries, episodes: db.episodes })
  db.random = shuffle(db.entries).slice(0, SUGGESTION_COUNT)
}

export const search = (query) => searchIndex(db.index, query)

// Episodes that discuss the entry (`discussed`), and all episodes, including those that only
// point to it ("as we discussed in..."): the entry page lists the first under "Discussed in".
export const episodesOf = (entry) => episodeCounts(db.index, entry)
