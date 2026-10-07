An unofficial fan project: a searchable index of the words, expressions and named things
discussed on the *Words Unravelled* podcast (Rob Watts and Jess Zafarris), with a link to
the moment each one comes up. This prototype covers the **audience side** only.

For the ingest pipeline (download, transcripts) see `ingest/README.md`.

## Branches

- `main` is release-only: every push to it deploys the site to GitHub Pages
  (`.github/workflows/pages.yml`). Never push or open a PR to `main` unless asked for a release.
- `dev` is the integration branch. Feature branches start from `dev` and their PRs go to `dev`.
  A release merges `dev` into `main`. Hotfixes go to `main`, then `main` is merged back into `dev`.

## Things that cost a lot

- Any `claude -p` run over transcripts uses real Claude usage. Run it only when asked, and only
  on the episodes named.
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

## No backward compatibility

Keep one code path for the current format. When a format changes (extraction prompt,
`entries.json`, link syntax), convert or regenerate the data and delete the old
handling: no version checks, legacy branches, or comments and docs about old formats. Changes
should be designed so that full ingest rerun is not needed.

Superseded plans go in `docs/` with a status header at the top.

## Code

- The site is Svelte 5 with SvelteKit (adapter-static, a single-page app). Data logic (slugs,
  links, search, indexes) stays in `toolkit/`, shared with the checks and the tools that edit data.
  `toolkit/` is only for that shared data handling and retrieval: logic of a site feature that
  only the site uses (like the graph page's graph and layout) lives in `site/src/lib/`.
- Slugs, link parsing and link resolution live in `toolkit/` only; the site imports them.
- Tests: `cd toolkit && npm test`, and for the site's own logic `cd site && npm test`.
- READMEs describe current behaviour. Update them in the same change as the code.
- Commit subjects are imperative and prefixed with the area when there is one:
  `Site: …`, `toolkit: …`, `ingest: …`.
- Known problems are tracked as GitHub issues (`gh issue list`).
