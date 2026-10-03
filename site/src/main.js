import Fuse from 'fuse.js'
import '@fontsource-variable/fraunces/opsz.css'
import '@fontsource-variable/fraunces/opsz-italic.css'
import '@fontsource-variable/source-serif-4/opsz.css'
import '@fontsource-variable/source-serif-4/opsz-italic.css'
import './style.css'

const SITE = 'Wordhoard'
const BASE = import.meta.env.BASE_URL // '/' locally, '/<repo>/' on GitHub Pages
// Extra information for checking the data, shown by `npm run dev` only; `npm run build` drops it.
const DEBUG = import.meta.env.DEV
const main = document.getElementById('main')

const SUGGESTION_COUNT = 12
const PAGE_SIZE = 60

const db = {
  episodes: [],
  entries: [],
  bySlug: new Map(),
  linkedFrom: new Map(), // slug -> entries whose notes link to it
  episodeById: new Map(),
  byEpisode: new Map(), // episode id -> [{ entry, mention }] in timestamp order
  latest: null,
  fuse: null,
  random: [],
}

// Categories in display order (data/build.py's CATEGORIES). `label` tags an entry, `title` is its
// chip, and `noun` names a count of them in running text ("1,950 names"), with `one` its singular.
const CATEGORIES = [
  { id: 'word', label: 'word', title: 'Words', noun: 'words', one: 'word' },
  { id: 'name', label: 'name', title: 'Names', noun: 'names', one: 'name' },
  { id: 'expression', label: 'expression', title: 'Expressions', noun: 'expressions', one: 'expression' },
  { id: 'about-language', label: 'about language', title: 'About language', noun: 'entries about language', one: 'entry about language' },
  { id: 'word-part', label: 'word part', title: 'Word parts', noun: 'word parts', one: 'word part' },
]
const categoryById = new Map(CATEGORIES.map((c) => [c.id, c]))

// ---------------------------------------------------------------------------
// Helpers

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c])
const href = (path = '') => BASE + path
const fmtNumber = (n) => n.toLocaleString('en-US')
const plural = (n, one, many = one + 's') => `${fmtNumber(n)} ${n === 1 ? one : many}`

