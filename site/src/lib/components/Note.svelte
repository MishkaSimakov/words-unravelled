<script>
  /**
   * A mention's note with its links turned into entry links, from the parsed and resolved parts
   * the toolkit's index keeps. Links to things that aren't entries, links back to `self`, and all
   * links when `links` is false (e.g. inside another <a>) stay plain text.
   */
  import { entryName } from '#toolkit/model/schema.js'
  import { entry as entryBySlug, noteParts } from '#toolkit/query/index.js'
  import { db } from '../db.js'
  import { linkTitle } from '../entries.js'
  import { entryHref } from '../paths.js'

  let { mention, links = true, self = null } = $props()

  // Plain text runs are joined, so text shapes across them as in one string.
  const parts = $derived.by(() => {
    const parts = []
    for (const part of noteParts(db.index, mention)) {
      const entry = typeof part !== 'string' && links && part.slug ? entryBySlug(db.index, part.slug) : null
      if (entry && entry !== self) parts.push({ ...part, entry })
      else if (parts.at(-1) && !parts.at(-1).entry) parts.at(-1).text += part.text ?? part
      else parts.push({ text: part.text ?? part })
    }
    return parts
  })
</script>

{#each parts as part}{#if part.entry}<a
      class="note-link"
      href={entryHref(part.entry)}
      data-type={part.type}
      data-uncertain={part.uncertain ? '' : undefined}
      title={linkTitle(part.type, part.uncertain) + (part.entry.gloss ? `: ${entryName(part.entry)}` : '')}
      >{part.text}</a
    >{:else}{part.text}{/if}{/each}

<style>
  /* A note breaks its plain words but not its links' words, so a long link overflows its line and
     the note cuts it (an inline-block link would leave the punctuation after it on a line of its own). */
  .note-link {
    overflow-wrap: normal;
  }
  /* Typed links in notes: "unrelated" is muted, uncertain relations get a dotted underline. */
  .note-link[data-type='unrelated'] {
    color: var(--muted);
    text-decoration-color: color-mix(in srgb, var(--muted) 55%, transparent);
  }
  .note-link[data-uncertain] {
    text-decoration-style: dotted;
    text-decoration-thickness: 1.5px;
  }
</style>
