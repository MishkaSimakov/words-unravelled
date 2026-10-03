<script>
  // An entry's category as a small label; on the entry page it links to the category.
  import { categoryById } from '../entries.js'
  import { href } from '../paths.js'

  let { entry, link = false } = $props()

  const cat = $derived(categoryById.get(entry.category))
</script>

{#if cat}{#if link}<a class="cat" href={href(`?cat=${cat.id}`)} title="Browse all {cat.noun}">{cat.label}</a>{:else}<span class="cat">{cat.label}</span>{/if}{/if}

<style>
  /* An entry's category, set like a dictionary's part-of-speech label: italic, beside the language. */
  .cat {
    font-style: italic;
    color: var(--ink-soft);
  }
  a.cat {
    text-decoration-line: underline;
  }
</style>
