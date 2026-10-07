<script>
  // The graph page: the canvas (canvas.js) with a search box, a settings panel, zoom buttons and
  // a card for the selected entry, floating over it.
  import { onMount, tick, untrack } from 'svelte'
  import { replaceState } from '$app/navigation'
  import { page } from '$app/state'
  import { entryName } from '#toolkit/model/schema.js'
  import { fold } from '#toolkit/model/slugs.js'
  import CategoryTag from '#lib/components/CategoryTag.svelte'
  import EntryName from '#lib/components/EntryName.svelte'
  import Note from '#lib/components/Note.svelte'
  import { episodesOf } from '#lib/db.js'
  import { CATEGORIES, forms } from '#lib/entries.js'
  import { plural } from '#lib/format.js'
  import { entryHref } from '#lib/paths.js'
  import { DEFAULTS, graphCanvas, graphNodes } from './canvas.js'
  import { currentGraph, currentLayout } from './data.js'

  const data = graphNodes(currentGraph(), currentLayout(), entryName)
  const counts = new Map()
  for (const n of data.nodes) counts.set(n.category, (counts.get(n.category) ?? 0) + 1)
  const categories = CATEGORIES.filter((c) => counts.has(c.id))

  let root, canvas, input
  let card = $state() // the card element, while there is a selection
  let view = $state.raw(null)
  let settings = $state({ ...DEFAULTS })
  let shownCategories = $state(Object.fromEntries(categories.map((c) => [c.id, true])))
  let panelOpen = $state(false)
  let query = $state('')
  let matches = $state.raw(null) // Set of nodes matching the search, or null when not searching
  let selected = $state.raw(null)

  const neighbors = $derived(selected ? [...selected.neighbors].sort((a, b) => a.term.localeCompare(b.term)) : [])
  const note = $derived(selected?.entry.mentions.find((m) => m.note))
  const cardForms = $derived(selected ? forms(selected.entry) : {})

  // Settings reach the canvas in two groups, so that display changes don't restart the forces.
  const forces = $derived({ anchor: settings.anchor, repel: settings.repel, linkForce: settings.linkForce, linkDistance: settings.linkDistance })
  const display = $derived({ colorByCategory: settings.colorByCategory, textFade: settings.textFade, nodeSize: settings.nodeSize, linkWidth: settings.linkWidth })
  $effect(() => view?.setSettings(forces))
  $effect(() => view?.setSettings(display))

  // The category filters; a search or selection then follows what is left.
  $effect(() => {
    if (!view) return
    view.setHidden(categories.filter((c) => !shownCategories[c.id]).map((c) => c.id))
    untrack(() => {
      runSearch(query)
      if (selected && !view.shown().includes(selected)) select(null)
    })
  })
  $effect(() => view?.setMatches(matches))

  function runSearch(q) {
    const folded = fold(q.trim())
    matches = folded ? new Set(view.shown().filter((n) => fold(n.term).includes(folded))) : null
    if (selected && matches && !matches.has(selected)) select(null)
  }

  async function select(node, { center = false } = {}) {
    selected = node
    const url = new URL(page.url)
    if (node) url.searchParams.set('focus', node.id)
    else url.searchParams.delete('focus')
    replaceState(url, page.state)
    if (node && !view.shown().includes(node)) {
      // A node hidden by the category filters comes back with its neighbours' categories.
      for (const n of [node, ...node.neighbors]) shownCategories[n.category] = true
    }
    await tick()
    // On phones the card is a bottom sheet: keep the node above it.
    const sheet = node && matchMedia('(max-width: 700px)').matches ? card?.offsetHeight ?? 0 : 0
    view.select(node, { center, sheet })
  }

  function onSearchKey(ev) {
    if (ev.key === 'Escape') runSearch((query = ''))
    if (ev.key !== 'Enter' || !matches?.size) return
    const q = fold(query.trim())
    // Best match: exact, then prefix, then the best-connected.
    const rank = (n) => (fold(n.term) === q ? 0 : fold(n.term).startsWith(q) ? 1 : 2)
    select([...matches].sort((a, b) => rank(a) - rank(b) || b.deg - a.deg)[0], { center: true })
  }

  // Links in the card's note go to that entry's node, not its page (modifier clicks still open
  // the page, and so do links to entries that aren't in the graph).
  function onCardClick(ev) {
    const link = ev.target.closest('a.note-link')
    if (!link || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return
    const node = data.byId.get(decodeURIComponent(new URL(link.href).pathname.split('/').pop()))
    if (!node) return
    ev.preventDefault()
    ev.stopPropagation() // keep the router from opening the entry page
    select(node, { center: true })
  }

  function onkeydown(ev) {
    if (ev.key !== 'Escape' || document.activeElement === input) return
    if (selected) select(null)
    else panelOpen = false
  }

  function reset() {
    settings = { ...DEFAULTS }
    for (const c of categories) shownCategories[c.id] = true
  }

  onMount(() => {
    // Open the panel by default where there's room for it.
    panelOpen = matchMedia('(min-width: 900px)').matches
    view = graphCanvas(canvas, root, data, {
      onClick: (node, ev) => {
        if (ev.metaKey || ev.ctrlKey) window.open(entryHref(node.entry), '_blank')
        else select(node, { center: true })
      },
      onBackground: () => select(null),
    })
    const initial = data.byId.get(page.url.searchParams.get('focus'))
    if (initial) setTimeout(() => select(initial, { center: true }), 60)
    return () => view.destroy()
  })
</script>

<svelte:window {onkeydown} />

<section class="graph-page" bind:this={root}>
  <div class="graph-canvas" role="img" aria-label="Graph of entries and the links between them" bind:this={canvas}></div>

  <div class="graph-toolbar">
    <label class="graph-search">
      <span class="visually-hidden">Find an entry in the graph</span>
      <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>
      <input id="q" type="search" placeholder="Find an entry…" spellcheck="false" autocomplete="off"
        bind:value={query} bind:this={input} oninput={(ev) => runSearch(ev.currentTarget.value)} onkeydown={onSearchKey} />
    </label>
    {#if matches}<span class="graph-search-status" aria-live="polite">{matches.size ? plural(matches.size, 'match', 'matches') : 'No matches'}</span>{/if}
  </div>

  <button type="button" class="graph-settings-toggle" aria-expanded={panelOpen} aria-controls="graph-settings"
    aria-label="Graph settings" onclick={() => (panelOpen = !panelOpen)}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
  </button>
  <aside class="graph-settings" id="graph-settings" hidden={!panelOpen}>
    <details open>
      <summary>Filters</summary>
      <div class="graph-categories">
        {#each categories as c (c.id)}
          <label class="graph-category">
            <input type="checkbox" bind:checked={shownCategories[c.id]} />
            <span class="swatch" style="background: var(--graph-cat-{c.id}, var(--graph-node))"></span>
            {c.title} <span class="chip-count">{counts.get(c.id)}</span>
          </label>
        {/each}
      </div>
    </details>
    <details open>
      <summary>Display</summary>
      <label class="graph-switch"><input type="checkbox" bind:checked={settings.colorByCategory} /> Colour by category</label>
      {@render slider('textFade', 'Text fade threshold', 0.6, 6, 0.1)}
      {@render slider('nodeSize', 'Node size', 0.4, 3, 0.1)}
      {@render slider('linkWidth', 'Link thickness', 0.3, 4, 0.1)}
    </details>
    <details>
      <summary>Forces</summary>
      {@render slider('anchor', 'Anchor force', 0, 1, 0.01)}
      {@render slider('repel', 'Repel force', 0, 20, 0.5)}
      {@render slider('linkForce', 'Link force', 0, 2, 0.05)}
      {@render slider('linkDistance', 'Link distance', 5, 150, 1)}
    </details>
    <p class="graph-stats">{plural(data.nodes.length, 'linked entry', 'linked entries')}, {plural(data.links.length, 'link')}</p>
    <button type="button" class="link-button" onclick={reset}>Reset settings</button>
  </aside>

  <div class="graph-zoom" role="group" aria-label="Zoom">
    <button type="button" aria-label="Zoom in" onclick={() => view.zoomBy(1.5)}>+</button>
    <button type="button" aria-label="Zoom out" onclick={() => view.zoomBy(1 / 1.5)}>−</button>
    <button type="button" aria-label="Fit graph to screen" onclick={() => view.fit()}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
    </button>
  </div>

  {#if selected}
    {@const entry = selected.entry}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
    <aside class="graph-card" aria-live="polite" bind:this={card} onclick={onCardClick}>
      <button type="button" class="graph-card-close" aria-label="Close" onclick={() => select(null)}>×</button>
      <h2 class="graph-card-term"><EntryName {entry} /></h2>
      <p class="graph-card-class">
        <span class="swatch" style="background: var(--graph-cat-{entry.category}, var(--graph-node))"></span>
        <CategoryTag {entry} />
        {#if entry.language}<span class="lang">{entry.language}</span>{/if}
        · <span class="meta">{plural(episodesOf(entry).all, 'episode')}</span>
      </p>
      {#if cardForms.original || cardForms.translation}
        <p class="graph-card-forms">
          {#if cardForms.original}<i>{cardForms.original}</i>{/if}{#if cardForms.original && cardForms.translation}{' · '}{/if}{#if cardForms.translation}‘{cardForms.translation}’{/if}
        </p>
      {/if}
      {#if note}<p class="graph-card-note"><Note mention={note} self={entry} /></p>{/if}
      <p class="graph-card-label">Linked entries</p>
      <ul class="graph-card-links">
        {#each neighbors as n (n.id)}
          <li><button type="button" class="link-button" onclick={() => select(n, { center: true })}><EntryName entry={n.entry} /></button></li>
        {/each}
      </ul>
      <a class="graph-card-open" href={entryHref(entry)}>Open entry →</a>
    </aside>
  {/if}
</section>

{#snippet slider(key, label, min, max, step)}
  <label class="graph-slider">
    <span>{label}</span>
    <input type="range" {min} {max} {step} bind:value={settings[key]} />
  </label>
{/snippet}

<style>
  /* Obsidian-style graph: the page is a full-bleed canvas under the header, with floating
     controls. Colours are read by canvas.js, so they follow light/dark mode. */
  .graph-page {
    --graph-bg: #f6f0e2;
    --graph-node: #8f8472;
    --graph-link: rgba(74, 66, 56, 0.28);
    --graph-link-hi: #8a2a1c;
    --graph-accent: #8a2a1c;
    --graph-text: #1e1a15;
    --graph-unrelated: #d3392c;
    --graph-cat-expression: #2a78d6;
    --graph-cat-about-language: #eb6834;
    --graph-cat-name: #1baf7a;
    --panel-bg: rgba(251, 248, 240, 0.94);
  }
  @media (prefers-color-scheme: dark) {
    .graph-page {
      --graph-bg: #17150f;
      --graph-node: #a3977f;
      --graph-link: rgba(207, 197, 176, 0.22);
      --graph-link-hi: #e38a6f;
      --graph-accent: #e38a6f;
      --graph-text: #ece4d2;
      --graph-unrelated: #f0705f;
      --graph-cat-expression: #3987e5;
      --graph-cat-about-language: #d95926;
      --graph-cat-name: #199e70;
      --panel-bg: rgba(29, 26, 20, 0.94);
    }
  }

  /* The page fills the window below the header: no footer, no page scroll. */
  :global(body:has(.graph-page)) {
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
  }
  :global(body:has(.graph-page) .site-footer) {
    display: none;
  }
  :global(body:has(.graph-page) main) {
    max-width: none;
    padding: 0;
    display: flex;
    min-height: 0;
  }
  .graph-page {
    position: relative;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    background: var(--graph-bg);
  }
  .graph-canvas {
    position: absolute;
    inset: 0;
    touch-action: none;
  }

  .graph-toolbar,
  .graph-settings,
  .graph-settings-toggle,
  .graph-zoom,
  .graph-card {
    position: absolute;
    z-index: 2;
    background: var(--panel-bg);
    border: 1px solid var(--rule);
    border-radius: 10px;
    box-shadow: var(--shadow);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
  }
  .graph-page button {
    font: inherit;
    color: inherit;
  }
  .graph-page svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
  }
  .link-button {
    border: 0;
    background: none;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
    text-decoration-color: var(--rule);
    text-underline-offset: 0.18em;
  }
  .link-button:hover {
    color: var(--rubric);
  }

  .graph-toolbar {
    top: 12px;
    left: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 12px 4px 4px;
    max-width: calc(100% - 24px - 56px);
  }
  .graph-search {
    position: relative;
    display: block;
    min-width: 0;
  }
  .graph-search .search-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 10px;
    width: 18px;
    height: 18px;
    color: var(--muted);
  }
  .graph-search input {
    width: 240px;
    max-width: 100%;
    font: inherit;
    font-size: 1rem;
    color: var(--ink);
    background: transparent;
    border: 0;
    padding: 6px 8px 6px 36px;
    outline: none;
  }
  .graph-search-status {
    color: var(--muted);
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .graph-settings-toggle {
    top: 12px;
    right: 12px;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .graph-settings-toggle[aria-expanded='true'] {
    color: var(--rubric);
  }
  .graph-settings {
    z-index: 3; /* above the card when both are open on a phone */
    top: 64px;
    right: 12px;
    width: 260px;
    max-height: calc(100% - 64px - 156px); /* stops above the zoom buttons, scrolls if needed */
    overflow-y: auto;
    padding: 6px 14px 14px;
    font-size: 0.95rem;
  }
  .graph-settings[hidden] {
    display: none;
  }
  .graph-settings details {
    border-bottom: 1px solid var(--rule);
    padding: 6px 0 10px;
  }
  .graph-settings summary {
    cursor: pointer;
    font-family: var(--serif-display);
    font-weight: 600;
    color: var(--rubric);
    padding: 4px 0;
  }
  .graph-categories {
    display: grid;
    gap: 2px;
    margin: 4px 0 6px;
  }
  .graph-category,
  .graph-switch {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 3px 0;
    cursor: pointer;
  }
  .chip-count {
    margin-left: auto;
    color: var(--muted);
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
  }
  .graph-category input,
  .graph-switch input {
    accent-color: var(--rubric);
    margin: 0;
  }
  .swatch {
    display: inline-block;
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  .graph-slider {
    display: grid;
    gap: 2px;
    margin-top: 8px;
    color: var(--ink-soft);
    font-size: 0.9rem;
  }
  .graph-slider input {
    width: 100%;
    accent-color: var(--rubric);
  }
  .graph-stats {
    color: var(--muted);
    font-size: 0.85rem;
    margin: 10px 0 6px;
  }
  .graph-settings .link-button {
    font-size: 0.9rem;
  }

  .graph-zoom {
    right: 12px;
    bottom: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .graph-zoom button {
    width: 44px;
    height: 40px;
    border: 0;
    background: none;
    cursor: pointer;
    font-size: 1.3rem;
    line-height: 1;
    display: grid;
    place-items: center;
  }
  .graph-zoom button + button {
    border-top: 1px solid var(--rule);
  }
  .graph-zoom button:hover,
  .graph-settings-toggle:hover {
    color: var(--rubric);
  }

  .graph-card {
    left: 12px;
    bottom: 12px;
    width: 340px;
    max-height: calc(100% - 24px - 64px);
    overflow-y: auto;
    padding: 14px 18px 16px;
  }
  .graph-card-close {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 36px;
    height: 36px;
    border: 0;
    background: none;
    font-size: 1.5rem !important;
    line-height: 1;
    color: var(--muted) !important;
    cursor: pointer;
  }
  .graph-card-term {
    font-family: var(--serif-display);
    font-weight: 650;
    font-size: 1.5rem;
    line-height: 1.15;
    margin: 0;
    padding-right: 28px;
    overflow-wrap: anywhere;
  }
  .graph-card-class {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    margin: 6px 0 0;
  }
  .graph-card-forms {
    margin: 8px 0 0;
  }
  .graph-card-note {
    font-size: 0.98rem;
    margin: 10px 0 0;
  }
  .graph-card-label {
    margin: 14px 0 4px;
    font-variant-caps: all-small-caps;
    letter-spacing: 0.06em;
    color: var(--muted);
  }
  .graph-card-links {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
  }
  .graph-card-links .link-button {
    font-size: 0.98rem;
    text-align: left;
  }
  .graph-card-open {
    display: inline-block;
    margin-top: 14px;
    color: var(--rubric);
    font-weight: 600;
  }

  @media (max-width: 700px) {
    .graph-search input {
      width: 100%;
    }
    .graph-toolbar {
      right: 68px;
    }
    .graph-settings {
      left: 12px;
      width: auto;
      max-height: calc(100% - 64px - 12px);
    }
    /* The card becomes a bottom sheet; the zoom buttons move above it. */
    .graph-card {
      left: 0;
      right: 0;
      bottom: 0;
      width: auto;
      max-height: 45%;
      border-radius: 14px 14px 0 0;
      border-bottom: 0;
    }
    .graph-page:has(.graph-card) .graph-zoom {
      display: none;
    }
  }
</style>
