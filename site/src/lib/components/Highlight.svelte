<script>
  // Text with the first match of the query marked.
  import { fold } from '#toolkit/model/slugs.js'

  let { text, query = '' } = $props()

  const parts = $derived.by(() => {
    const q = fold(query.trim())
    const i = q ? fold(text).indexOf(q) : -1
    if (i < 0) return null
    const chars = [...text]
    return [chars.slice(0, i).join(''), chars.slice(i, i + q.length).join(''), chars.slice(i + q.length).join('')]
  })
</script>

{#if parts}{parts[0]}<mark>{parts[1]}</mark>{parts[2]}{:else}{text}{/if}
