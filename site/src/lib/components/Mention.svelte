<script>
  // One episode that mentions the entry, on the entry page. `children` go at the end (the edit
  // tools, in debug mode).
  import { episode as episodeById } from '#toolkit/query/index.js'
  import { db } from '../db.js'
  import { fmtDate, fmtTime } from '../format.js'
  import { episodeHref } from '../paths.js'
  import { LEAD_IN, youtubeUrl } from '../youtube.js'
  import Note from './Note.svelte'
  import Player from './Player.svelte'
  import RoleBadge from './RoleBadge.svelte'

  let { mention, entry, children } = $props()

  const ep = $derived(episodeById(db.index, mention.episode_id) ?? { id: mention.episode_id, title: 'Unknown episode' })
  const start = $derived(Math.max(0, mention.t - LEAD_IN))
</script>

<li class="mention">
  <Player videoId={ep.id} {start} label="Play from {fmtTime(start)}" />
  <div class="mention-body">
    <a class="mention-episode" href={episodeHref(ep.id)}>{ep.title}</a>
    <p class="meta">
      {#if ep.date}<time datetime={ep.date}>{fmtDate(ep.date)}</time>{' · '}{/if}at
      <a href={youtubeUrl(ep.id, start)} target="_blank" rel="noopener">{fmtTime(mention.t)} on YouTube</a>
      <RoleBadge role={mention.role} />
    </p>
    {#if mention.note}<p class="note"><Note {mention} self={entry} /></p>{/if}
    {#if mention.confidence === 'low'}
      <p class="flag" title="The automatic captions were unclear here, so the spelling or the entry itself may be wrong.">
        Unverified: the captions were unclear here
      </p>
    {/if}
    {@render children?.()}
  </div>
</li>

<style>
  .mention {
    display: grid;
    grid-template-columns: minmax(0, 360px) minmax(0, 1fr);
    gap: 22px;
    align-items: start;
    padding: 16px;
    background: var(--card);
    border: 1px solid var(--rule);
    border-radius: calc(var(--radius) + 2px);
    box-shadow: var(--shadow);
  }
  .mention-episode {
    font-family: var(--serif-display);
    font-weight: 600;
    font-size: 1.2rem;
    line-height: 1.25;
    text-decoration: none;
  }
  .mention-body .meta {
    margin-top: 4px;
  }

  /* Long words: see app.css. */
  .mention-episode {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: bottom;
  }

  @media (max-width: 700px) {
    .mention {
      grid-template-columns: minmax(0, 1fr);
      gap: 14px;
      padding: 12px;
    }
  }
</style>
