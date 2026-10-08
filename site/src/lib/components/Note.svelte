<script>
  /**
   * A mention's note with its links turned into entry links, from the parsed and resolved parts
   * the toolkit's index keeps. Links to things that aren't entries, links back to `self`, and all
   * links when `links` is false (e.g. inside another <a>) stay plain text. Given `note`, it shows
   * that text instead (an unsaved edit, in debug mode) and marks the links that lead nowhere.
   */
  import { parseNote } from '#toolkit/model/links.js'
  import { entryName } from '#toolkit/model/schema.js'
  import { entry as entryBySlug, noteParts } from '#toolkit/query/index.js'
  import { resolveLink } from '#toolkit/query/links.js'
  import { db } from '../db.js'
  import { linkTitle } from '../entries.js'
  import { entryHref } from '../paths.js'

  let { mention, links = true, self = null, note = null } = $props()

  const source = $derived(
    note === null
      ? noteParts(db.index, mention)
      : parseNote(note).map((part) => (typeof part === 'string' ? part : { ...part, slug: resolveLink(db.index.links, part.target, self?.slug) })),
  )

  // Plain text runs are joined, so text shapes across them as in one string.
  const parts = $derived.by(() => {
    const parts = []
    for (const part of source) {
      const entry = typeof part !== 'string' && links && part.slug ? entryBySlug(db.index, part.slug) : null
      if (entry && entry !== self) parts.push({ ...part, entry })
      else if (note !== null && typeof part !== 'string') parts.push({ ...part, nowhere: true })
      else if (parts.at(-1) && !parts.at(-1).entry && !parts.at(-1).nowhere) parts.at(-1).text += part.text ?? part
      else parts.push({ text: part.text ?? part })
    }
    return parts
  })
</script>

{#each parts as part}{#if part.entry}<a
      class="note-link"
      href={entryHref(part.entry)}
      data-slug={part.entry.slug}
      data-type={part.type}
      data-uncertain={part.uncertain ? '' : undefined}
      title={linkTitle(part.type, part.uncertain) + (part.entry.gloss ? `: ${entryName(part.entry)}` : '')}
      >{part.text}</a
    >{:else if part.nowhere}<span class="note-nowhere" title="{linkTitle(part.type, part.uncertain)}: leads nowhere">{part.text}</span
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
  .note-nowhere {
    text-decoration: underline wavy var(--muted);
    text-underline-offset: 0.2em;
  }
  .note-link[data-uncertain] {
    text-decoration-style: dotted;
    text-decoration-thickness: 1.5px;
  }
</style>
