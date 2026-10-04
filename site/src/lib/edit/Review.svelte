<script>
  // The /review page (dev only): every problem `check` finds, a collapsible list per code, each
  // with a link to where it is and, where there is one, a fix: merging likely duplicates, or
  // editing the mention's note.
  import { CODES } from '#toolkit/checks/codes.js'
  import { entryName } from '#toolkit/model/schema.js'
  import { entry as entryBySlug, episode as episodeById } from '#toolkit/query/index.js'
  import { db } from '../db.js'
  import { plural } from '../format.js'
  import { entryHref, episodeHref } from '../paths.js'
  import { dataVersion } from '../version.svelte.js'
  import { fetchProblems } from './api.js'
  import { openMerge } from './edits.svelte.js'
  import MentionEditor from './MentionEditor.svelte'

  const PAGE = 50

  let result = $state.raw(null)
  let shown = $state({}) // code -> how many are shown
  let editing = $state.raw(null) // the problem whose mention is being edited

  // Again after every reload of the data, i.e. after every edit.
  $effect(() => {
    dataVersion.n
    fetchProblems().then((r) => (result = r))
  })

  const groups = $derived.by(() => {
    if (!result?.problems) return []
    const byCode = new Map()
    for (const p of result.problems) byCode.set(p.code, [...(byCode.get(p.code) ?? []), p])
    return [...byCode].map(([code, list]) => ({ code, list, ...CODES[code] }))
  })
  const count = (level) => result?.problems?.filter((p) => p.level === level).length ?? 0

  const left = (group) => group.list.length - (shown[group.code] ?? PAGE)
  const isDuplicate = (code) => code.startsWith('duplicate-')
  const mentionOf = (p) => {
    const entry = p.mention && entryBySlug(db.index, p.mention.slug)
    const mention = entry?.mentions.find((m) => m.episode_id === p.mention.episode_id)
    return mention ? { entry, mention } : null
  }
</script>

<svelte:head><title>Review · Wordhoard</title></svelte:head>

<h1 class="page-title">Review</h1>
{#if !result}
  <p class="meta">Checking the data… (the duplicate checks take a second)</p>
{:else if !result.problems}
  <p>The check failed: {result.error ?? result.conflict}</p>
{:else}
  <p class="meta">{plural(count('error'), 'error')} and {plural(count('warning'), 'warning')}, by kind. Open a kind to go through it.</p>
  {#each groups as group (group.code)}
    <details class="group" class:error={group.level === 'error'}>
      <summary>
        <code>{group.code}</code> <span class="count">{group.list.length}</span>
        <span class="about">{group.about}</span>
      </summary>
      <ol>
        {#each group.list.slice(0, shown[group.code] ?? PAGE) as p, i (i)}
          {@const found = mentionOf(p)}
          <li>
            <p class="message">{p.message}</p>
            <p class="meta">
              {#each p.slugs as slug, j}
                {@const e = entryBySlug(db.index, slug)}
                {j ? ' · ' : ''}{#if e}<a href={entryHref(e)}>{entryName(e)}</a>{:else}{slug}{/if}
              {/each}
              {#if p.mention}· <a href={episodeHref(p.mention.episode_id)}>{episodeById(db.index, p.mention.episode_id)?.title ?? p.mention.episode_id}</a>{/if}
              {#if p.episode}· <a href={episodeHref(p.episode)}>{episodeById(db.index, p.episode)?.title ?? p.episode}</a>{/if}
            </p>
            <div class="edit-actions">
              {#if isDuplicate(p.code) && p.slugs.length === 2}
                <button type="button" onclick={() => openMerge(p.slugs[0], p.slugs[1])}>Merge {p.slugs[0]} into {p.slugs[1]}…</button>
                <button type="button" onclick={() => openMerge(p.slugs[1], p.slugs[0])}>Merge {p.slugs[1]} into {p.slugs[0]}…</button>
              {/if}
              {#if found && editing !== p}<button type="button" onclick={() => (editing = p)}>Edit the mention</button>{/if}
            </div>
            {#if found && editing === p}<MentionEditor entry={found.entry} mention={found.mention} />{/if}
          </li>
        {/each}
      </ol>
      {#if left(group) > 0}
        <button type="button" class="more" onclick={() => (shown[group.code] = (shown[group.code] ?? PAGE) + PAGE)}>
          {left(group) > PAGE ? `Show ${PAGE} more of ${left(group)}` : `Show the last ${left(group)}`}
        </button>
      {/if}
    </details>
  {/each}
{/if}

<style>
  .group {
    margin: 10px 0;
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    background: var(--card);
  }
  .group.error {
    border-left: 3px solid var(--rubric);
  }
  summary {
    padding: 10px 14px;
    cursor: pointer;
  }
  summary code {
    font-family: var(--mono);
    font-size: 0.9rem;
    font-weight: 600;
  }
  .count {
    display: inline-block;
    margin-left: 6px;
    padding: 0 8px;
    border-radius: 999px;
    background: var(--rubric-soft);
    font-size: 0.85rem;
  }
  .about {
    display: block;
    color: var(--muted);
    font-size: 0.9rem;
  }
  ol {
    margin: 0;
    padding: 0 14px 0 40px;
  }
  li {
    padding: 10px 0;
    border-top: 1px dotted var(--rule);
  }
  .message {
    margin: 0;
    overflow-wrap: anywhere;
  }
  .group .more {
    margin: 10px auto 14px;
  }
</style>
