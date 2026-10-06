<script>
  // Choosing an entry by searching for it, as the home page searches.
  import { entryName } from '#toolkit/model/schema.js'
  import { search } from '../db.js'

  let { label = 'Entry', exclude = [], onpick } = $props()

  let query = $state('')
  const results = $derived.by(() => (query.trim() ? search(query).filter((e) => !exclude.includes(e.slug)).slice(0, 8) : []))
</script>

<div class="picker">
  <label class="edit-field">{label}<input type="search" bind:value={query} placeholder="Search entries" /></label>
  {#if results.length}
    <ul>
      {#each results as entry (entry.slug)}
        <li>
          <button type="button" onclick={() => onpick(entry)}>{entryName(entry)}</button>
          <span class="lang">{entry.language ?? ''}</span>
          <span class="slug">{entry.slug}</span>
        </li>
      {/each}
    </ul>
  {:else if query.trim()}
    <p class="edit-hint">No entry matches.</p>
  {/if}
</div>

<style>
  ul {
    list-style: none;
    margin: 4px 0 0;
    padding: 0;
  }
  li {
    display: flex;
    gap: 8px;
    align-items: baseline;
    padding: 2px 0;
  }
  li button {
    border: none;
    background: none;
    padding: 0;
    cursor: pointer;
    font-family: var(--serif-display);
    font-weight: 600;
    text-decoration: underline;
    text-decoration-color: var(--rule);
  }
  li button:hover {
    color: var(--rubric);
  }
  .slug {
    font-family: var(--mono);
    font-size: 0.78rem;
    color: var(--muted);
  }
</style>
