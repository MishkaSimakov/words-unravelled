<script>
  import { page } from '$app/state'
  import { entryName } from '#toolkit/model/schema.js'
  import { backlinks, entry as entryBySlug, episode as episodeById } from '#toolkit/query/index.js'
  import CategoryTag from '#lib/components/CategoryTag.svelte'
  import EntryList from '#lib/components/EntryList.svelte'
  import EntryName from '#lib/components/EntryName.svelte'
  import Mention from '#lib/components/Mention.svelte'
  import NotFound from '#lib/components/NotFound.svelte'
  import { db } from '#lib/db.js'
  import { forms, roleRank } from '#lib/entries.js'
  import { plural } from '#lib/format.js'
  import { entryHref, href } from '#lib/paths.js'

  // The layout renders a page afresh on every navigation, so nothing here needs to react to it.
  const slug = page.params.slug
  const entry = entryBySlug(db.index, slug)

  const i = db.entries.indexOf(entry)
  const prev = entry && db.entries[i - 1]
  const next = entry && db.entries[i + 1]
  const { original, translation } = entry ? forms(entry) : {}
  // Subjects, then asides, newest first; episodes that only point to the entry go last.
  const date = (m) => episodeById(db.index, m.episode_id)?.date ?? ''
  const mentions = entry ? [...entry.mentions].sort((a, b) => roleRank(a) - roleRank(b) || date(b).localeCompare(date(a))) : []
  const discussed = mentions.filter((m) => m.role !== 'mention')
  const pointers = mentions.filter((m) => m.role === 'mention')
  const count = (list) => new Set(list.map((m) => m.episode_id)).size
  const linkedFrom = entry ? backlinks(db.index, entry.slug) : []
</script>

<svelte:head>{#if entry}<title>{entryName(entry)} · Wordhoard</title>{/if}</svelte:head>

{#if !entry}
  <NotFound message="There is no entry called “{slug}”." suggestion={slug.replace(/-/g, ' ')} />
{:else}
  <nav class="crumbs"><a href={href()}>← Search the hoard</a></nav>
  <article class="entry">
    <header class="entry-head">
      <h1 class="headword"><EntryName {entry} /></h1>
      <p class="entry-class">
        <CategoryTag {entry} link />
        {#if entry.language}<span class="lang">{entry.language}</span>{/if}
      </p>
      {#if original || translation}
        <dl class="forms">
          {#if original}<div><dt>Original form</dt><dd><i>{original}</i></dd></div>{/if}
          {#if translation}<div><dt>Literally</dt><dd>‘{translation}’</dd></div>{/if}
        </dl>
      {/if}
    </header>

    {#if discussed.length}
      <h2 class="section-title">
        <span>Discussed in {plural(count(discussed), 'episode')}</span>
      </h2>
      <ol class="mentions">
        {#each discussed as mention}<Mention {mention} {entry} />{/each}
      </ol>
    {/if}
    {#if pointers.length}
      <h2 class="section-title"><span>Also mentioned in</span></h2>
      <ol class="mentions">
        {#each pointers as mention}<Mention {mention} {entry} />{/each}
      </ol>
    {/if}
    {#if linkedFrom.length}
      <h2 class="section-title"><span>Linked from</span></h2>
      <EntryList entries={linkedFrom} />
    {/if}

    <nav class="adjacent" aria-label="Neighbouring entries">
      {#if prev}
        <a rel="prev" href={entryHref(prev)}
          ><span class="adjacent-label">Previous entry</span><span class="adjacent-term"><EntryName entry={prev} /></span></a
        >
      {:else}
        <span></span>
      {/if}
      {#if next}
        <a rel="next" href={entryHref(next)}
          ><span class="adjacent-label">Next entry</span><span class="adjacent-term"><EntryName entry={next} /></span></a
        >
      {:else}
        <span></span>
      {/if}
    </nav>
  </article>
{/if}

<style>
  .entry-head {
    padding: 26px 0 8px;
  }
  .headword {
    font-family: var(--serif-display);
    font-weight: 700;
    font-size: clamp(2.4rem, 8vw, 4.2rem);
    line-height: 1.02;
    letter-spacing: -0.02em;
    margin: 0;
  }
  .entry-class {
    display: flex;
    gap: 12px;
    align-items: baseline;
    margin: 10px 0 0;
    font-size: 1.2rem;
  }
  .forms {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 40px;
    margin: 22px 0 0;
    padding: 14px 18px;
    border-left: 3px solid var(--rubric);
    background: var(--card);
    border-radius: 0 var(--radius) var(--radius) 0;
  }
  .forms dt {
    font-variant-caps: all-small-caps;
    letter-spacing: 0.07em;
    color: var(--muted);
    font-size: 0.95rem;
  }
  .forms dd {
    margin: 0;
    font-size: 1.25rem;
    font-family: var(--serif-display);
  }

  .mentions {
    list-style: none;
    margin: 18px 0 0;
    padding: 0;
    display: grid;
    gap: 22px;
  }

  .adjacent {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-top: 44px;
    padding-top: 16px;
    border-top: 1px solid var(--rule);
  }
  .adjacent a {
    display: flex;
    flex-direction: column;
    text-decoration: none;
    font-family: var(--serif-display);
    font-weight: 600;
    font-size: 1.1rem;
    max-width: 48%;
  }
  .adjacent a[rel='next'] {
    text-align: right;
    margin-left: auto;
  }
  .adjacent-label {
    font-family: var(--serif-text);
    font-weight: 400;
    font-size: 0.8rem;
    font-variant-caps: all-small-caps;
    letter-spacing: 0.07em;
    color: var(--muted);
  }

  /* Long words: see app.css. */
  .adjacent-term {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .headword,
  .forms dd {
    overflow-wrap: anywhere;
  }
</style>
