<script>
  // The side effects of an edit (the toolkit's sideEffects()), as the confirmation lists them.
  // Names and episode titles come from the data as it is, before the edit.
  import { entryName } from '#toolkit/model/schema.js'
  import { entry as entryBySlug, episode as episodeById } from '#toolkit/query/index.js'
  import { db } from '../db.js'
  import { fmtTime } from '../format.js'

  let { effects } = $props()

  const added = $derived(new Map(effects.entries.added.map((e) => [e.slug, e.name])))
  const nameOf = (slug) => {
    const e = entryBySlug(db.index, slug)
    return e ? entryName(e) : (added.get(slug) ?? slug)
  }
  const episodeOf = (id) => episodeById(db.index, id)?.title ?? id
  const show = (value) => (value === null || value === '' ? '—' : String(value))

  const removed = $derived(
    effects.entries.removed.map((e) => ({ ...e, how: !e.into ? '' : added.has(e.into) ? 'renamed to' : 'merged into' })),
  )
  // Entries added by a rename are listed under it.
  const created = $derived(effects.entries.added.filter((e) => !removed.some((r) => r.into === e.slug)))
  const orphaned = $derived(effects.links.filter((l) => l.before && !l.after))
  const captured = $derived(effects.links.filter((l) => !l.before && l.after))
  const sent = $derived(effects.links.filter((l) => l.before && l.after && !l.follows))
  const following = $derived(effects.links.filter((l) => l.follows))
  const empty = $derived(
    !removed.length && !created.length && !effects.entries.changed.length && !effects.links.length && !effects.notes.length &&
      !effects.introduced.length && Object.values(effects.mentions).every((list) => !list.length),
  )
</script>

{#snippet where(at)}<b>{nameOf(at.slug)}</b> in <i>{episodeOf(at.episode_id)}</i>{/snippet}
{#snippet fields(changes)}{#each Object.entries(changes) as [field, [from, to]], i}{i ? '; ' : ''}{field}: {show(from)} → {show(to)}{/each}{/snippet}
{#snippet link(l)}{@render where(l)}: <code>{l.target}</code>{/snippet}

<div class="effects">
  {#if empty}<p class="none">Nothing else changes.</p>{/if}

  {#if removed.length || created.length || effects.entries.changed.length}
    <h3>Entries</h3>
    <ul>
      {#each removed as e}<li class="minus">{e.name} {#if e.how}{e.how} <b>{nameOf(e.into)}</b>{:else}removed{/if}</li>{/each}
      {#each created as e}<li class="plus">{e.name} created</li>{/each}
      {#each effects.entries.changed as e}<li><b>{e.name}</b>: {@render fields(e.fields)}</li>{/each}
    </ul>
  {/if}

  {#if Object.values(effects.mentions).some((list) => list.length)}
    <h3>Mentions</h3>
    <ul>
      {#each effects.mentions.moved as m}<li>{@render where(m.from)} moves to <b>{nameOf(m.to.slug)}</b></li>{/each}
      {#each effects.mentions.removed as m}
        <li class="minus">{@render where(m)} at {fmtTime(m.mention.t)} removed{#if m.mention.note}: <q>{m.mention.note}</q>{/if}</li>
      {/each}
      {#each effects.mentions.added as m}<li class="plus">{@render where(m)} at {fmtTime(m.mention.t)} added</li>{/each}
      {#each effects.mentions.changed as m}<li>{@render where(m)}: {@render fields(m.fields)}</li>{/each}
    </ul>
  {/if}

  {#if effects.notes.length}
    <h3>Notes rewritten</h3>
    <ul>
      {#each effects.notes as n}
        <li>{@render where(n)}<br /><del>{n.before}</del><br /><ins>{n.after}</ins></li>
      {/each}
    </ul>
  {/if}

  {#if orphaned.length || captured.length || sent.length || following.length}
    <h3>Links</h3>
    <ul>
      {#each orphaned as l}<li class="minus">{@render link(l)} led to <b>{nameOf(l.before)}</b>, now leads nowhere</li>{/each}
      {#each captured as l}<li class="plus">{@render link(l)} led nowhere, now leads to <b>{nameOf(l.after)}</b></li>{/each}
      {#each sent as l}<li>{@render link(l)} led to <b>{nameOf(l.before)}</b>, now leads to <b>{nameOf(l.after)}</b></li>{/each}
      {#if following.length}
        <li>
          <details>
            <summary>{following.length} link{following.length === 1 ? '' : 's'} follow{following.length === 1 ? 's' : ''} the entry to its new name</summary>
            <ul>{#each following as l}<li>{@render link(l)}</li>{/each}</ul>
          </details>
        </li>
      {/if}
    </ul>
  {/if}

  {#if effects.introduced.length}
    <h3>New problems</h3>
    <ul>
      {#each effects.introduced as p}<li class:minus={p.level === 'error'}><code>{p.code}</code> {p.message}</li>{/each}
    </ul>
  {/if}
</div>

<style>
  .effects {
    font-size: 0.95rem;
  }
  h3 {
    margin: 14px 0 4px;
    font-size: 0.85rem;
    font-variant-caps: all-small-caps;
    letter-spacing: 0.08em;
    color: var(--rubric);
  }
  ul {
    margin: 0;
    padding-left: 18px;
  }
  li {
    margin: 3px 0;
    overflow-wrap: anywhere;
  }
  .minus::marker {
    content: '− ';
    color: var(--rubric);
  }
  .plus::marker {
    content: '+ ';
    color: var(--muted);
  }
  .none {
    color: var(--muted);
    font-style: italic;
  }
  del,
  ins,
  code {
    font-family: var(--mono);
    font-size: 0.82rem;
  }
  del {
    color: var(--muted);
  }
  ins {
    text-decoration: none;
  }
  q {
    color: var(--ink-soft);
  }
</style>
