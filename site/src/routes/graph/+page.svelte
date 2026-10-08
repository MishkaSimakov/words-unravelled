<script>
  import GraphView from '#lib/graph/GraphView.svelte'
  import { dataVersion } from '#lib/version.svelte.js'
</script>

<svelte:head><title>Graph · Wordhoard</title></svelte:head>

<!-- Drawn afresh when the data is reloaded (after an edit in debug mode). -->
{#key dataVersion.n}<GraphView />{/key}
