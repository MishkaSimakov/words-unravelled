import Fuse from 'fuse.js'
import '@fontsource-variable/fraunces/opsz.css'
import '@fontsource-variable/fraunces/opsz-italic.css'
import '@fontsource-variable/source-serif-4/opsz.css'
import '@fontsource-variable/source-serif-4/opsz-italic.css'
import './style.css'

const SITE = 'Wordhoard'
const BASE = import.meta.env.BASE_URL // '/' locally, '/<repo>/' on GitHub Pages
const main = document.getElementById('main')

const TYPES = {
  word: { one: 'word', many: 'Words' },
  idiom: { one: 'idiom', many: 'Idioms' },
  phrase: { one: 'phrase', many: 'Phrases' },
  name: { one: 'name', many: 'Names' },
}
const SUGGESTION_COUNT = 12
const PAGE_SIZE = 60

const db = {
  episodes: [],
  entries: [],
  bySlug: new Map(),
  episodeById: new Map(),
  byEpisode: new Map(), // episode id -> [{ entry, mention }] in timestamp order
  latest: null,
  fuse: null,
  random: [],
}

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

const typeLabel = (type) => TYPES[type]?.one ?? type ?? 'entry'
const typePlural = (type) => TYPES[type]?.many ?? (type ? type[0].toUpperCase() + type.slice(1) : 'Other')

// Fold one character at a time, so indices in the folded string match the original.
const fold = (s) =>
  [...(s ?? '')].map((c) => c.normalize('NFD')[0].toLowerCase()).join('')

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

