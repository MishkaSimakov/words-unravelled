<script>
  // Mounted once by the layout in dev: the confirmation dialog every edit goes through, the
  // merge dialog, and the banner after a change is saved, with Undo.
  import './edit.css'
  import { close, confirm, dismiss, pending, saved, undoLast } from './edits.svelte.js'
  import Effects from './Effects.svelte'
  import MergeDialog from './MergeDialog.svelte'

  let dialog = $state()

  $effect(() => {
    if (pending.ops && !dialog.open) dialog.showModal()
    if (!pending.ops && dialog.open) dialog.close()
  })

  const result = $derived(pending.result)
</script>

<dialog class="edit-dialog" bind:this={dialog} onclose={close} aria-labelledby="edit-dialog-title">
  <h2 id="edit-dialog-title">{pending.title}</h2>
  {#if !result}
    <p class="busy">Working out what this changes…</p>
  {:else if result.effects}
    <p class="lead">This edit changes:</p>
    <Effects effects={result.effects} />
  {:else}
    <p class="lead">This edit can't be applied:</p>
    {#if result.problems}
      <ul class="problems">{#each result.problems as p}<li><code>{p.code}</code> {p.message}</li>{/each}</ul>
    {:else}
      <pre class="problems">{result.conflict ?? result.error}</pre>
    {/if}
  {/if}
  <div class="edit-actions">
    <button type="button" onclick={close}>{result?.effects ? 'Cancel' : 'Close'}</button>
    {#if result?.effects}<button type="button" class="primary" disabled={pending.busy} onclick={confirm}>Apply</button>{/if}
  </div>
</dialog>

<MergeDialog />

{#if saved.message}
  <div class="banner" role="status">
    <p>
      {saved.message}
      {#if saved.introduced.length}It introduced {saved.introduced.length} problem{saved.introduced.length === 1 ? '' : 's'}:{/if}
    </p>
    {#if saved.introduced.length}
      <ul>{#each saved.introduced as p}<li><code>{p.code}</code> {p.message}</li>{/each}</ul>
    {/if}
    <div class="edit-actions">
      {#if saved.undo}<button type="button" onclick={undoLast}>Undo</button>{/if}
      <button type="button" onclick={dismiss}>Dismiss</button>
    </div>
  </div>
{/if}

<style>
  .lead,
  .busy {
    margin: 0;
    color: var(--ink-soft);
  }
  .busy {
    font-style: italic;
  }
  .problems {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font-size: 0.92rem;
  }
  code {
    font-family: var(--mono);
    font-size: 0.82rem;
  }
  .banner {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 20;
    width: min(440px, calc(100vw - 32px));
    max-height: 50vh;
    overflow: auto;
    padding: 12px 16px;
    border: 1px solid var(--rule);
    border-left: 3px solid var(--rubric);
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    font-size: 0.92rem;
  }
  .banner p {
    margin: 0;
  }
  .banner ul {
    margin: 6px 0 0;
    padding-left: 18px;
  }
</style>
