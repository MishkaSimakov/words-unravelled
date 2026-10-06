<script>
  // The /review page (dev only): every problem `check` finds, a collapsible list per code, each
  // with a link to where it is and, where there is one, a fix: merging likely duplicates, or
  // editing the mention's note. A warning that is fine can be silenced (data/silenced.json): it
  // moves to the silenced lists below, from which it can be brought back.
  import { CODES } from '#toolkit/checks/codes.js'
  import { entryName } from '#toolkit/model/schema.js'
  import { entry as entryBySlug, episode as episodeById } from '#toolkit/query/index.js'
  import { db } from '../db.js'
  import { plural } from '../format.js'
  import { entryHref, episodeHref } from '../paths.js'
  import { dataVersion } from '../version.svelte.js'
  import * as api from './api.js'
  import { openMerge } from './edits.svelte.js'
  import MentionEditor from './MentionEditor.svelte'

  const PAGE = 50

  let result = $state.raw(null) // { active, silenced, stale }, or { error }
  let failure = $state('') // why the last silence or unsilence was refused
  let busy = $state(false)
  let shown = $state({}) // "list:code" -> how many are shown
  let editing = $state.raw(null) // the problem whose mention is being edited

  // Again after every reload of the data, i.e. after every edit.
  $effect(() => {
    dataVersion.n
    api.fetchProblems().then((r) => (result = r))
  })

  async function change(call, problem) {
    busy = true
    const r = await call(problem)
    busy = false
    if (r.active) {
      result = r
      failure = ''
    } else {
      failure = r.problems?.map((p) => p.message).join(' ') ?? r.conflict ?? r.error
    }
  }

  /** Problems by code, in the order check lists them. */
  function byCode(list) {
    const groups = new Map()
    for (const p of list) groups.set(p.code, [...(groups.get(p.code) ?? []), p])
    return [...groups].map(([code, list]) => ({ code, list, ...CODES[code] }))
  }
  const active = $derived(result?.active ? byCode(result.active) : [])
  const silenced = $derived(result?.silenced ? byCode(result.silenced) : [])
  const count = (level) => result?.active?.filter((p) => p.level === level).length ?? 0

  const limit = (id) => shown[id] ?? PAGE
  const isDuplicate = (code) => code.startsWith('duplicate-')
  const mentionOf = (p) => {
    const entry = p.mention && entryBySlug(db.index, p.mention.slug)
    const mention = entry?.mentions.find((m) => m.episode_id === p.mention.episode_id)
    return mention ? { entry, mention } : null
  }
</script>

<svelte:head><title>Review · Wordhoard</title></svelte:head>

{#snippet where(p)}
  <p class="meta">
    {#each p.slugs as slug, j}
      {@const e = entryBySlug(db.index, slug)}
      {j ? ' · ' : ''}{#if e}<a href={entryHref(e)}>{entryName(e)}</a>{:else}{slug}{/if}
    {/each}
    {#if p.mention}· <a href={episodeHref(p.mention.episode_id)}>{episodeById(db.index, p.mention.episode_id)?.title ?? p.mention.episode_id}</a>{/if}
    {#if p.episode}· <a href={episodeHref(p.episode)}>{episodeById(db.index, p.episode)?.title ?? p.episode}</a>{/if}
  </p>
{/snippet}

{#snippet item(p, isSilenced)}
  {@const found = mentionOf(p)}
  <p class="message">{p.message}</p>
  {@render where(p)}
  <div class="edit-actions">
    {#if isDuplicate(p.code) && p.slugs.length === 2}
      <button type="button" onclick={() => openMerge(p.slugs[0], p.slugs[1])}>Merge {p.slugs[0]} into {p.slugs[1]}…</button>
      <button type="button" onclick={() => openMerge(p.slugs[1], p.slugs[0])}>Merge {p.slugs[1]} into {p.slugs[0]}…</button>
    {/if}
    {#if found && editing !== p}<button type="button" onclick={() => (editing = p)}>Edit the mention</button>{/if}
    {#if isSilenced}
      <button type="button" class="danger" disabled={busy} onclick={() => change(api.unsilence, p)}>Unsilence</button>
    {:else if p.level === 'warning'}
      <button type="button" class="danger" disabled={busy} onclick={() => change(api.silence, p)}>Silence</button>
    {/if}
  </div>
  {#if found && editing === p}<MentionEditor entry={found.entry} mention={found.mention} />{/if}
{/snippet}

{#snippet groups(list, isSilenced)}
  {#each list as group (group.code)}
    {@const id = `${isSilenced ? 'silenced' : 'active'}:${group.code}`}
    <details class="group" class:error={group.level === 'error'}>
      <summary>
        <code>{group.code}</code> <span class="count">{group.list.length}</span>
        <span class="about">{group.about}</span>
      </summary>
      <ol>
        {#each group.list.slice(0, limit(id)) as p, i (i)}<li>{@render item(p, isSilenced)}</li>{/each}
      </ol>
      {#if group.list.length > limit(id)}
        {@const left = group.list.length - limit(id)}
        <button type="button" class="more" onclick={() => (shown[id] = limit(id) + PAGE)}>
          {left > PAGE ? `Show ${PAGE} more of ${left}` : `Show the last ${left}`}
        </button>
      {/if}
    </details>
  {/each}
{/snippet}

<h1 class="page-title">Review</h1>
{#if !result}
  <p class="meta">Checking the data… (the duplicate checks take a second)</p>
{:else if !result.active}
  <p>The check failed: {result.error ?? result.conflict}</p>
{:else}
  <p class="meta">
    {plural(count('error'), 'error')}, {plural(count('warning'), 'warning')}, and
    {plural(result.silenced.length, 'warning')} silenced.
  </p>
  {#if failure}<p class="failure" role="alert">{failure}</p>{/if}
  {@render groups(active, false)}

  {#if result.silenced.length || result.stale.length}
    <details class="silenced">
      <summary>
        <h2>Silenced <span class="count">{result.silenced.length}</span></h2>
        <span class="about">Warnings looked at and found fine, kept in data/silenced.json.</span>
      </summary>
      {@render groups(silenced, true)}
      {#if result.stale.length}
        <details class="group">
          <summary>
            <code>no longer found</code> <span class="count">{result.stale.length}</span>
            <span class="about">Silenced warnings the data no longer has, e.g. after a rename or merge.</span>
          </summary>
          <ol>
            {#each result.stale as record, i (i)}
              <li>
                <p class="message"><code>{record.code}</code>{record.detail ? `: ${record.detail}` : ''}</p>
                {@render where(record)}
                <div class="edit-actions">
                  <button type="button" class="danger" disabled={busy} onclick={() => change(api.unsilence, record)}>Remove</button>
                </div>
              </li>
            {/each}
          </ol>
        </details>
      {/if}
    </details>
  {/if}
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
  .silenced {
    margin-top: 36px;
  }
  .silenced > summary {
    padding: 0 0 6px;
    cursor: pointer;
  }
  .silenced > summary h2 {
    display: inline;
    font-family: var(--serif-display);
    font-weight: 600;
    font-size: 1.35rem;
    color: var(--rubric);
  }
  .silenced .group {
    opacity: 0.85;
  }
  .failure {
    color: var(--rubric);
  }
  .group .more {
    margin: 10px auto 14px;
  }
</style>