function fmtTime(t) {
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = String(t % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

function fmtDate(date) {
  if (!date) return ''
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

// Fold one character at a time, so indices in the folded string match the original.
const fold = (s) =>
  [...(s ?? '')].map((c) => c.normalize('NFD')[0].toLowerCase()).join('')

// Letters that don't fold to a-z, spelt out as data/build.py's slugs spell them.
const UNFOLDABLE = { ß: 'ss', æ: 'ae', œ: 'oe', ø: 'o', ł: 'l', đ: 'd', ð: 'd', þ: 'th', ı: 'i' }
// How an entry files in the A to Z: folded, with those letters spelt out and anything before the
// first letter or digit dropped, so "-able" files next to "able" and "ælf" under A.
const fileAs = (term) =>
  fold(term).replace(/[ßæœøłđðþı]/g, (c) => UNFOLDABLE[c]).replace(/^[^\p{L}\p{N}]+/u, '')
// The letter heading an entry goes under: A to Z, or # for digits and other scripts.
const fileLetter = (filed) => {
  const c = filed[0]?.toUpperCase() ?? ''
  return /[A-Z]/.test(c) ? c : '#'
}

// Original form and literal translation, minus any that merely restate the headword
// ("raining frogs" / "it's raining frogs" say the same thing twice).
const bare = (s) =>
  fold(s).replace(/^(to|it's|it is)\s+/, '').replace(/[^\p{L}\p{N}]/gu, '')
function forms(entry) {
  const differs = (s) => s && bare(s) !== bare(entry.term)
  return {
    original: differs(entry.original) ? entry.original : null,
    translation: differs(entry.translation) ? entry.translation : null,
  }
}

function highlight(text, query) {
  const q = fold(query.trim())
  const i = q ? fold(text).indexOf(q) : -1
  if (i < 0) return esc(text)
  const chars = [...text]
  return (
    esc(chars.slice(0, i).join('')) +
    `<mark>${esc(chars.slice(i, i + q.length).join(''))}</mark>` +
    esc(chars.slice(i + q.length).join(''))
  )
}

// An entry's name: the term, plus the gloss that tells it apart from homographs ("meal (flour)").
const nameText = (entry) => (entry.gloss ? `${entry.term} (${entry.gloss})` : entry.term)
const nameHtml = (entry, query = '') =>
  highlight(entry.term, query) + (entry.gloss ? ` <span class="hw-gloss">(${esc(entry.gloss)})</span>` : '')

const LINK_TITLES = {
  from: 'from', gave: 'gave', 'same-root': 'same root', equivalent: 'equivalent',
  unrelated: 'unrelated', see: 'see also',
}
const linkTitle = (type, uncertain) => {
  const title = LINK_TITLES[type] ?? type
  return uncertain ? `possibly ${title}` : title
}

/**
 * A mention's note with its links turned into entry links. data/build.py gives the note as plain text
 * and each link's position in it (`start`, `end`) and resolved `slug`, so notes are never parsed
 * here. Links to things that aren't entries, links back to `self`, and all links when `links` is
 * false (e.g. inside another <a>) stay plain text.
 */
function noteHtml(mention, { links = true, self = null } = {}) {
  const note = mention.note ?? ''
  let html = ''
  let last = 0
  for (const link of mention.links ?? []) {
    const text = note.slice(link.start, link.end)
    const entry = links && link.slug ? db.bySlug.get(link.slug) : null
    html += esc(note.slice(last, link.start))
    html += entry && entry !== self
      ? `<a class="note-link" href="${href(`entry/${encodeURIComponent(entry.slug)}`)}"` +
        ` data-type="${esc(link.type)}"${link.uncertain ? ' data-uncertain' : ''}` +
        ` title="${esc(linkTitle(link.type, link.uncertain) + (entry.gloss ? `: ${nameText(entry)}` : ''))}">${esc(text)}</a>`
      : esc(text)
    last = link.end
  }
  return html + esc(note.slice(last))
}

// An entry's category as a small label; on the entry page it links to the category.
function categoryTag(entry, { link = false } = {}) {
  const cat = categoryById.get(entry.category)
  if (!cat) return ''
  return link
    ? `<a class="cat" href="${href(`?cat=${cat.id}`)}" title="Browse all ${cat.noun}">${esc(cat.label)}</a>`
    : `<span class="cat">${esc(cat.label)}</span>`
}

// Roles in order of importance.
const ROLE_RANK = { subject: 0, aside: 1, mention: 2 }
// A missing or unknown role (data/build.py warns about it) ranks last, as in build.py's role_rank().
const roleRank = (m) => ROLE_RANK[m.role] ?? Object.keys(ROLE_RANK).length

// Debug only: a mention's role, or the roles of all an entry's mentions ("subject · aside ×2").
const roleBadge = (role, text = role) =>
  DEBUG ? `<span class="role-badge" data-role="${esc(role)}">${esc(text)}</span>` : ''
function roleBadges(entry) {
  if (!DEBUG) return ''
  const counts = new Map()
  for (const m of [...entry.mentions].sort((a, b) => roleRank(a) - roleRank(b))) {
    counts.set(m.role, (counts.get(m.role) ?? 0) + 1)
  }
  return [...counts].map(([role, n]) => roleBadge(role, `${role}${n > 1 ? ` ×${n}` : ''}`)).join('')
}

function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const youtubeUrl = (id, t) => `https://www.youtube.com/watch?v=${id}${t ? `&t=${t}s` : ''}`
const thumbUrl = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`

// Seconds of lead-in before a mention's timestamp, so playback starts just before the term comes up.
const LEAD_IN = 3

/** A YouTube thumbnail that turns into a player when clicked (nothing loads from YouTube's player until then). */
function player(videoId, t, label) {
  const start = Math.max(0, t - LEAD_IN)
  return `
    <div class="player" data-video="${esc(videoId)}" data-start="${start}">
      <button type="button" class="player-cover" aria-label="${esc(label)}">
        <img src="${thumbUrl(videoId)}" alt="" loading="lazy" width="480" height="360" />
        <span class="player-play"><span class="play-icon" aria-hidden="true"></span>${esc(label)}</span>
      </button>
    </div>`
}

function startPlayer(el, start = Number(el.dataset.start)) {
  const params = new URLSearchParams({ start: String(start), autoplay: '1', rel: '0', modestbranding: '1' })
  el.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${el.dataset.video}?${params}"
    title="YouTube video player" allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
    allowfullscreen></iframe>`
  el.classList.add('is-playing')
}

let youtubeApi = null

/** The YouTube IFrame Player API, loaded on first use. */
function loadYoutubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  youtubeApi ??= new Promise((resolve, reject) => {
    window.onYouTubeIframeAPIReady = () => resolve(window.YT)
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.onerror = () => {
      youtubeApi = null
      script.remove()
      reject(new Error('Could not load the YouTube player API'))
    }
    document.head.append(script)
  })
  return youtubeApi
}

/**
 * Like startPlayer(), but through the IFrame API so the page can read the playback position.
 * Resolves to the YT.Player, or to null if the API is blocked and a plain embed was used instead.
 */
async function startApiPlayer(el, start = Number(el.dataset.start)) {
  let YT
  try {
    YT = await loadYoutubeApi()
  } catch (err) {
    console.warn(err)
    startPlayer(el, start)
    return null
  }
  el.innerHTML = '<div></div>'
  el.classList.add('is-playing')
  return new Promise((resolve) => {
    const yt = new YT.Player(el.firstElementChild, {
      host: 'https://www.youtube-nocookie.com',
      videoId: el.dataset.video,
      playerVars: { start: Math.floor(start), autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
      events: { onReady: () => resolve(yt) },
    })
  })
}

// ---------------------------------------------------------------------------
// Data

async function load() {
  const get = async (name) => {
    const res = await fetch(href(`data/${name}.json`))
    if (!res.ok) throw new Error(`${name}.json: HTTP ${res.status}`)
    return res.json()
  }
  const [episodes, entries] = await Promise.all([get('episodes'), get('entries')])

  db.episodes = [...episodes].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  db.latest = db.episodes[0] ?? null
  for (const ep of db.episodes) {
    db.episodeById.set(ep.id, ep)
    db.byEpisode.set(ep.id, [])
  }
  // A to Z by filing form, # first (digits, other scripts), so that each letter heading is one run.
  // Then "-able" before "able", and homographs side by side, the one without a gloss first.
  const compare = (a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })
  for (const e of entries) {
    e.fileAs = fileAs(e.term)
    e.letter = fileLetter(e.fileAs)
  }
  db.entries = entries.sort(
    (a, b) =>
      (a.letter === '#') !== (b.letter === '#') ? (a.letter === '#' ? -1 : 1)
        : compare(a.fileAs, b.fileAs) || compare(a.term, b.term) || compare(a.gloss ?? '', b.gloss ?? ''),
  )
  for (const entry of db.entries) {
    // Episodes that discuss the entry, and all episodes, including those that only point to it
    // ("as we discussed in..."): the entry page lists the first under "Discussed in".
    entry.episodeCount = new Set(entry.mentions.filter((m) => m.role !== 'mention').map((m) => m.episode_id)).size
    entry.allEpisodeCount = new Set(entry.mentions.map((m) => m.episode_id)).size
    entry.mentionOnly = entry.episodeCount === 0
    db.bySlug.set(entry.slug, entry)
    for (const mention of entry.mentions) db.byEpisode.get(mention.episode_id)?.push({ entry, mention })
  }
  for (const list of db.byEpisode.values()) list.sort((a, b) => a.mention.t - b.mention.t)
  for (const entry of db.entries) {
    for (const link of entry.mentions.flatMap((m) => m.links ?? [])) {
      if (!link.slug || link.slug === entry.slug) continue
      if (!db.linkedFrom.has(link.slug)) db.linkedFrom.set(link.slug, new Set())
      db.linkedFrom.get(link.slug).add(entry)
    }
  }

  db.fuse = new Fuse(db.entries, {
    keys: [
      { name: 'term', weight: 3 },
      { name: 'gloss', weight: 0.5 },
      { name: 'original', weight: 1.5 },
      { name: 'translation', weight: 1 },
    ],
    threshold: 0.34,
    ignoreLocation: true,
    ignoreDiacritics: true,
    includeScore: true,
  })
  db.random = shuffle(db.entries).slice(0, SUGGESTION_COUNT)
}

function search(query) {
  const q = fold(query.trim())
  // Fuse ranks by fuzziness only; put exact and prefix matches of the term first, and within
  // each tier, entries that are only ever mentioned after those that are discussed.
  const tier = (e) => {
    const t = fold(e.term)
    return t === q ? 0 : t.startsWith(q) ? 1 : 2
  }
  return db.fuse
    .search(query.trim())
    .map((r) => ({ entry: r.item, score: r.score, tier: tier(r.item) }))
    .sort((a, b) => a.tier - b.tier || a.entry.mentionOnly - b.entry.mentionOnly || a.score - b.score)
    .map((r) => r.entry)
}

// ---------------------------------------------------------------------------
// Shared fragments

function entryItem(entry, query = '') {
  const { original, translation } = forms(entry)
  const extra = []
  if (original) extra.push(`<i>${highlight(original, query)}</i>`)
  if (translation) extra.push(`‘${highlight(translation, query)}’`)
  const mention = [...entry.mentions].sort((a, b) => roleRank(a) - roleRank(b))[0]
  return `
    <li>
      <a class="result" href="${href(`entry/${encodeURIComponent(entry.slug)}`)}">
        <span class="result-head">
          <span class="hw">${nameHtml(entry, query)}</span>
          <span class="result-class">
            ${categoryTag(entry)}
            ${entry.language ? `<span class="lang">${esc(entry.language)}</span>` : ''}
          </span>
        </span>
        ${extra.length ? `<span class="result-forms">${extra.join(' · ')}</span>` : ''}
        ${mention?.note ? `<span class="result-note">${noteHtml(mention, { links: false })}</span>` : ''}
        <span class="result-count">${
          entry.mentionOnly ? `Mentioned in ${plural(entry.allEpisodeCount, 'episode')}` : plural(entry.episodeCount, 'episode')
        } ${roleBadges(entry)}</span>
      </a>
    </li>`
}

function entryList(entries, query = '', { letters = false } = {}) {
  if (!letters) return `<ol class="results">${entries.map((e) => entryItem(e, query)).join('')}</ol>`
  // Dictionary-style browsing: group under initial letters.
  let html = ''
  let current = null
  for (const e of entries) {
    if (e.letter !== current) {
      if (current !== null) html += '</ol>'
      html += `<h3 class="letter">${e.letter}</h3><ol class="results">`
      current = e.letter
    }
    html += entryItem(e)
  }
  return html + (current !== null ? '</ol>' : '')
}

function setTitle(title) {
  document.title = title ? `${title} · ${SITE}` : `${SITE}: an unofficial Words Unravelled index`
}

// ---------------------------------------------------------------------------
// Home

function home(params) {
  setTitle('')
  const langCounts = new Map()
  for (const e of db.entries) {
    if (e.language) langCounts.set(e.language, (langCounts.get(e.language) ?? 0) + 1)
  }
  const languages = [...langCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

  const state = {
    q: params.get('q') ?? '',
    lang: params.get('lang') ?? '',
    cat: categoryById.has(params.get('cat')) ? params.get('cat') : '',
    all: params.has('all'),
    limit: PAGE_SIZE,
  }

  main.innerHTML = `
    <section class="hero">
      <h1 class="hero-title">An unofficial index to <em class="podcast">Words Unravelled</em></h1>
      <p class="hero-sub">Every word they’ve unravelled, and where to hear it.</p>
      <p class="stats">
        <strong>${fmtNumber(db.entries.length)}</strong> entries from
        <strong>${fmtNumber(db.episodes.length)}</strong> episodes
      </p>
    </section>

    <form class="search" role="search" autocomplete="off">
      <label class="visually-hidden" for="q">Search entries</label>
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>
        <input id="q" name="q" type="search" value="${esc(state.q)}" spellcheck="false"
          placeholder="Search the hoard…" aria-describedby="result-status" />
        <kbd class="search-kbd" aria-hidden="true">/</kbd>
      </div>
      <div class="filters">
        <div class="chips" role="group" aria-label="Kind of entry">
          ${[{ id: '', title: 'All' }, ...CATEGORIES]
            .map((c) => `<button type="button" class="chip" data-cat="${c.id}" aria-pressed="${c.id === state.cat}">
                ${esc(c.title)} <span class="chip-count"></span></button>`)
            .join('')}
        </div>
        <label class="lang-select">
          <span class="visually-hidden">Language</span>
          <select name="lang">
            <option value="">All languages</option>
            ${languages
              .map(([l, n]) => `<option value="${esc(l)}" ${l === state.lang ? 'selected' : ''}>${esc(l)} (${n})</option>`)
              .join('')}
          </select>
        </label>
      </div>
    </form>
    <p id="result-status" class="result-status" aria-live="polite"></p>
    <div id="results"></div>`

  const form = main.querySelector('form')
  const input = form.querySelector('#q')
  const select = form.querySelector('select')
  const results = main.querySelector('#results')
  const status = main.querySelector('#result-status')
  const chipRow = form.querySelector('.chips')
  const chips = [...chipRow.children]

  const syncUrl = () => {
    const p = new URLSearchParams()
    if (state.q) p.set('q', state.q)
    if (state.lang) p.set('lang', state.lang)
    if (state.cat) p.set('cat', state.cat)
    if (state.all && !state.q && !state.lang && !state.cat) p.set('all', '')
    const qs = p.toString().replace(/=(&|$)/g, '$1')
    history.replaceState(history.state, '', href(qs ? `?${qs}` : ''))
  }

  const update = () => {
    const q = state.q.trim()
    // The chips count what the search and language filter leave, so they show where matches are.
    const base = (q ? search(q) : db.entries).filter((e) => !state.lang || e.language === state.lang)
    const counts = new Map()
    for (const e of base) counts.set(e.category, (counts.get(e.category) ?? 0) + 1)
    for (const chip of chips) {
      const n = chip.dataset.cat ? (counts.get(chip.dataset.cat) ?? 0) : base.length
      chip.setAttribute('aria-pressed', String(chip.dataset.cat === state.cat))
      chip.classList.toggle('is-empty', n === 0)
      chip.querySelector('.chip-count').textContent = fmtNumber(n)
    }
    const cat = categoryById.get(state.cat)
    const found = cat ? base.filter((e) => e.category === cat.id) : base

    if (q) {
      status.textContent = found.length
        ? `${plural(found.length, 'match', 'matches')} for “${q}”${cat ? ` among ${cat.noun}` : ''}`
        : ''
      results.innerHTML = found.length
        ? entryList(found.slice(0, state.limit), q) + more(found.length)
        : `<div class="empty"><p class="empty-title">Nothing in the hoard for “${esc(q)}”${cat ? ` among ${esc(cat.noun)}` : ''}.</p>
           <p>It may not have come up on the show yet, or the captions misheard it. Try a shorter
           spelling${state.lang || cat ? ', or clear the filters' : ''}.</p></div>`
    } else if (state.lang || cat || state.all) {
      status.textContent = `${cat ? plural(found.length, cat.one, cat.noun) : plural(found.length, 'entry', 'entries')}, A to Z`
      results.innerHTML = entryList(found.slice(0, state.limit), '', { letters: true }) + more(found.length)
    } else {
      status.textContent = ''
      results.innerHTML = suggestions()
    }
  }

  const more = (total) =>
    total > state.limit
      ? `<button type="button" class="more" data-more>Show more (${fmtNumber(total - state.limit)} left)</button>`
      : ''

  input.addEventListener('input', () => {
    state.q = input.value
    state.limit = PAGE_SIZE
    syncUrl()
    update()
  })
  form.addEventListener('submit', (ev) => {
    ev.preventDefault()
    results.querySelector('a.result')?.click()
  })
  // On narrow screens the chip row scrolls sideways: fade its edge while more chips are hidden, and
  // bring the selected chip into view (a link to ?cat=word-part selects the last one).
  const fadeChips = () =>
    chipRow.classList.toggle('has-more', chipRow.scrollLeft + chipRow.clientWidth < chipRow.scrollWidth - 1)
  chipRow.addEventListener('scroll', fadeChips, { passive: true })
  new ResizeObserver(fadeChips).observe(chipRow)
  document.fonts.ready.then(() => {
    const row = chipRow.getBoundingClientRect()
    const pressed = chips.find((c) => c.dataset.cat === state.cat).getBoundingClientRect()
    if (pressed.right > row.right) chipRow.scrollLeft += pressed.left - row.left - 24
  })

  chipRow.addEventListener('click', (ev) => {
    const chip = ev.target.closest('.chip')
    if (!chip) return
    // Pressing the selected category again goes back to all of them.
    state.cat = chip.dataset.cat === state.cat ? '' : chip.dataset.cat
    state.limit = PAGE_SIZE
    syncUrl()
    update()
  })
  select.addEventListener('change', () => {
    state.lang = select.value
    state.limit = PAGE_SIZE
    syncUrl()
    update()
  })
  results.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-more]')) {
      state.limit += PAGE_SIZE * 4
      update()
    } else if (ev.target.closest('[data-shuffle]')) {
      db.random = shuffle(db.entries).slice(0, SUGGESTION_COUNT)
      update()
    } else if (ev.target.closest('[data-all]')) {
      state.all = true
      syncUrl()
      update()
    }
  })
  // Arrow keys move between the search box and the results.
  main.addEventListener('keydown', (ev) => {
    if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return
    const links = [...results.querySelectorAll('a.result')]
    const i = links.indexOf(document.activeElement)
    if (document.activeElement === input && ev.key === 'ArrowDown' && links.length) {
      ev.preventDefault()
      links[0].focus()
    } else if (i >= 0) {
      ev.preventDefault()
      const next = ev.key === 'ArrowDown' ? links[i + 1] : links[i - 1]
      ;(next ?? (ev.key === 'ArrowUp' ? input : links[i])).focus()
    }
  })

  update()
  if (state.q) input.focus()
}

