<script>
  // Paths that match no other page. A route of its own, so that the app renders it: SvelteKit
  // would load an unmatched path from the server, which starts the app and loads the data again.
  import NotFound from '#lib/components/NotFound.svelte'
</script>

<NotFound />
