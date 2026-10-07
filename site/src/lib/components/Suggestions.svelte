<script>
  // The home page before any search: recurring entries, the latest episode, a lucky dip.
  import { episodeMentions } from '#toolkit/query/index.js'
  import { db, episodesOf, shuffle, SUGGESTION_COUNT } from '../db.js'
  import { fmtDate, fmtNumber } from '../format.js'
  import { episodeHref } from '../paths.js'
  import EntryList from './EntryList.svelte'

  let { onbrowse } = $props()

  const recurring = db.entries
    .filter((e) => episodesOf(e).discussed > 1)
    .sort((a, b) => episodesOf(b).discussed - episodesOf(a).discussed || a.term.localeCompare(b.term))
    .slice(0, SUGGESTION_COUNT)
  const latest = db.latest ? episodeMentions(db.index, db.latest.id) : []
  const latestPick = latest.filter((_, i) => i % Math.max(1, Math.floor(latest.length / SUGGESTION_COUNT)) === 0)

  // Raw: the toolkit's index looks entries up by identity, which a deep proxy would break.
  let random = $state.raw(db.random)
  const reshuffle = () => {
    db.random = shuffle(db.entries).slice(0, SUGGESTION_COUNT)
    random = db.random
  }
</script>

{#if recurring.length}
  <section class="suggest">
    <h2 class="section-title"><span>Heard again and again</span></h2>
    <p class="section-sub">Entries that came up in more than one episode.</p>
    <EntryList entries={recurring} />
  </section>
{/if}
{#if db.latest && latestPick.length}
  <section class="suggest">
    <h2 class="section-title"><span>From the latest episode</span></h2>
    <p class="section-sub">
      <a href={episodeHref(db.latest.id)}>{db.latest.title}</a>
      · {fmtDate(db.latest.date)}
    </p>
    <EntryList entries={latestPick.slice(0, SUGGESTION_COUNT).map((x) => x.entry)} />
  </section>
{/if}
<section class="suggest">
  <h2 class="section-title"><span>A lucky dip</span></h2>
  <p class="section-sub">
    A random handful from the hoard.
    <button type="button" class="link-button" onclick={reshuffle}>Shuffle</button>
  </p>
  <EntryList entries={random} />
</section>
<p class="browse-all">
  <button type="button" class="more" onclick={onbrowse}>Browse all {fmtNumber(db.entries.length)} entries, A to Z</button>
</p>

<style>
  .browse-all {
    margin-top: 36px;
  }

  .link-button {
    border: 0;
    background: none;
    padding: 0;
    color: var(--rubric);
    text-decoration: underline;
    text-underline-offset: 0.18em;
    cursor: pointer;
  }
</style>
