<script>
  import EntryItem from './EntryItem.svelte'

  let { entries, query = '', letters = false } = $props()

  // Dictionary-style browsing: runs of entries under their initial letters.
  const groups = $derived.by(() => {
    if (!letters) return []
    const groups = []
    for (const e of entries) {
      if (e.letter !== groups.at(-1)?.letter) groups.push({ letter: e.letter, entries: [] })
      groups.at(-1).entries.push(e)
    }
    return groups
  })
</script>

{#if !letters}
  <ol class="results">
    {#each entries as entry (entry.slug)}<EntryItem {entry} {query} />{/each}
  </ol>
{:else}
  {#each groups as group (group.letter)}
    <h3 class="letter">{group.letter}</h3>
    <ol class="results">
      {#each group.entries as entry (entry.slug)}<EntryItem {entry} />{/each}
    </ol>
  {/each}
{/if}

<style>
  /* A list of entries, laid out like dictionary columns on wide screens. */
  .results {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 0 28px;
  }

  .letter {
    font-family: var(--serif-display);
    font-weight: 700;
    font-size: 2rem;
    color: var(--rubric);
    margin: 28px 0 0;
    padding-bottom: 2px;
    border-bottom: 2px solid var(--ink);
    line-height: 1.2;
  }

  @media (max-width: 700px) {
    .results {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
