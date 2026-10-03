<script>
  // Errors while rendering a page. Unknown paths are [...path].
  import { page } from '$app/state'
  import NotFound from '#lib/components/NotFound.svelte'
  import { href } from '#lib/paths.js'
</script>

<svelte:head>{#if page.status !== 404}<title>Error · Wordhoard</title>{/if}</svelte:head>

{#if page.status === 404}
  <NotFound />
{:else}
  <article class="prose">
    <h1 class="page-title">Something went wrong</h1>
    <p>{page.error?.message} <a href={href()}>Search the index</a> instead.</p>
  </article>
{/if}
