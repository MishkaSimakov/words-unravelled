<script>
  // An entry's name: the term, plus the gloss that tells it apart from homographs ("meal (flour)").
  import Highlight from './Highlight.svelte'

  let { entry, query = '' } = $props()
</script>

<Highlight text={entry.term} {query} />{#if entry.gloss}{' '}<span class="hw-gloss">({entry.gloss})</span>{/if}

<style>
  /* The gloss after a homograph's term: "meal (flour)". */
  .hw-gloss {
    font-weight: 400;
    font-size: 0.8em;
    letter-spacing: 0;
    color: var(--muted);
  }
</style>
