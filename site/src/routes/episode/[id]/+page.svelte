<script>
  import { page } from '$app/state'
  import { episode as episodeById, episodeMentions } from '#toolkit/query/index.js'
  import CategoryTag from '#lib/components/CategoryTag.svelte'
  import EntryName from '#lib/components/EntryName.svelte'
  import Note from '#lib/components/Note.svelte'
  import NotFound from '#lib/components/NotFound.svelte'
  import Player from '#lib/components/Player.svelte'
  import RoleBadge from '#lib/components/RoleBadge.svelte'
  import { db, episodesOf } from '#lib/db.js'
  import { fmtDate, fmtTime, plural } from '#lib/format.js'
  import { entryHref, href } from '#lib/paths.js'
  import { LEAD_IN, youtubeUrl } from '#lib/youtube.js'

  // The layout renders a page afresh on every navigation, so nothing here needs to react to it.
  const id = page.params.id
  const ep = episodeById(db.index, id)
  const items = ep ? episodeMentions(db.index, id) : []
  const times = items.map(({ mention }) => mention.t - LEAD_IN)

  let player = $state()
  let playerBox = $state()
  const rows = $state([])
  let current = $state(null) // start time of the highlighted rows (entries that come up together share one)

  function setCurrent(time, { follow = true } = {}) {
    if (time === current) return
    const prev = rows[times.indexOf(current)]
    current = time
    const row = rows[times.indexOf(time)]
    if (!row) return
    // Keep the current row in view, but only while the reader is following along: not after they
    // have scrolled away, and not on narrow screens where scrolling would take the video off screen.
    const inView = (el) => {
      const r = el.getBoundingClientRect()
      return r.bottom > 0 && r.top < window.innerHeight
    }
    const sticky = getComputedStyle(playerBox).position === 'sticky'
    if (follow && sticky && (!prev || inView(prev))) {
      const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches
      row.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' })
    }
  }

  // Poll the playback position and highlight the last entry that has come up.
  $effect(() => {
    if (!ep) return
    const timer = setInterval(() => {
      const now = player.currentTime()
      if (now !== null) setCurrent(times.findLast((t) => t <= now) ?? null)
    }, 250)
    return () => clearInterval(timer)
  })

  function jump(time) {
    player.play(Math.max(0, time))
    setCurrent(time, { follow: false })
    const el = player.element()
    if (el.getBoundingClientRect().top < 0 || window.innerWidth < 900) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
</script>

<svelte:head>{#if ep}<title>{ep.title} · Wordhoard</title>{/if}</svelte:head>

{#if !ep}
  <NotFound message="There is no episode with that ID in the index." />
{:else}
  <nav class="crumbs"><a href={href('episodes')}>← All episodes</a></nav>
  <header class="episode-head">
    <p class="kicker">
      Episode{ep.date ? ` · ${fmtDate(ep.date)}` : ''}{ep.duration ? ` · ${Math.round(ep.duration / 60)} min` : ''}
    </p>
    <h1 class="episode-title">{ep.title}</h1>
    <p class="episode-links">
      {plural(items.length, 'entry', 'entries')} ·
      <a href={youtubeUrl(ep.id)} target="_blank" rel="noopener">Watch on YouTube</a>
    </p>
  </header>
  <div class="episode-layout">
    <div class="episode-player" bind:this={playerBox}>
      <Player bind:this={player} videoId={ep.id} start={0} label="Play episode" api />
      <p class="hint">Click a timestamp to jump there. The list follows along as you watch.</p>
    </div>
    <ol class="timeline">
      {#each items as { entry, mention }, i (entry.slug)}
        <li class:is-current={times[i] === current} bind:this={rows[i]}>
          <button
            type="button"
            class="ts"
            class:is-current={times[i] === current}
            aria-label="Play from {fmtTime(mention.t)}"
            onclick={() => jump(times[i])}>{fmtTime(mention.t)}</button
          >
          <div>
            <a class="hw" href={entryHref(entry)}><EntryName {entry} /></a>
            <CategoryTag {entry} />
            {#if entry.language}<span class="lang">{entry.language}</span>{/if}
            <RoleBadge role={mention.role} />
            {#if mention.note}<p class="note"><Note {mention} self={entry} /></p>{/if}
            {#if episodesOf(entry).all > 1}<p class="also">Also in {plural(episodesOf(entry).all - 1, 'other episode')}</p>{/if}
          </div>
        </li>
      {/each}
    </ol>
  </div>
{/if}

<style>
  .kicker {
    margin: 0 0 6px;
    color: var(--rubric);
    font-variant-caps: all-small-caps;
    letter-spacing: 0.08em;
    font-size: 1.05rem;
  }

  .episode-head {
    padding: 22px 0 10px;
    max-width: 820px;
  }
  .episode-title {
    font-family: var(--serif-display);
    font-weight: 650;
    font-size: clamp(1.8rem, 5vw, 2.7rem);
    line-height: 1.1;
    letter-spacing: -0.015em;
    margin: 0 0 10px;
    text-wrap: balance;
  }
  .episode-links {
    margin: 0;
    color: var(--ink-soft);
  }
  .episode-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
    gap: 32px;
    align-items: start;
    margin-top: 20px;
  }
  .episode-player {
    position: sticky;
    top: 16px;
    scroll-margin-top: 16px;
  }
  .hint {
    color: var(--muted);
    font-size: 0.88rem;
    font-style: italic;
    margin: 8px 0 0;
  }
  .timeline {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .timeline li {
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 14px;
    padding: 12px 10px;
    margin: 0 -10px;
    border-bottom: 1px dotted var(--rule);
    border-radius: var(--radius);
    transition: background-color 0.3s;
  }
  .timeline li.is-current {
    background: var(--rubric-soft);
  }
  .timeline .hw {
    text-decoration: none;
    margin-right: 6px;
  }
  .timeline :global(.cat) {
    margin-right: 6px;
  }
  .timeline .note {
    margin-top: 3px;
    font-size: 0.96rem;
    color: var(--ink-soft);
  }
  .also {
    margin: 4px 0 0;
    font-size: 0.8rem;
    font-variant-caps: all-small-caps;
    letter-spacing: 0.07em;
    color: var(--rubric);
  }
  .ts {
    align-self: start;
    justify-self: start;
    margin-top: 2px;
    font-family: var(--mono);
    font-size: 0.85rem;
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid var(--rule);
    background: var(--card);
    cursor: pointer;
    font-variant-numeric: tabular-nums;
  }
  .ts:hover,
  .ts.is-current {
    background: var(--rubric);
    border-color: var(--rubric);
    color: var(--paper);
  }

  /* Long words: see app.css. */
  .timeline .hw {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: bottom;
  }
  .episode-title {
    overflow-wrap: anywhere;
  }

  @media (max-width: 900px) {
    .episode-layout {
      grid-template-columns: minmax(0, 1fr);
      gap: 18px;
    }
    .episode-player {
      position: static;
    }
  }

  @media (max-width: 700px) {
    .timeline li {
      grid-template-columns: 64px minmax(0, 1fr);
      gap: 10px;
    }
  }
</style>
