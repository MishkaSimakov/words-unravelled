An unofficial fan project: a searchable index of the words, expressions and named things
discussed on the *Words Unravelled* podcast (Rob Watts and Jess Zafarris), with a link to
the moment each one comes up. This prototype covers the **audience side** only.

For the ingest pipeline (a new episode: captions, transcript, extraction agent, verification,
report) see `ingest/README.md`.

## Branches

- `main` is release-only: every push to it deploys the site to GitHub Pages
  (`.github/workflows/pages.yml`). Never push or open a PR to `main` unless asked for a release,
  except from an `episode/` branch (below).
- `dev` is the integration branch. Feature branches start from `dev` and their PRs go to `dev`.
  A release merges `dev` into `main`. Hotfixes go to `main`, then `main` is merged back into `dev`.
- `episode/<video_id>` branches add one episode each. `ingest/new-episode.sh` makes them from
  `main` (a scheduled cloud run, or by hand); they are reviewed and fixed on the branch, then
  merged into `main`, and `main` is merged back into `dev`.

## Things that cost a lot

- Any `claude -p` run over transcripts uses real Claude usage: `ingest/new-episode.sh` and
  `ingest/3-extract/run.js`. Run them only when asked, and only on the episodes named. The tests
  (`cd ingest && npm test`) use a mock claude and a fake API, and cost nothing.
- `ingest/1-download.sh` sleeps 60 s per caption file. Don't start a full download casually.

## Data rules

- `data/entries.json`, `data/episodes.json` and `data/silenced.json` (warnings marked fine) are
  the source of truth, with no build step: edit them directly, keep their one-space JSON
  indentation, and commit them (Pages builds from the committed data).
- An entry's slug must stay the slug of its term and gloss; renaming or glossing an entry means
  rewriting the links that name it.
- After editing the data, run `cd toolkit && npm run check`: errors must be fixed (the Pages
  workflow fails on them), warnings are only for review.
- Captions and transcripts (`ingest/1-youtube/`, `ingest/2-transcripts/`) must never be committed.
  `ingest/runs/<video_id>/` (the agent's record, log, verification and report) is committed with
  the episode and kept as its history.

## No backward compatibility

Keep one code path for the current format. When a format changes (extraction prompt,
`entries.json`, link syntax), convert or regenerate the data and delete the old
handling: no version checks, legacy branches, or comments and docs about old formats. Changes
should be designed so that full ingest rerun is not needed.

Superseded plans go in `docs/` with a status header at the top.

## Code

- The site is Svelte 5 with SvelteKit (adapter-static, a single-page app). Data logic (slugs,
  links, search, indexes) stays in `toolkit/`, shared with the checks and the tools that edit data.
- Slugs, link parsing and link resolution live in `toolkit/` only; the site imports them.
- Tests: `cd toolkit && npm test` and `cd ingest && npm test`.
- READMEs describe current behaviour. Update them in the same change as the code.
- Commit subjects are imperative and prefixed with the area when there is one:
  `Site: …`, `toolkit: …`, `ingest: …`.
- Known problems are tracked as GitHub issues (`gh issue list`).
