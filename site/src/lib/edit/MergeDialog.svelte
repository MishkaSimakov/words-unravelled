<script>
  // Setting up a merge: which entry survives, which value each field keeps (the survivor's,
  // with its blanks filled from the other by default), and in each episode where both entries
  // have a mention, whose mention stays. It proposes setFields (if any field comes from the
  // other entry), then mergeEntries.
  import { goto } from '$app/navigation'
  import { entryName } from '#toolkit/model/schema.js'
  import { entry as entryBySlug, episode as episodeById } from '#toolkit/query/index.js'
  import { db } from '../db.js'
  import { fmtTime } from '../format.js'
  import { entryHref } from '../paths.js'
  import { merging, openMerge, propose } from './edits.svelte.js'
  import EntryPicker from './EntryPicker.svelte'

  const FIELDS = ['original', 'translation', 'language', 'category']
  const blank = (value) => value === null || value === undefined || value === ''

  let dialog = $state()
  const from = $derived(merging.from && entryBySlug(db.index, merging.from))
  const into = $derived(merging.into && entryBySlug(db.index, merging.into))

  // Choices, reset whenever the pair changes: field -> 'from' | 'into', episode -> 'from' | 'into'.
  let fieldSide = $state({})
  let keep = $state({})
  const clashes = $derived(
    from && into ? from.mentions.filter((m) => into.mentions.some((n) => n.episode_id === m.episode_id)).map((m) => m.episode_id) : [],
  )
  $effect(() => {
    if (!from || !into) return
    fieldSide = Object.fromEntries(FIELDS.map((f) => [f, blank(into[f]) && !blank(from[f]) ? 'from' : 'into']))
    keep = Object.fromEntries(clashes.map((id) => [id, 'into']))
  })

  $effect(() => {
    if (merging.from && !dialog.open) dialog.showModal()
    if (!merging.from && dialog.open) dialog.close()
  })

  const close = () => openMerge(null)
  const mentionIn = (entry, id) => entry.mentions.find((m) => m.episode_id === id)

  function submit() {
    const fields = Object.fromEntries(FIELDS.filter((f) => fieldSide[f] === 'from' && from[f] !== into[f]).map((f) => [f, from[f]]))
    const ops = []
    if (Object.keys(fields).length) ops.push({ op: 'setFields', args: [into.slug, fields] })
    ops.push({ op: 'mergeEntries', args: [from.slug, into.slug, clashes.length ? { keep: $state.snapshot(keep) } : {}] })
    const title = `Merge ${entryName(from)} into ${entryName(into)}`
    const target = into
    const onFromPage = decodeURIComponent(location.pathname) === decodeURIComponent(entryHref(from))
    close() // which clears `from` and `into`
    propose(title, ops, { then: onFromPage ? () => goto(entryHref(target)) : null })
  }
</script>

<dialog class="edit-dialog wide" bind:this={dialog} onclose={close} aria-labelledby="merge-title">
  {#if from}
    <h2 id="merge-title">Merge {entryName(from)}{#if into}{' '}into {entryName(into)}{/if}</h2>
    {#if !into}
      <EntryPicker label="Merge into" exclude={[from.slug]} onpick={(e) => openMerge(from.slug, e.slug)} />
    {:else}
      <p class="edit-hint">
        {entryName(from)} is deleted; its mentions and the links to it go to {entryName(into)}, which keeps its name.
        <button type="button" class="edit-btn" onclick={() => openMerge(into.slug, from.slug)}>Keep {entryName(from)} instead</button>
      </p>
      <table>
        <thead><tr><th></th><th>{entryName(from)}</th><th>{entryName(into)}</th></tr></thead>
        <tbody>
          {#each FIELDS as field}
            <tr>
              <th scope="row">{field}</th>
              {#each ['from', 'into'] as side}
                {@const value = (side === 'from' ? from : into)[field]}
                <td>
                  <label>
                    <input type="radio" name="field-{field}" value={side} bind:group={fieldSide[field]} />
                    {blank(value) ? '—' : value}
                  </label>
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
      {#if clashes.length}
        <h3>Both have a mention in {clashes.length === 1 ? 'this episode' : `these ${clashes.length} episodes`}: which stays?</h3>
        {#each clashes as id}
          <fieldset>
            <legend>{episodeById(db.index, id)?.title ?? id}</legend>
            {#each [['from', from], ['into', into]] as [side, entry]}
              {@const m = mentionIn(entry, id)}
              <label class="clash">
                <input type="radio" name="keep-{id}" value={side} bind:group={keep[id]} />
                <span><b>{entryName(entry)}</b> at {fmtTime(m.t)}, {m.role}{m.confidence === 'low' ? ', unverified' : ''}: {m.note || '(no note)'}</span>
              </label>
            {/each}
          </fieldset>
        {/each}
      {/if}
    {/if}
    <div class="edit-actions">
      <button type="button" onclick={close}>Cancel</button>
      {#if into}<button type="button" class="primary" onclick={submit}>Preview the merge</button>{/if}
    </div>
  {/if}
</dialog>

<style>
  h3 {
    margin: 18px 0 6px;
    font-size: 1rem;
  }
  table {
    width: 100%;
    margin-top: 12px;
    border-collapse: collapse;
    font-size: 0.95rem;
  }
  th,
  td {
    text-align: left;
    padding: 4px 8px 4px 0;
    border-bottom: 1px dotted var(--rule);
    vertical-align: top;
    overflow-wrap: anywhere;
  }
  tbody th {
    font-weight: 400;
    font-variant-caps: all-small-caps;
    letter-spacing: 0.06em;
    color: var(--muted);
  }
  fieldset {
    margin: 0 0 8px;
    border: 1px solid var(--rule);
    border-radius: var(--radius);
  }
  legend {
    font-style: italic;
  }
  .clash {
    display: flex;
    gap: 8px;
    align-items: baseline;
    margin: 4px 0;
    font-size: 0.92rem;
    overflow-wrap: anywhere;
  }
</style>
