<script>
  import { search } from '../db.js'
  import { href } from '../paths.js'
  import EntryList from './EntryList.svelte'

  let { message = 'That page isn’t in the hoard.', suggestion = '' } = $props()

  const alternatives = $derived(suggestion ? search(suggestion).slice(0, 6) : [])
</script>

<svelte:head><title>Not found · Wordhoard</title></svelte:head>

<article class="prose">
  <h1 class="page-title">Not found</h1>
  <p>{message} <a href={href()}>Search the index</a> instead.</p>
  {#if alternatives.length}
    <h2>Did you mean…</h2>
    <EntryList entries={alternatives} />
  {/if}
</article>