/** A YouTube thumbnail that turns into a player when clicked (nothing loads from YouTube's player until then). */
function player(videoId, t, label) {
  const start = Math.max(0, t - 3)
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
  db.entries = entries.sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }))
  for (const entry of db.entries) {
    entry.episodeCount = new Set(entry.mentions.map((m) => m.episode_id)).size
    db.bySlug.set(entry.slug, entry)
    for (const mention of entry.mentions) db.byEpisode.get(mention.episode_id)?.push({ entry, mention })
  }
  for (const list of db.byEpisode.values()) list.sort((a, b) => a.mention.t - b.mention.t)

  db.fuse = new Fuse(db.entries, {
    keys: [
      { name: 'term', weight: 3 },
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
  // Fuse ranks by fuzziness only; put exact and prefix matches of the term first.
  const tier = (e) => {
    const t = fold(e.term)
    return t === q ? 0 : t.startsWith(q) ? 1 : 2
  }
  return db.fuse
    .search(query.trim())
    .map((r) => ({ entry: r.item, score: r.score, tier: tier(r.item) }))
    .sort((a, b) => a.tier - b.tier || a.score - b.score)
    .map((r) => r.entry)
}

// ---------------------------------------------------------------------------
// Shared fragments

function entryItem(entry, query = '') {
  const gloss = []
  if (entry.original && fold(entry.original) !== fold(entry.term)) {
    gloss.push(`<i>${highlight(entry.original, query)}</i>`)
  }
  if (entry.translation && fold(entry.translation) !== fold(entry.term)) {
    gloss.push(`‘${highlight(entry.translation, query)}’`)
  }
  const note = entry.mentions[0]?.note
  return `
    <li>
      <a class="result" href="${href(`entry/${encodeURIComponent(entry.slug)}`)}">
        <span class="result-head">
          <span class="hw">${highlight(entry.term, query)}</span>
          <span class="result-class">
            <span class="pos">${esc(typeLabel(entry.type))}</span>
            ${entry.language ? `<span class="lang">${esc(entry.language)}</span>` : ''}
          </span>
        </span>
        ${gloss.length ? `<span class="gloss">${gloss.join(' · ')}</span>` : ''}
        ${note ? `<span class="result-note">${esc(note)}</span>` : ''}
        <span class="result-count">${plural(entry.episodeCount, 'episode')}</span>
      </a>
    </li>`
}

function entryList(entries, query = '', { letters = false } = {}) {
  if (!letters) return `<ol class="results">${entries.map((e) => entryItem(e, query)).join('')}</ol>`
  // Dictionary-style browsing: group under initial letters.
  let html = ''
  let current = null
  for (const e of entries) {
    const letter = fold(e.term).replace(/[^a-z0-9]/g, '')[0]?.toUpperCase() ?? '#'
    const key = /[A-Z]/.test(letter) ? letter : '#'
    if (key !== current) {
      if (current !== null) html += '</ol>'
      html += `<h3 class="letter">${key}</h3><ol class="results">`
      current = key
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
  const typeCounts = new Map()
  const langCounts = new Map()
  for (const e of db.entries) {
    typeCounts.set(e.type, (typeCounts.get(e.type) ?? 0) + 1)
    if (e.language) langCounts.set(e.language, (langCounts.get(e.language) ?? 0) + 1)
  }
  const types = [...typeCounts.keys()].sort((a, b) => {
    const order = Object.keys(TYPES)
    const ia = order.indexOf(a) < 0 ? 99 : order.indexOf(a)
    const ib = order.indexOf(b) < 0 ? 99 : order.indexOf(b)
    return ia - ib || String(a).localeCompare(String(b))
  })
  const languages = [...langCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

  const state = {
    q: params.get('q') ?? '',
    type: params.get('type') ?? '',
    lang: params.get('lang') ?? '',
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
          placeholder="Search a word, idiom or name…" aria-describedby="result-status" />
        <kbd class="search-kbd" aria-hidden="true">/</kbd>
      </div>
      <div class="filters">
        <div class="chips" role="group" aria-label="Type">
          <button type="button" class="chip" data-type="" aria-pressed="${!state.type}">All</button>
          ${types
            .map((t) => `<button type="button" class="chip" data-type="${esc(t)}" aria-pressed="${state.type === t}">
                ${esc(typePlural(t))} <span class="chip-count">${fmtNumber(typeCounts.get(t))}</span></button>`)
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

  const syncUrl = () => {
    const p = new URLSearchParams()
    if (state.q) p.set('q', state.q)
    if (state.type) p.set('type', state.type)
    if (state.lang) p.set('lang', state.lang)
    if (state.all && !state.q && !state.type && !state.lang) p.set('all', '')
    const qs = p.toString().replace(/=(&|$)/g, '$1')
    history.replaceState(history.state, '', href(qs ? `?${qs}` : ''))
  }

  const update = () => {
    const filtered = (list) =>
      list.filter((e) => (!state.type || e.type === state.type) && (!state.lang || e.language === state.lang))
    const q = state.q.trim()

    if (q) {
      const found = filtered(search(q))
      status.textContent = found.length
        ? `${plural(found.length, 'match', 'matches')} for “${q}”`
        : ''
      results.innerHTML = found.length
        ? entryList(found.slice(0, state.limit), q) + more(found.length)
        : `<div class="empty"><p class="empty-title">Nothing in the hoard for “${esc(q)}”.</p>
           <p>It may not have come up on the show yet, or the captions misheard it. Try a shorter
           spelling${state.type || state.lang ? ', or clear the filters' : ''}.</p></div>`
    } else if (state.type || state.lang || state.all) {
      const found = filtered(db.entries)
      status.textContent = `${plural(found.length, 'entry', 'entries')}, A to Z`
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
  select.addEventListener('change', () => {
    state.lang = select.value
    state.limit = PAGE_SIZE
    syncUrl()
    update()
  })
  form.querySelectorAll('[data-type]').forEach((chip) =>
    chip.addEventListener('click', () => {
      state.type = chip.dataset.type
      state.limit = PAGE_SIZE
      form.querySelectorAll('[data-type]').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)))
      syncUrl()
      update()
    }),
  )
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
  setTitle(entry.term)

  const i = db.entries.indexOf(entry)
  const prev = db.entries[i - 1]
  const next = db.entries[i + 1]
  const mentions = [...entry.mentions].sort((a, b) =>
    (db.episodeById.get(b.episode_id)?.date ?? '').localeCompare(db.episodeById.get(a.episode_id)?.date ?? ''),
  )

  main.innerHTML = `
    <nav class="crumbs"><a href="${href()}">← Search the hoard</a></nav>
    <article class="entry">
      <header class="entry-head">
        <h1 class="headword">${esc(entry.term)}</h1>
        <p class="entry-class">
          <span class="pos">${esc(typeLabel(entry.type))}</span>
          ${entry.language ? `<span class="lang">${esc(entry.language)}</span>` : ''}
        </p>
        ${
          entry.original || entry.translation
            ? `<dl class="forms">
                ${entry.original ? `<div><dt>Original form</dt><dd><i>${esc(entry.original)}</i></dd></div>` : ''}
                ${entry.translation ? `<div><dt>Literally</dt><dd>‘${esc(entry.translation)}’</dd></div>` : ''}
              </dl>`
            : ''
        }
      </header>

      <h2 class="section-title"><span>Discussed in ${plural(entry.episodeCount, 'episode')}</span></h2>
      <ol class="mentions">
        ${mentions.map((m) => mentionItem(m)).join('')}
      </ol>

      <nav class="adjacent" aria-label="Neighbouring entries">
        ${prev ? `<a rel="prev" href="${href(`entry/${encodeURIComponent(prev.slug)}`)}"><span>Previous entry</span>${esc(prev.term)}</a>` : '<span></span>'}
        ${next ? `<a rel="next" href="${href(`entry/${encodeURIComponent(next.slug)}`)}"><span>Next entry</span>${esc(next.term)}</a>` : '<span></span>'}
      </nav>
    </article>`
}

function mentionItem(m) {
  const ep = db.episodeById.get(m.episode_id) ?? { id: m.episode_id, title: 'Unknown episode' }
  return `
    <li class="mention">
      ${player(ep.id, m.t, `Play from ${fmtTime(Math.max(0, m.t - 3))}`)}
      <div class="mention-body">
        <a class="mention-episode" href="${href(`episode/${ep.id}`)}">${esc(ep.title)}</a>
        <p class="meta">
          ${ep.date ? `<time datetime="${ep.date}">${fmtDate(ep.date)}</time> · ` : ''}
          at <a href="${youtubeUrl(ep.id, Math.max(0, m.t - 3))}" target="_blank" rel="noopener">${fmtTime(m.t)} on YouTube</a>
        </p>
        ${m.note ? `<p class="note">${esc(m.note)}</p>` : ''}
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
      <div class="episode-player">${player(ep.id, 3, 'Play episode')}
        <p class="hint">Click a timestamp to jump there.</p></div>
      <ol class="timeline">
        ${items
          .map(
            ({ entry, mention }) => `
          <li>
            <button type="button" class="ts" data-t="${mention.t}" aria-label="Play from ${fmtTime(mention.t)}">${fmtTime(mention.t)}</button>
            <div>
              <a class="hw" href="${href(`entry/${encodeURIComponent(entry.slug)}`)}">${esc(entry.term)}</a>
              <span class="pos">${esc(typeLabel(entry.type))}</span>
              ${entry.language ? `<span class="lang">${esc(entry.language)}</span>` : ''}
              ${mention.note ? `<p class="note">${esc(mention.note)}</p>` : ''}
              ${entry.episodeCount > 1 ? `<p class="also">Also in ${plural(entry.episodeCount - 1, 'other episode')}</p>` : ''}
            </div>
          </li>`,
          )
          .join('')}
      </ol>
    </div>`

  const playerEl = main.querySelector('.episode-player .player')
  main.querySelector('.timeline').addEventListener('click', (ev) => {
    const ts = ev.target.closest('.ts')
    if (!ts) return
    startPlayer(playerEl, Math.max(0, Number(ts.dataset.t) - 3))
    main.querySelectorAll('.ts').forEach((b) => b.classList.toggle('is-current', b === ts))
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
          <img src="${thumbUrl(ep.id)}" alt="" loading="lazy" width="480" height="360" />
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
// About, 404

function aboutPage() {
  setTitle('About')
  main.innerHTML = `
    <article class="prose">
      <h1 class="page-title">About</h1>
      <p class="callout"><strong>This is an unofficial fan project.</strong> It is not affiliated with,
        endorsed by or connected to RobWords, Words Unravelled, Rob Watts or Jess Zafarris.</p>

      <p><em>Words Unravelled</em> is a podcast about etymology hosted by Rob Watts and Jess Zafarris.
        Each episode takes a theme and works through dozens of words, idioms and names. This site is an
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
  if (cover) startPlayer(cover.parentElement)
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
