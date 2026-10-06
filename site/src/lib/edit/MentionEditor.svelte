<script>
  // Editing one mention: its time, role, confidence and note (raw link markup, with a live
  // preview), moving it to another entry, or deleting it. `currentTime` (on the episode page)
  // reads the player, to set the time from it.
  import { CONFIDENCES, ROLES, entryName } from '#toolkit/model/schema.js'
  import Note from '../components/Note.svelte'
  import { fmtTime } from '../format.js'
  import { openMerge, propose } from './edits.svelte.js'
  import EntryPicker from './EntryPicker.svelte'

  let { entry, mention, currentTime = null } = $props()

  const FIELDS = ['t', 'role', 'note', 'confidence']

  let open = $state(false)
  let moving = $state(false)
  let draft = $state({})
  let hint = $state('')
  const start = () => {
    draft = Object.fromEntries(FIELDS.map((f) => [f, mention[f]]))
    hint = ''
    open = true
  }
  const now = () => {
    const t = currentTime?.()
    if (t !== null && t !== undefined) draft.t = Math.max(0, Math.floor(t))
  }
  const at = $derived(`${entryName(entry)} at ${fmtTime(mention.t)}`)
  const only = $derived(entry.mentions.length === 1)

  function save() {
    const fields = Object.fromEntries(FIELDS.filter((f) => draft[f] !== mention[f]).map((f) => [f, f === 't' ? Number(draft.t) : draft[f]]))
    open = false
    if (Object.keys(fields).length) propose(`Edit ${at}`, [{ op: 'editMention', args: [entry.slug, mention.episode_id, fields] }])
  }

  const check = () => propose(`Mark ${at} checked`, [{ op: 'editMention', args: [entry.slug, mention.episode_id, { confidence: 'high' }] }])

  const remove = () =>
    propose(only ? `Delete ${at}, its only mention, and so the entry` : `Delete ${at}`, [{ op: 'deleteMention', args: [entry.slug, mention.episode_id] }])

  function moveTo(target) {
    if (only || target.mentions.some((m) => m.episode_id === mention.episode_id)) {
      // Moving an entry's only mention is a merge, which keeps the links to it; so is a target
      // that already has a mention here, where one of the two must be chosen.
      hint = only
        ? `This is ${entryName(entry)}'s only mention, so moving it is a merge, which keeps the links to it.`
        : `${entryName(target)} already has a mention in this episode, so this is a merge.`
      openMerge(entry.slug, target.slug)
      moving = open = false
      return
    }
    const { episode_id, ...item } = mention
    moving = open = false
    propose(`Move ${at} to ${entryName(target)}`, [
      { op: 'addMention', args: [episode_id, { slug: target.slug, ...item }] },
      { op: 'deleteMention', args: [entry.slug, episode_id] },
    ])
  }
</script>

<div class="mention-edit">
  {#if !open && !moving}
    <div class="edit-actions">
      <button type="button" onclick={start}>Edit</button>
      {#if mention.confidence === 'low'}<button type="button" onclick={check}>Mark checked</button>{/if}
      <button type="button" onclick={() => (moving = true)}>Move to…</button>
      <button type="button" class="danger" onclick={remove}>Delete</button>
    </div>
    {#if hint}<p class="edit-hint">{hint}</p>{/if}
  {:else if moving}
    <div class="edit-panel">
      <EntryPicker label="Move this mention to" exclude={[entry.slug]} onpick={moveTo} />
      <div class="edit-actions"><button type="button" onclick={() => (moving = false)}>Cancel</button></div>
    </div>
  {:else}
    <form class="edit-panel" onsubmit={(ev) => (ev.preventDefault(), save())}>
      <div class="edit-fields">
        <label
          >Time (s): {fmtTime(Number(draft.t) || 0)}
          <span class="row">
            <input type="number" min="0" step="1" bind:value={draft.t} required />
            {#if currentTime}<button type="button" class="edit-btn" onclick={now}>Player time</button>{/if}
          </span>
        </label>
        <label>Role<select bind:value={draft.role}>{#each ROLES as r}<option value={r}>{r}</option>{/each}</select></label>
        <label
          >Confidence<select bind:value={draft.confidence}>{#each CONFIDENCES as c}<option value={c}>{c}</option>{/each}</select></label
        >
      </div>
      <label class="edit-field note-field">Note, with links as [[type:target]]<textarea bind:value={draft.note}></textarea></label>
      <p class="preview"><Note {mention} self={entry} note={draft.note} /></p>
      <div class="edit-actions">
        <button type="button" onclick={() => (open = false)}>Cancel</button>
        <button type="submit" class="primary">Preview the change</button>
      </div>
    </form>
  {/if}
</div>

<style>
  .mention-edit :global(.edit-actions) {
    margin-top: 8px;
  }
  .row {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .row input {
    width: 7em;
  }
  .note-field {
    margin-top: 10px;
  }
  .preview {
    margin: 6px 0 0;
    padding: 6px 8px;
    background: var(--card);
    border-radius: 4px;
    font-size: 0.98rem;
    overflow-wrap: anywhere;
  }
</style>
