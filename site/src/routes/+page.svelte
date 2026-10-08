<script>
  import { afterNavigate, goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import EntryList from '#lib/components/EntryList.svelte'
  import Suggestions from '#lib/components/Suggestions.svelte'
  import { db, PAGE_SIZE, search } from '#lib/db.js'
  import { CATEGORIES, categoryById } from '#lib/entries.js'
  import { fmtNumber, plural } from '#lib/format.js'
  import { href } from '#lib/paths.js'

  const langCounts = new Map()
  for (const e of db.entries) {
    if (e.language) langCounts.set(e.language, (langCounts.get(e.language) ?? 0) + 1)
  }
  const languages = [...langCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

  // The search and filters, kept in the URL so that searches can be shared and the back button works.
  const fromUrl = () => {
    const params = new URLSearchParams(location.search)
    return {
      q: params.get('q') ?? '',
      lang: params.get('lang') ?? '',
      cat: categoryById.has(params.get('cat')) ? params.get('cat') : '',
      all: params.has('all'),
      limit: PAGE_SIZE,
    }
  }
  const state = $state(fromUrl())

  // Typing and filtering replace the URL (goto type 'goto'); links and the back button set it.
  // The page first mounts after the data has loaded, which is after the first navigation, so
  // onMount below covers that one.
  afterNavigate(({ type }) => {
    if (type !== 'goto') Object.assign(state, fromUrl())
    if (state.q) input.focus()
  })

  const syncUrl = () => {
    const p = new URLSearchParams()
    if (state.q) p.set('q', state.q)
    if (state.lang) p.set('lang', state.lang)
    if (state.cat) p.set('cat', state.cat)
    if (state.all && !state.q && !state.lang && !state.cat) p.set('all', '')
    const qs = p.toString().replace(/=(&|$)/g, '$1')
    goto(href(qs ? `?${qs}` : ''), { replace: true, reset: false })
  }

  const q = $derived(state.q.trim())
  // The chips count what the search and language filter leave, so they show where matches are.
  const base = $derived((q ? search(q) : db.entries).filter((e) => !state.lang || e.language === state.lang))
  const counts = $derived.by(() => {
    const counts = new Map()
    for (const e of base) counts.set(e.category, (counts.get(e.category) ?? 0) + 1)
    return counts
  })
  const cat = $derived(categoryById.get(state.cat))
  const found = $derived(cat ? base.filter((e) => e.category === cat.id) : base)
  const status = $derived(
    q
      ? found.length
        ? `${plural(found.length, 'match', 'matches')} for “${q}”${cat ? ` among ${cat.noun}` : ''}`
        : ''
      : state.lang || cat || state.all
        ? `${cat ? plural(found.length, cat.one, cat.noun) : plural(found.length, 'entry', 'entries')}, A to Z`
        : '',
  )

  let input
  let chipRow
  let results
  let chipsHaveMore = $state(false)

  const oninput = () => {
    state.q = input.value
    state.limit = PAGE_SIZE
    syncUrl()
  }
  const onchange = (ev) => {
    state.lang = ev.currentTarget.value
    state.limit = PAGE_SIZE
    syncUrl()
  }
  const pickCategory = (id) => {
    // Pressing the selected category again goes back to all of them.
    state.cat = id === state.cat ? '' : id
    state.limit = PAGE_SIZE
    syncUrl()
  }
  const onsubmit = (ev) => {
    ev.preventDefault()
    results.querySelector('a.result')?.click()
  }
  const browseAll = () => {
    state.all = true
    syncUrl()
  }

  // On narrow screens the chip row scrolls sideways: fade its edge while more chips are hidden, and
  // bring the selected chip into view (a link to ?cat=word-part selects the last one).
  const fadeChips = () => {
    chipsHaveMore = chipRow.scrollLeft + chipRow.clientWidth < chipRow.scrollWidth - 1
  }
  onMount(() => {
    if (state.q) input.focus()
    const observer = new ResizeObserver(fadeChips)
    observer.observe(chipRow)
    document.fonts.ready.then(() => {
      if (!chipRow.isConnected) return
      const row = chipRow.getBoundingClientRect()
      const pressed = chipRow.querySelector('[aria-pressed="true"]').getBoundingClientRect()
      if (pressed.right > row.right) chipRow.scrollLeft += pressed.left - row.left - 24
    })
    return () => observer.disconnect()
  })

  // Arrow keys move between the search box and the results.
  function onkeydown(ev) {
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
  }
</script>

<svelte:head><title>Wordhoard: an unofficial Words Unravelled index</title></svelte:head>
<svelte:window {onkeydown} />

<section class="hero">
  <h1 class="hero-title">An unofficial index to <em class="podcast">Words Unravelled</em></h1>
  <p class="hero-sub">Every word they’ve unravelled, and where to hear it.</p>
  <p class="stats">
    <strong>{fmtNumber(db.entries.length)}</strong> entries from
    <strong>{fmtNumber(db.episodes.length)}</strong> episodes
  </p>
</section>

<form class="search" role="search" autocomplete="off" {onsubmit}>
  <label class="visually-hidden" for="q">Search entries</label>
  <div class="search-box">
    <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>
    <input
      id="q"
      name="q"
      type="search"
      value={state.q}
      bind:this={input}
      {oninput}
      spellcheck="false"
      placeholder="Search the hoard…"
      aria-describedby="result-status"
    />
    <kbd class="search-kbd" aria-hidden="true">/</kbd>
  </div>
  <div class="filters">
    <div
      class="chips"
      class:has-more={chipsHaveMore}
      role="group"
      aria-label="Kind of entry"
      bind:this={chipRow}
      onscroll={fadeChips}
    >
      {#each [{ id: '', title: 'All' }, ...CATEGORIES] as c (c.id)}
        {@const n = c.id ? (counts.get(c.id) ?? 0) : base.length}
        <button
          type="button"
          class="chip"
          class:is-empty={n === 0}
          aria-pressed={c.id === state.cat}
          onclick={() => pickCategory(c.id)}
        >
          {c.title} <span class="chip-count">{fmtNumber(n)}</span></button
        >
      {/each}
    </div>
    <label class="lang-select">
      <span class="visually-hidden">Language</span>
      <select name="lang" value={state.lang} {onchange}>
        <option value="">All languages</option>
        {#each languages as [l, n] (l)}
          <option value={l}>{l} ({n})</option>
        {/each}
      </select>
    </label>
  </div>
</form>
<p id="result-status" class="result-status" aria-live="polite">{status}</p>
<div id="results" bind:this={results}>
  {#if q}
    {#if found.length}
      <EntryList entries={found.slice(0, state.limit)} query={q} />
      {@render more(found.length)}
    {:else}
      <div class="empty">
        <p class="empty-title">Nothing in the hoard for “{q}”{cat ? ` among ${cat.noun}` : ''}.</p>
        <p>
          It may not have come up on the show yet, or the captions misheard it. Try a shorter
          spelling{state.lang || cat ? ', or clear the filters' : ''}.
        </p>
      </div>
    {/if}
  {:else if state.lang || cat || state.all}
    <EntryList entries={found.slice(0, state.limit)} letters />
    {@render more(found.length)}
  {:else}
    <Suggestions onbrowse={browseAll} />
  {/if}
</div>

{#snippet more(total)}
  {#if total > state.limit}
    <button type="button" class="more" onclick={() => (state.limit += PAGE_SIZE * 4)}
      >Show more ({fmtNumber(total - state.limit)} left)</button
    >
  {/if}
{/snippet}

<style>
  .hero {
    padding: 48px 0 20px;
  }
  .hero-title {
    font-family: var(--serif-display);
    font-weight: 600;
    font-size: clamp(1.8rem, 4.8vw, 2.9rem);
    line-height: 1.05;
    letter-spacing: -0.02em;
    margin: 4px 0 16px;
    text-wrap: balance;
  }
  .podcast {
    font-style: normal;
    color: var(--rubric);
    white-space: nowrap;
  }
  .hero-sub {
    margin: 0 0 10px;
    font-family: var(--serif-display);
    font-size: clamp(1.2rem, 3vw, 1.45rem);
    line-height: 1.3;
    color: var(--ink-soft);
    text-wrap: balance;
  }
  .stats {
    margin: 0;
    color: var(--ink-soft);
    font-size: 1.05rem;
  }
  .stats strong {
    font-family: var(--serif-display);
    font-weight: 650;
    color: var(--ink);
    font-variant-numeric: lining-nums;
  }

  .search {
    position: sticky;
    top: 0;
    z-index: 5;
    background: var(--paper);
    padding: 14px 0 12px;
    margin: 8px 0 0;
    border-bottom: 1px solid var(--rule);
  }
  .search-box {
    position: relative;
  }
  .search-box input {
    width: 100%;
    font: inherit;
    font-family: var(--serif-display);
    font-size: clamp(1.2rem, 3.4vw, 1.5rem);
    padding: 14px 52px 14px 50px;
    color: var(--ink);
    background: var(--card);
    border: 1.5px solid var(--ink);
    border-radius: var(--radius);
    box-shadow: 3px 3px 0 var(--rule);
    -webkit-appearance: none;
    appearance: none;
  }
  .search-box input::placeholder {
    color: var(--muted);
    font-style: italic;
    opacity: 0.85;
  }
  .search-box input:focus {
    outline: none;
    border-color: var(--rubric);
    box-shadow: 3px 3px 0 var(--rubric-soft);
  }
  .search-box input::-webkit-search-cancel-button {
    cursor: pointer;
  }
  .search-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    width: 22px;
    height: 22px;
    transform: translateY(-50%);
    fill: none;
    stroke: var(--muted);
    stroke-width: 2;
    stroke-linecap: round;
    pointer-events: none;
  }
  .search-kbd {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-family: var(--mono);
    font-size: 0.8rem;
    color: var(--muted);
    border: 1px solid var(--rule);
    border-radius: 4px;
    padding: 1px 7px;
    pointer-events: none;
  }
  @media (hover: none) {
    .search-kbd {
      display: none;
    }
  }
  .search-box input:focus ~ .search-kbd,
  .search-box input:not(:placeholder-shown) ~ .search-kbd {
    display: none;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 14px;
    margin-top: 12px;
  }
  /* Category chips: one row that scrolls sideways when it doesn't fit, so the sticky search bar
     stays short on phones. */
  .chips {
    display: flex;
    gap: 6px;
    min-width: 0;
    max-width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
    padding: 2px;
    margin: -2px;
  }
  .chips::-webkit-scrollbar {
    display: none;
  }
  .chips.has-more {
    mask-image: linear-gradient(to right, #000 calc(100% - 40px), transparent);
  }
  .chip {
    flex: none;
    font-size: 0.95rem;
    background: var(--card);
    border: 1px solid var(--rule);
    border-radius: 999px;
    padding: 4px 12px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  .chip:hover {
    border-color: var(--ink);
  }
  .chip-count {
    font-size: 0.8em;
    font-variant-numeric: tabular-nums;
    color: var(--muted);
    margin-left: 2px;
  }
  .chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .chip[aria-pressed='true'] .chip-count {
    color: inherit;
    opacity: 0.75;
  }
  .chip.is-empty:not([aria-pressed='true']) {
    color: var(--muted);
    border-style: dashed;
  }

  .lang-select select {
    font: inherit;
    font-size: 0.95rem;
    color: var(--ink);
    background: var(--card);
    border: 1px solid var(--rule);
    border-radius: 999px;
    padding: 4px 30px 4px 13px;
    -webkit-appearance: none;
    appearance: none;
    background-image: linear-gradient(45deg, transparent 50%, var(--muted) 50%),
      linear-gradient(135deg, var(--muted) 50%, transparent 50%);
    background-position: calc(100% - 16px) 55%, calc(100% - 11px) 55%;
    background-size: 5px 5px;
    background-repeat: no-repeat;
    max-width: 100%;
    cursor: pointer;
  }

  .result-status {
    margin: 14px 0 0;
    min-height: 1.4em;
    color: var(--muted);
    font-size: 0.92rem;
    font-style: italic;
  }

  .empty {
    padding: 40px 0;
    max-width: 60ch;
    color: var(--ink-soft);
  }
  .empty-title {
    font-family: var(--serif-display);
    font-size: 1.4rem;
    color: var(--ink);
    margin: 0 0 8px;
  }

  /* Long words: see app.css. */
  .result-status,
  .empty-title {
    overflow-wrap: anywhere;
  }

  @media (max-width: 700px) {
    .hero {
      padding-top: 32px;
    }
    .filters {
      flex-direction: column;
      align-items: stretch;
    }
    .lang-select select {
      width: 100%;
    }
  }
</style>