function suggestions() {
  const recurring = db.entries
    .filter((e) => e.episodeCount > 1)
    .sort((a, b) => b.episodeCount - a.episodeCount || a.term.localeCompare(b.term))
    .slice(0, SUGGESTION_COUNT)
  const latest = db.latest ? (db.byEpisode.get(db.latest.id) ?? []) : []
  const latestPick = latest.filter((_, i) => i % Math.max(1, Math.floor(latest.length / SUGGESTION_COUNT)) === 0)

  let html = ''
  if (recurring.length) {
    html += `
      <section class="suggest">
        <h2 class="section-title"><span>Heard again and again</span></h2>
        <p class="section-sub">Entries that came up in more than one episode.</p>
        ${entryList(recurring)}
      </section>`
  }
  if (db.latest && latestPick.length) {
    html += `
      <section class="suggest">
        <h2 class="section-title"><span>From the latest episode</span></h2>
        <p class="section-sub"><a href="${href(`episode/${db.latest.id}`)}">${esc(db.latest.title)}</a>
          · ${fmtDate(db.latest.date)}</p>
        ${entryList(latestPick.slice(0, SUGGESTION_COUNT).map((x) => x.entry))}
      </section>`
  }
  html += `
    <section class="suggest">
      <h2 class="section-title"><span>A lucky dip</span></h2>
      <p class="section-sub">A random handful from the hoard.
        <button type="button" class="link-button" data-shuffle>Shuffle</button></p>
      ${entryList(db.random)}
    </section>
    <p class="browse-all"><button type="button" class="more" data-all>Browse all ${fmtNumber(db.entries.length)} entries, A to Z</button></p>`
  return html
}

