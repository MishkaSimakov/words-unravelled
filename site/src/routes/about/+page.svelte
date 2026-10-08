<svelte:head><title>About · Wordhoard</title></svelte:head>

<article class="prose">
  <h1 class="page-title">About</h1>
  <p class="callout">
    <strong>This is an unofficial fan project.</strong> It is not affiliated with,
    endorsed by or connected to RobWords, Words Unravelled, Rob Watts or Jess Zafarris.
  </p>

  <p>
    <em>Words Unravelled</em> is a podcast about etymology hosted by Rob Watts and Jess Zafarris.
    Each episode takes a theme and works through dozens of words, expressions and names. This site is an
    index to that back catalogue: search for a word and it tells you which episodes discussed it,
    and plays the video from that moment.
  </p>

  <h2>Go to the source</h2>
  <ul>
    <li><a href="https://www.youtube.com/@wordsunravelled" target="_blank" rel="noopener">Words Unravelled on YouTube</a></li>
    <li><a href="https://www.youtube.com/@RobWords" target="_blank" rel="noopener">RobWords</a>, Rob’s YouTube channel</li>
    <li><a href="https://www.uselessetymology.com/" target="_blank" rel="noopener">Useless Etymology</a>, Jess’s site</li>
  </ul>

  <h2>How the index is made</h2>
  <p>
    Entries are extracted automatically from YouTube’s auto-generated captions with the help of an
    AI model, then grouped across episodes. Each entry keeps only the term, a one-line note on what
    the hosts say about it, and a link to the moment it comes up. There are no transcripts or
    summaries here: the explanations are in the episodes, so go and watch them.
  </p>
  <p>
    Automatic captions mishear foreign words and names, so some spellings will be off and some
    timestamps may land a little early or late. Entries the captions made uncertain are marked
    <span class="flag flag-inline">Unverified</span>.
  </p>
</article>

<style>
  .callout {
    padding: 14px 18px;
    border-left: 3px solid var(--rubric);
    background: var(--card);
    border-radius: 0 var(--radius) var(--radius) 0;
  }
  .flag-inline {
    margin: 0;
  }
</style>
