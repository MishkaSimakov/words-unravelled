<script>
  import { episodesOf } from '../db.js'
  import { forms, roleRank } from '../entries.js'
  import { plural } from '../format.js'
  import { entryHref } from '../paths.js'
  import CategoryTag from './CategoryTag.svelte'
  import EntryName from './EntryName.svelte'
  import Highlight from './Highlight.svelte'
  import Note from './Note.svelte'
  import RoleBadges from './RoleBadges.svelte'

  let { entry, query = '' } = $props()

  const { original, translation } = $derived(forms(entry))
  const mention = $derived([...entry.mentions].sort((a, b) => roleRank(a) - roleRank(b))[0])
  const { discussed, all } = $derived(episodesOf(entry))
</script>

<li>
  <a class="result" href={entryHref(entry)}>
    <span class="result-head">
      <span class="hw"><EntryName {entry} {query} /></span>
      <span class="result-class">
        <CategoryTag {entry} />
        {#if entry.language}<span class="lang">{entry.language}</span>{/if}
      </span>
    </span>
    {#if original || translation}
      <span class="result-forms"
        >{#if original}<i><Highlight text={original} {query} /></i>{/if}{#if original && translation}{' · '}{/if}{#if translation}<Highlight text="‘{translation}’" {query} />{/if}</span
      >
    {/if}
    {#if mention?.note}<span class="result-note"><Note {mention} links={false} /></span>{/if}
    <span class="result-count"
      >{discussed ? plural(discussed, 'episode') : `Mentioned in ${plural(all, 'episode')}`} <RoleBadges {entry} /></span
    >
  </a>
</li>

<style>
  .result {
    display: flex;
    flex-direction: column;
    gap: 2px;
    height: 100%;
    padding: 12px 10px 12px 0;
    border-bottom: 1px dotted var(--rule);
    text-decoration: none;
  }
  .result:hover .hw,
  .result:focus-visible .hw {
    color: var(--rubric);
  }
  .result:hover {
    color: inherit;
  }
  .result-head {
    display: flex;
    flex-direction: column;
  }
  .result-class {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0 8px;
    font-size: 0.95rem;
  }
  .result-forms {
    font-size: 0.95rem;
    color: var(--ink-soft);
  }
  .result-note {
    font-size: 0.92rem;
    color: var(--muted);
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .result-count {
    margin-top: auto;
    padding-top: 2px;
    font-size: 0.8rem;
    font-variant-caps: all-small-caps;
    letter-spacing: 0.07em;
    color: var(--muted);
  }

  /* Long words: see app.css. */
  .result .hw,
  .result-forms {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .result-note {
    overflow-wrap: anywhere;
  }
</style>
