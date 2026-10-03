<script>
  import { episodeMentions } from '#toolkit/query/index.js'
  import { db } from '#lib/db.js'
  import { fmtDate, fmtTime, plural } from '#lib/format.js'
  import { episodeHref } from '#lib/paths.js'
  import { thumbUrl } from '#lib/youtube.js'
</script>

<svelte:head><title>Episodes · Wordhoard</title></svelte:head>

<header class="page-head">
  <h1 class="page-title">Episodes</h1>
</header>
<ol class="episode-list">
  {#each db.episodes as ep (ep.id)}
    <li>
      <a href={episodeHref(ep.id)}>
        <span class="episode-list-thumb">
          <img src={thumbUrl(ep.id)} alt="" loading="lazy" width="480" height="360" />
          {#if ep.duration}<span class="episode-list-duration">{fmtTime(ep.duration)}</span>{/if}
        </span>
        <span class="episode-list-text">
          <span class="episode-list-title">{ep.title}</span>
          <span class="meta">{fmtDate(ep.date)} · {plural(episodeMentions(db.index, ep.id).length, 'entry', 'entries')}</span>
        </span>
      </a>
    </li>
  {/each}
</ol>

<style>
  .page-head {
    margin: 40px 0 24px;
  }
  .page-head .page-title {
    margin-top: 0;
  }

  .episode-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 32px 18px;
  }
  .episode-list a {
    display: flex;
    flex-direction: column;
    gap: 10px;
    text-decoration: none;
    color: inherit;
  }
  .episode-list-thumb {
    position: relative;
    display: block;
    border-radius: calc(var(--radius) + 4px);
    overflow: hidden;
    background: var(--rule);
  }
  .episode-list img {
    display: block;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    width: 100%;
    height: auto;
    transition: transform 0.2s ease;
  }
  .episode-list a:hover img {
    transform: scale(1.03);
  }
  .episode-list-duration {
    position: absolute;
    right: 6px;
    bottom: 6px;
    padding: 1px 5px;
    border-radius: 4px;
    background: rgb(0 0 0 / 0.8);
    color: #fff;
    font-size: 0.78rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: 1.4;
  }
  .episode-list-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .episode-list-title {
    font-family: var(--serif-display);
    font-weight: 600;
    font-size: 1.05rem;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .episode-list a:hover .episode-list-title {
    color: var(--rubric);
  }

  /* Long words: see app.css. */
  .episode-list-title {
    overflow-wrap: anywhere;
  }

  @media (max-width: 700px) {
    .episode-list {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
