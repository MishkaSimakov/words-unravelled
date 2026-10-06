<script>
  // Editing an entry's own fields on its page. A new term or gloss renames the entry (and so
  // its slug); a name that is another entry's leads to a merge instead.
  import { goto } from '$app/navigation'
  import { CATEGORIES, entryName } from '#toolkit/model/schema.js'
  import { entrySlug } from '#toolkit/model/slugs.js'
  import { entry as entryBySlug } from '#toolkit/query/index.js'
  import { db } from '../db.js'
  import { entryHref, href } from '../paths.js'
  import { openMerge, propose } from './edits.svelte.js'

  let { entry } = $props()

  const FIELDS = ['term', 'gloss', 'original', 'translation', 'language', 'category']
  const OPTIONAL = ['gloss', 'original', 'translation', 'language']

  let open = $state(false)
  let draft = $state({})
  const start = () => {
    draft = Object.fromEntries(FIELDS.map((f) => [f, entry[f] ?? '']))
    open = true
  }
  const value = (f) => (OPTIONAL.includes(f) && !draft[f].trim() ? null : draft[f].trim())

  const slug = $derived(open ? entrySlug(value('term'), value('gloss')) : entry.slug)
  const taken = $derived(slug !== entry.slug ? entryBySlug(db.index, slug) : null)

  function save() {
    const ops = []
    const fields = Object.fromEntries(['original', 'translation', 'language', 'category'].filter((f) => value(f) !== (entry[f] ?? null)).map((f) => [f, value(f)]))
    if (Object.keys(fields).length) ops.push({ op: 'setFields', args: [entry.slug, fields] })
    let current = entry.slug
    if (value('term') !== entry.term) {
      ops.push({ op: 'renameEntry', args: [current, value('term')] })
      current = entrySlug(value('term'), entry.gloss)
    }
    if (value('gloss') !== (entry.gloss ?? null)) ops.push({ op: 'setGloss', args: [current, value('gloss')] })
    if (!ops.length) return (open = false)
    const target = slug
    propose(`Edit ${entryName(entry)}`, ops, { then: target !== entry.slug ? () => goto(entryHref({ slug: target })) : null })
    open = false
  }

  function mergeInto(target) {
    open = false
    openMerge(entry.slug, target)
  }

  const remove = () => propose(`Delete ${entryName(entry)}`, [{ op: 'deleteEntry', args: [entry.slug] }], { then: () => goto(href()) })
</script>

{#if !open}
  <div class="edit-actions">
    <button type="button" onclick={start}>Edit entry</button>
    <button type="button" onclick={() => openMerge(entry.slug)}>Merge into…</button>
    <button type="button" class="danger" onclick={remove}>Delete entry</button>
  </div>
{:else}
  <form class="edit-panel" onsubmit={(ev) => (ev.preventDefault(), save())}>
    <div class="edit-fields">
      <label>Term<input bind:value={draft.term} required /></label>
      <label>Gloss<input bind:value={draft.gloss} placeholder="only for homographs" /></label>
      <label>Original form<input bind:value={draft.original} /></label>
      <label>Literally<input bind:value={draft.translation} /></label>
      <label>Language<input bind:value={draft.language} /></label>
      <label>Category
        <select bind:value={draft.category}>{#each CATEGORIES as c}<option value={c}>{c}</option>{/each}</select>
      </label>
    </div>
    {#if taken}
      <p class="edit-hint">
        {entryName(taken)} is already an entry ({slug}), so this would be a merge.
        <button type="button" class="edit-btn" onclick={() => mergeInto(taken.slug)}>Merge into {entryName(taken)}…</button>
      </p>
    {:else if slug !== entry.slug}
      <p class="edit-hint">The slug becomes {slug}; links that name the entry are rewritten.</p>
    {/if}
    <div class="edit-actions">
      <button type="button" onclick={() => (open = false)}>Cancel</button>
      <button type="submit" class="primary" disabled={Boolean(taken) || !draft.term.trim()}>Preview the change</button>
    </div>
  </form>
{/if}
