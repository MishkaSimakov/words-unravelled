<script>
  // The review tool's list of problems: dev only. A build has no edit tools, so it shows the
  // page for unknown paths.
  import NotFound from '#lib/components/NotFound.svelte'

  const edit = import.meta.env.DEV ? import('#lib/edit/index.js') : null
</script>

{#if edit}{#await edit then tools}<tools.Review />{/await}{:else}<NotFound />{/if}
