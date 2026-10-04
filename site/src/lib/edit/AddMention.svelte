<script>
  // Adding a mention to an episode, at the player's time: to an existing entry, or to a new one.
  import { CATEGORIES, CONFIDENCES, ROLES, entryName } from '#toolkit/model/schema.js'
  import { entrySlug } from '#toolkit/model/slugs.js'
  import { entry as entryBySlug } from '#toolkit/query/index.js'
  import Note from '../components/Note.svelte'
  import { db } from '../db.js'
  import { fmtTime } from '../format.js'
  import { propose } from './edits.svelte.js'
  import EntryPicker from './EntryPicker.svelte'

  let { episodeId, currentTime = null } = $props()

  const OPTIONAL = ['gloss', 'original', 'translation', 'language']
  const fresh = () => ({ term: '', gloss: '', original: '', translation: '', language: 'English', category: 'word' })

  let open = $state(false)
  let slug = $state(null) // the existing entry chosen, or null for a new one
  let fields = $state(fresh())
  let mention = $state({ t: 0, role: 'subject', note: '', confidence: 'high' })

  function start() {
    slug = null
    fields = fresh()
    mention = { t: Math.max(0, Math.floor(currentTime?.() ?? 0)), role: 'subject', note: '', confidence: 'high' }
    open = true
  }

  const existing = $derived(slug && entryBySlug(db.index, slug))
  const value = (f) => (OPTIONAL.includes(f) && !fields[f].trim() ? null : fields[f].trim())
  const newSlug = $derived(!slug && fields.term.trim() ? entrySlug(value('term'), value('gloss')) : null)
  const taken = $derived(newSlug && entryBySlug(db.index, newSlug))

  function save() {
    const item = { ...$state.snapshot(mention), t: Number(mention.t) }
    const entry = Object.fromEntries(['term', 'gloss', 'original', 'translation', 'language', 'category'].map((f) => [f, value(f)]))
    if (!entry.gloss) delete entry.gloss
    const name = existing ? entryName(existing) : entry.term
    propose(`Add ${name} at ${fmtTime(item.t)}`, [{ op: 'addMention', args: [episodeId, existing ? { slug, ...item } : { entry, ...item }] }])
    open = false
  }
</script>

{#if !open}
  <div class="edit-actions"><button type="button" onclick={start}>Add a mention{currentTime ? ' at the player’s time' : ''}</button></div>
{:else}
  <form class="edit-panel" onsubmit={(ev) => (ev.preventDefault(), save())}>
    {#if existing}
      <p>To <b>{entryName(existing)}</b> <button type="button" class="edit-btn" onclick={() => (slug = null)}>Another entry</button></p>
    {:else}
      <EntryPicker label="To an existing entry" onpick={(e) => (slug = e.slug)} />
      <p class="edit-hint">Or a new entry:</p>
      <div class="edit-fields">
        <label>Term<input bind:value={fields.term} /></label>
        <label>Gloss<input bind:value={fields.gloss} placeholder="only for homographs" /></label>
        <label>Original form<input bind:value={fields.original} /></label>
        <label>Literally<input bind:value={fields.translation} /></label>
        <label>Language<input bind:value={fields.language} /></label>
        <label>Category<select bind:value={fields.category}>{#each CATEGORIES as c}<option value={c}>{c}</option>{/each}</select></label>
      </div>
      {#if taken}
        <p class="edit-hint">
          {entryName(taken)} is already an entry.
          <button type="button" class="edit-btn" onclick={() => (slug = taken.slug)}>Add the mention to it</button>
        </p>
      {/if}
    {/if}
    <div class="edit-fields">
      <label>Time (s): {fmtTime(Number(mention.t) || 0)}<input type="number" min="0" step="1" bind:value={mention.t} required /></label>
      <label>Role<select bind:value={mention.role}>{#each ROLES as r}<option value={r}>{r}</option>{/each}</select></label>
      <label>Confidence<select bind:value={mention.confidence}>{#each CONFIDENCES as c}<option value={c}>{c}</option>{/each}</select></label>
    </div>
    <label class="edit-field note-field">Note, with links as [[type:target]]<textarea bind:value={mention.note}></textarea></label>
    {#if mention.note}<p class="preview"><Note {mention} self={existing || null} note={mention.note} /></p>{/if}
    <div class="edit-actions">
      <button type="button" onclick={() => (open = false)}>Cancel</button>
      <button type="submit" class="primary" disabled={!existing && (!fields.term.trim() || Boolean(taken))}>Preview the change</button>
    </div>
  </form>
{/if}

<style>
  .note-field {
    margin-top: 10px;
  }
  .preview {
    margin: 6px 0 0;
    padding: 6px 8px;
    background: var(--card);
    border-radius: 4px;
    overflow-wrap: anywhere;
  }
</style>