// ---------------------------------------------------------------------------
// Entry page

function entryPage(slug) {
  const entry = db.bySlug.get(slug)
  if (!entry) return notFound(`There is no entry called “${slug}”.`, slug.replace(/-/g, ' '))
  setTitle(nameText(entry))

  const i = db.entries.indexOf(entry)
  const prev = db.entries[i - 1]
  const next = db.entries[i + 1]
  const { original, translation } = forms(entry)
  // Subjects, then asides, newest first; episodes that only point to the entry go last.
  const date = (m) => db.episodeById.get(m.episode_id)?.date ?? ''
  const mentions = [...entry.mentions].sort((a, b) => roleRank(a) - roleRank(b) || date(b).localeCompare(date(a)))
  const discussed = mentions.filter((m) => m.role !== 'mention')
  const pointers = mentions.filter((m) => m.role === 'mention')
  const count = (list) => new Set(list.map((m) => m.episode_id)).size
  const linkedFrom = [...(db.linkedFrom.get(entry.slug) ?? [])].sort((a, b) => db.entries.indexOf(a) - db.entries.indexOf(b))

  main.innerHTML = `
    <nav class="crumbs"><a href="${href()}">← Search the hoard</a>
      <a href="${href(`graph?focus=${encodeURIComponent(entry.slug)}`)}">Show in graph</a></nav>
    <article class="entry">
      <header class="entry-head">
        <h1 class="headword">${nameHtml(entry)}</h1>
        <p class="entry-class">
          ${categoryTag(entry, { link: true })}
          ${entry.language ? `<span class="lang">${esc(entry.language)}</span>` : ''}
        </p>
        ${
          original || translation
            ? `<dl class="forms">
                ${original ? `<div><dt>Original form</dt><dd><i>${esc(original)}</i></dd></div>` : ''}
                ${translation ? `<div><dt>Literally</dt><dd>‘${esc(translation)}’</dd></div>` : ''}
              </dl>`
            : ''
        }
      </header>

      ${
        discussed.length
          ? `<h2 class="section-title"><span>Discussed in ${plural(count(discussed), 'episode')}</span></h2>
            <ol class="mentions">${discussed.map((m) => mentionItem(m, entry)).join('')}</ol>`
          : ''
      }
      ${
        pointers.length
          ? `<h2 class="section-title"><span>Also mentioned in</span></h2>
            <ol class="mentions">${pointers.map((m) => mentionItem(m, entry)).join('')}</ol>`
          : ''
      }
      ${
        linkedFrom.length
          ? `<h2 class="section-title"><span>Linked from</span></h2>${entryList(linkedFrom)}`
          : ''
      }

      <nav class="adjacent" aria-label="Neighbouring entries">
        ${prev ? `<a rel="prev" href="${href(`entry/${encodeURIComponent(prev.slug)}`)}"><span class="adjacent-label">Previous entry</span><span class="adjacent-term">${nameHtml(prev)}</span></a>` : '<span></span>'}
        ${next ? `<a rel="next" href="${href(`entry/${encodeURIComponent(next.slug)}`)}"><span class="adjacent-label">Next entry</span><span class="adjacent-term">${nameHtml(next)}</span></a>` : '<span></span>'}
      </nav>
    </article>`
}

