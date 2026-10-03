<script>
  /**
   * A YouTube thumbnail that turns into a player when clicked (nothing loads from YouTube's player
   * until then). With `api`, the player is made through the IFrame API, so the page can read the
   * playback position and seek; if the API is blocked, a plain embed is used instead.
   */
  import { tick } from 'svelte'
  import { embedUrl, loadYoutubeApi, thumbUrl } from '../youtube.js'

  let { videoId, start, label, api = false } = $props()

  let el
  let mode = $state('cover') // then 'embed' or 'api'
  let embedStart = $state(0)
  let yt = null // YT.Player once started
  let starting = null // resolves to the YT.Player, or to null if the API is blocked

  const embed = (t) => {
    embedStart = t
    mode = 'embed'
  }

  async function startApi(t) {
    let YT
    try {
      YT = await loadYoutubeApi()
    } catch (err) {
      console.warn(err)
      embed(t)
      return null
    }
    mode = 'api'
    await tick()
    // The API replaces this element with its iframe.
    const host = document.createElement('div')
    el.append(host)
    return new Promise((resolve) => {
      const player = new YT.Player(host, {
        host: 'https://www.youtube-nocookie.com',
        videoId,
        playerVars: { start: Math.floor(t), autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
        events: { onReady: () => resolve(player) },
      })
    })
  }

  /** Plays from `t` seconds: starts the player, or seeks if it is already playing. */
  export async function play(t) {
    if (!api) return embed(t)
    if (!starting) {
      starting = startApi(t)
      yt = await starting
    } else if ((await starting) === null) {
      embed(t) // no API: reload the plain embed at the new time
    } else {
      yt.seekTo(t, true)
      yt.playVideo()
    }
  }

  /** The playback position in seconds, or null before the API player has started. */
  export const currentTime = () => (yt?.getCurrentTime ? yt.getCurrentTime() : null)

  export const element = () => el
</script>

<div class="player" bind:this={el}>
  {#if mode === 'cover'}
    <button type="button" class="player-cover" aria-label={label} onclick={() => play(start)}>
      <img src={thumbUrl(videoId)} alt="" loading="lazy" width="480" height="360" />
      <span class="player-play"><span class="play-icon" aria-hidden="true"></span>{label}</span>
    </button>
  {:else if mode === 'embed'}
    <iframe
      src={embedUrl(videoId, embedStart)}
      title="YouTube video player"
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowfullscreen
    ></iframe>
  {/if}
</div>

<style>
  .player {
    position: relative;
    aspect-ratio: 16 / 9;
    border-radius: var(--radius);
    overflow: hidden;
    background: #000;
  }
  /* :global for the API player's iframe, which YouTube's script makes. */
  .player :global(iframe) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }
  .player-cover {
    position: absolute;
    inset: 0;
    width: 100%;
    border: 0;
    padding: 0;
    cursor: pointer;
    background: #000;
  }
  .player-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.85;
    transition: opacity 0.2s, transform 0.4s;
  }
  .player-cover:hover img {
    opacity: 1;
    transform: scale(1.02);
  }
  .player-play {
    position: absolute;
    left: 12px;
    top: 12px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 13px 6px 10px;
    border-radius: 999px;
    background: rgb(20 16 12 / 0.82);
    color: #f6f0e2;
    font-size: 0.92rem;
    font-variant-numeric: tabular-nums;
  }
  .play-icon {
    width: 0;
    height: 0;
    border-left: 10px solid #f6f0e2;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
  }
  .player-cover:hover .player-play {
    background: var(--rubric);
  }
</style>
