# Wordhoard: a Words Unravelled word index (prototype)

An unofficial fan project: a searchable index of the words, idioms, phrases and names
discussed on the *Words Unravelled* podcast (Rob Watts and Jess Zafarris), with a link to
the moment each one comes up. This prototype covers the **audience side** only. See
`prototype_brief.md` for the background.

```
subs/          raw captions (.json3) and metadata (.info.json) from yt-dlp
transcripts/   compact timestamped text, one file per episode (<video_id>.txt)
extracted/     per-episode JSON produced by Claude (<video_id>.json)
data/          site data (episodes.json, entries.json), overrides.json, review.json
reports/       duplicates.md, written by merge.py for manual review
qa/            the QA tool (approve / reject extracted entries)
site/          the website (Vite, vanilla JS, Fuse.js)
```

Requirements: Python 3.9+, [yt-dlp](https://github.com/yt-dlp/yt-dlp), Node 20+, and the
`claude` CLI for extraction.

## Pipeline

```sh
./fetch_subs.sh                         # 1. captions + metadata (all episodes not downloaded yet)
./fetch_subs.sh YBIXXAipmZw JlgQIDxufh0 #    ...or only some episodes
python3 json3_to_text.py subs -o transcripts   # 2. captions -> timestamped text
./extract_all.sh                        # 3. Claude extracts entries (resumable)
python3 merge.py                        # 4. merge into data/*.json, print a summary
```

**Use the `en-orig` caption track.** Most episodes have auto-dubbed audio in other
languages. On those videos YouTube's plain `en` auto-caption track is a round-trip machine
translation, not what the hosts said. For example, "Sod's law" becomes "the law of
meanness", and Jess's book titles get garbled. `fetch_subs.sh` downloads `en-orig`, and
`json3_to_text.py` prefers it when both tracks exist.

Downloads sleep 60 s between caption files because YouTube rate-limits them (HTTP 429), so
the full catalogue (about 100 episodes) takes about two hours. Every step skips work that's
already done, so you can stop and re-run any of them.

### merge.py

Reads `subs/*.info.json` and `extracted/*.json` and writes:

- `data/episodes.json`: `[{ id, title, date, duration }]`, newest first
- `data/entries.json`: `[{ slug, term, original, translation, type, language, mentions: [{ episode_id, t, note, confidence, verified? }] }]`

Mentions are grouped by slug: the term lowercased, with invisible characters removed,
diacritics folded and spaces turned into hyphens (`Björk` → `bjork`). If mentions disagree
on a field, the majority wins. Nothing else is merged automatically. Likely duplicates
(plural/singular, spelling variants, "to kick the bucket" vs "kick the bucket", one entry's
term being another's original form) go to `reports/duplicates.md`, each with a ready-to-paste
override.

The summary also flags:

- low-confidence mentions not yet approved in QA
- timestamps that don't appear in the transcript (possibly invented)
- **new types** outside word/idiom/phrase/name. These are kept as they are, never remapped.
- episodes downloaded but not extracted yet
- overrides that no longer match anything

### Manual fixes: data/overrides.json

A list of operations, applied in order on every run:

```json
[
  {"op": "rename",    "slug": "fat-bread", "term": "Fettes Brot"},
  {"op": "merge",     "from": "hot-dogs", "into": "hot-dog"},
  {"op": "delete",    "slug": "between"},
  {"op": "delete",    "slug": "fish", "episode_id": "-54FiJ0PsXo"},
  {"op": "timestamp", "slug": "break-a-leg", "episode_id": "YBIXXAipmZw", "t": "00:01:40"},
  {"op": "set",       "slug": "blues", "fields": {"language": "English", "translation": null}},
  {"op": "distinct",  "slugs": ["latin", "latino"]},
  {"_comment": "objects or keys starting with _ are ignored"}
]
```

- `rename` rebuilds the slug from the new term, or uses `new_slug` if given. With
  `episode_id` it applies to one mention only, which lets you split an entry.
- `set` changes entry fields but keeps the slug.
- `distinct` only hides a pair from the duplicates report.

## QA tool

```sh
python3 qa/review.py        # opens http://localhost:8765
```

Shows one extracted entry at a time, next to the video (starting 3 s before the timestamp)
and the transcript around it. Controls:

- **A** approve, **R** reject, **S** skip, **U** undo, **C** add a comment
- filter by episode, or show only low-confidence and flagged entries

Decisions are saved at once to `data/review.json`, keyed by `<video_id>/<slug of the
extracted term>`. Only undecided entries are shown. On the next `merge.py` run, rejected
mentions are dropped and approved ones are marked `verified`. On the site, low-confidence
mentions show an "Unverified" label until they are approved.

## Website

```sh
cd site
npm install
npm run dev        # http://localhost:5173, reads ../data live
npm run build      # -> site/dist (data copied into dist/data, index.html copied to 404.html)
npm run preview
```

- Pages: home (search, filters, suggestions), `/entry/<slug>`, `/episode/<id>`,
  `/episodes`, `/about`.
- Search is client-side with Fuse.js over `term`, `original` and `translation`. It ignores
  accents and ranks exact and prefix matches first.
- Query and filters are kept in the URL, so searches can be shared and the back button works.
- YouTube players are thumbnails until clicked. They then load a `youtube-nocookie.com`
  embed at `t - 3` seconds.
- Fonts are self-hosted (Fraunces, Source Serif 4), so the site makes no requests to
  third-party font servers.

**GitHub Pages:** build with `BASE_PATH=/<repo-name>/ npm run build` for a project site.
`404.html` is a copy of the app, so deep links like `/entry/break-a-leg` work. The workflow
in `.github/workflows/pages.yml` does this on every push to `main`. Commit `data/*.json`,
because the pipeline runs locally.