function mentionItem(m, entry) {
  const ep = db.episodeById.get(m.episode_id) ?? { id: m.episode_id, title: 'Unknown episode' }
  return `
    <li class="mention">
      ${player(ep.id, m.t, `Play from ${fmtTime(Math.max(0, m.t - LEAD_IN))}`)}
      <div class="mention-body">
        <a class="mention-episode" href="${href(`episode/${ep.id}`)}">${esc(ep.title)}</a>
        <p class="meta">
          ${ep.date ? `<time datetime="${ep.date}">${fmtDate(ep.date)}</time> · ` : ''}
          at <a href="${youtubeUrl(ep.id, Math.max(0, m.t - LEAD_IN))}" target="_blank" rel="noopener">${fmtTime(m.t)} on YouTube</a>
          ${roleBadge(m.role)}
        </p>
        ${m.note ? `<p class="note">${noteHtml(m, { self: entry })}</p>` : ''}
        ${
          m.confidence === 'low' && !m.verified
            ? `<p class="flag" title="The automatic captions were unclear here, so the spelling or the entry itself may be wrong.">Unverified: the captions were unclear here</p>`
            : ''
        }
      </div>
    </li>`
}

// ---------------------------------------------------------------------------
// Episode pages

function episodePage(id) {
  const ep = db.episodeById.get(id)
  if (!ep) return notFound('There is no episode with that ID in the index.')
  setTitle(ep.title)
  const items = db.byEpisode.get(id) ?? []

  main.innerHTML = `
    <nav class="crumbs"><a href="${href('episodes')}">← All episodes</a></nav>
    <header class="episode-head">
      <p class="kicker">Episode${ep.date ? ` · ${fmtDate(ep.date)}` : ''}${ep.duration ? ` · ${Math.round(ep.duration / 60)} min` : ''}</p>
      <h1 class="episode-title">${esc(ep.title)}</h1>
      <p class="episode-links">${plural(items.length, 'entry', 'entries')} ·
        <a href="${youtubeUrl(ep.id)}" target="_blank" rel="noopener">Watch on YouTube</a></p>
    </header>
    <div class="episode-layout">
      <div class="episode-player" data-follow>${player(ep.id, LEAD_IN, 'Play episode')}
        <p class="hint">Click a timestamp to jump there. The list follows along as you watch.</p></div>
      <ol class="timeline">
        ${items
          .map(
            ({ entry, mention }) => `
          <li data-t="${mention.t}">
            <button type="button" class="ts" data-t="${mention.t}" aria-label="Play from ${fmtTime(mention.t)}">${fmtTime(mention.t)}</button>
            <div>
              <a class="hw" href="${href(`entry/${encodeURIComponent(entry.slug)}`)}">${nameHtml(entry)}</a>
              ${categoryTag(entry)}
              ${entry.language ? `<span class="lang">${esc(entry.language)}</span>` : ''}
              ${roleBadge(mention.role)}
              ${mention.note ? `<p class="note">${noteHtml(mention, { self: entry })}</p>` : ''}
              ${entry.allEpisodeCount > 1 ? `<p class="also">Also in ${plural(entry.allEpisodeCount - 1, 'other episode')}</p>` : ''}
            </div>
          </li>`,
          )
          .join('')}
      </ol>
    </div>`

  const playerEl = main.querySelector('.episode-player .player')
  const rows = [...main.querySelectorAll('.timeline li')]
  const times = rows.map((li) => Number(li.dataset.t) - LEAD_IN)
  let yt = null // YT.Player once started; stays null if the API is blocked
  let starting = null
  let current = null // start time of the highlighted rows (entries that come up together share one)

  const setCurrent = (time, { follow = true } = {}) => {
    if (time === current) return
    const prev = rows.find((li) => li.classList.contains('is-current'))
    current = time
    rows.forEach((li, i) => {
      li.classList.toggle('is-current', times[i] === time)
      li.querySelector('.ts').classList.toggle('is-current', times[i] === time)
    })
    const row = rows[times.indexOf(time)]
    if (!row) return
    // Keep the current row in view, but only while the reader is following along: not after they
    // have scrolled away, and not on narrow screens where scrolling would take the video off screen.
    const inView = (el) => {
      const r = el.getBoundingClientRect()
      return r.bottom > 0 && r.top < window.innerHeight
    }
    const sticky = getComputedStyle(playerEl.parentElement).position === 'sticky'
    if (follow && sticky && (!prev || inView(prev))) {
      const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches
      row.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' })
    }
  }

  // Poll the playback position and highlight the last entry that has come up.
  const sync = () => {
    if (!playerEl.isConnected) return clearInterval(timer)
    if (!yt?.getCurrentTime) return
    const now = yt.getCurrentTime()
    setCurrent(times.findLast((t) => t <= now) ?? null)
  }
  const timer = setInterval(sync, 250)

  const play = async (start) => {
    if (!starting) {
      starting = startApiPlayer(playerEl, start)
      yt = await starting
    } else if ((await starting) === null) {
      startPlayer(playerEl, start) // no API: reload the plain embed at the new time
    } else {
      yt.seekTo(start, true)
      yt.playVideo()
    }
  }

  playerEl.addEventListener('click', (ev) => {
    if (ev.target.closest('.player-cover')) play(Number(playerEl.dataset.start))
  })
  main.querySelector('.timeline').addEventListener('click', (ev) => {
    const ts = ev.target.closest('.ts')
    if (!ts) return
    const time = times[rows.indexOf(ts.closest('li'))]
    play(Math.max(0, time))
    setCurrent(time, { follow: false })
    if (playerEl.getBoundingClientRect().top < 0 || window.innerWidth < 900) {
      playerEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

function episodesPage() {
  setTitle('Episodes')
  main.innerHTML = `
    <header class="page-head">
      <h1 class="page-title">Episodes</h1>
    </header>
    <ol class="episode-list">
      ${db.episodes
        .map(
          (ep) => `
        <li><a href="${href(`episode/${ep.id}`)}">
          <span class="episode-list-thumb">
            <img src="${thumbUrl(ep.id)}" alt="" loading="lazy" width="480" height="360" />
            ${ep.duration ? `<span class="episode-list-duration">${fmtTime(ep.duration)}</span>` : ''}
          </span>
          <span class="episode-list-text">
            <span class="episode-list-title">${esc(ep.title)}</span>
            <span class="meta">${fmtDate(ep.date)} · ${plural(db.byEpisode.get(ep.id)?.length ?? 0, 'entry', 'entries')}</span>
          </span>
        </a></li>`,
        )
        .join('')}
    </ol>`
}

// ---------------------------------------------------------------------------
// Graph (prototype)

let teardown = null // cleanup for the current page, run before the router renders the next one
let graphLayout = null // data/graph-layout.json, fetched the first time the graph is shown

function graphPage() {
  setTitle('Graph')
  main.innerHTML = '<section class="graph-page"><p class="loading">Drawing the graph…</p></section>'
  const root = main.querySelector('.graph-page')
  graphLayout ??= fetch(href('data/graph-layout.json')).then((res) => {
    if (!res.ok) throw new Error(`graph-layout.json: HTTP ${res.status}`)
    return res.json()
  })
  Promise.all([import('./graph.js'), graphLayout])
    .then(([{ mountGraph }, layout]) => {
      if (!root.isConnected) return // navigated away while loading
      teardown = mountGraph(root, {
        db, esc, href, fold, noteHtml, nameText, nameHtml, forms, plural, CATEGORIES, categoryById, layout,
      })
    })
    .catch((err) => {
      console.error(err)
      graphLayout = null // try again next time
      root.innerHTML = `<p class="loading">The graph could not be loaded (${esc(err.message)}).</p>`
    })
}

// ---------------------------------------------------------------------------
// About, 404

function aboutPage() {
  setTitle('About')
  main.innerHTML = `
    <article class="prose">
      <h1 class="page-title">About</h1>
      <p class="callout"><strong>This is an unofficial fan project.</strong> It is not affiliated with,
        endorsed by or connected to RobWords, Words Unravelled, Rob Watts or Jess Zafarris.</p>

      <p><em>Words Unravelled</em> is a podcast about etymology hosted by Rob Watts and Jess Zafarris.
        Each episode takes a theme and works through dozens of words, expressions and names. This site is an
        index to that back catalogue: search for a word and it tells you which episodes discussed it,
        and plays the video from that moment.</p>

      <h2>Go to the source</h2>
      <ul>
        <li><a href="https://www.youtube.com/@wordsunravelled" target="_blank" rel="noopener">Words Unravelled on YouTube</a></li>
        <li><a href="https://www.youtube.com/@RobWords" target="_blank" rel="noopener">RobWords</a>, Rob’s YouTube channel</li>
        <li><a href="https://www.uselessetymology.com/" target="_blank" rel="noopener">Useless Etymology</a>, Jess’s site</li>
      </ul>

      <h2>How the index is made</h2>
      <p>Entries are extracted automatically from YouTube’s auto-generated captions with the help of an
        AI model, then grouped across episodes. Each entry keeps only the term, a one-line note on what
        the hosts say about it, and a link to the moment it comes up. There are no transcripts or
        summaries here: the explanations are in the episodes, so go and watch them.</p>
      <p>Automatic captions mishear foreign words and names, so some spellings will be off and some
        timestamps may land a little early or late. Entries the captions made uncertain are marked
        <span class="flag flag-inline">Unverified</span>.</p>

    </article>`
}

function notFound(message = 'That page isn’t in the hoard.', suggestion = '') {
  setTitle('Not found')
  const alternatives = suggestion ? search(suggestion).slice(0, 6) : []
  main.innerHTML = `
    <article class="prose">
      <h1 class="page-title">Not found</h1>
      <p>${esc(message)} <a href="${href()}">Search the index</a> instead.</p>
      ${alternatives.length ? `<h2>Did you mean…</h2>${entryList(alternatives)}` : ''}
    </article>`
}

// ---------------------------------------------------------------------------
// Routing (History API; on GitHub Pages deep links arrive via 404.html)

function render() {
  teardown?.()
  teardown = null
  const path = decodeURIComponent(location.pathname.slice(BASE.length)).replace(/\/+$/, '')
  const [page, arg] = path.split('/')
  document.body.dataset.page = page || 'home'
  document.querySelectorAll('.site-nav a').forEach((a) => {
    a.toggleAttribute('aria-current', a.pathname === location.pathname || (page === 'episode' && a.pathname === href('episodes')))
  })
  if (!page) home(new URLSearchParams(location.search))
  else if (page === 'entry' && arg) entryPage(arg)
  else if (page === 'episode' && arg) episodePage(arg)
  else if (page === 'episodes') episodesPage()
  else if (page === 'graph') graphPage()
  else if (page === 'about') aboutPage()
  else notFound()
}

function navigate(url) {
  history.replaceState({ ...history.state, scrollY: window.scrollY }, '')
  history.pushState({}, '', url)
  render()
  window.scrollTo(0, 0)
  main.focus({ preventScroll: true })
}

document.addEventListener('click', (ev) => {
  const a = ev.target.closest('a')
  if (!a || a.target || a.hasAttribute('download') || ev.button !== 0) return
  if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return
  const url = new URL(a.href, location.href)
  if (url.origin !== location.origin || !url.pathname.startsWith(BASE)) return
  ev.preventDefault()
  if (url.href !== location.href) navigate(url.href)
})

document.addEventListener('click', (ev) => {
  const cover = ev.target.closest('.player-cover')
  if (cover && !cover.closest('[data-follow]')) startPlayer(cover.parentElement)
})

document.addEventListener('keydown', (ev) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)
  if (ev.key === '/' && !typing) {
    ev.preventDefault()
    const input = document.getElementById('q')
    if (input) input.focus()
    else navigate(href())
    document.getElementById('q')?.focus()
  }
})

window.addEventListener('popstate', () => {
  render()
  window.scrollTo(0, history.state?.scrollY ?? 0)
})

// The static shell in index.html uses root-relative links; point them at the real base.
if (BASE !== '/') {
  document.querySelectorAll('a[href^="/"]').forEach((a) => a.setAttribute('href', BASE + a.getAttribute('href').slice(1)))
}

load()
  .then(render)
  .catch((err) => {
    console.error(err)
    main.innerHTML = `<article class="prose"><h1 class="page-title">The hoard is locked</h1>
      <p>The index data could not be loaded (${esc(err.message)}). Try reloading the page.</p></article>`
  })
