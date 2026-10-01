# Wordhoard: a Words Unravelled word index (prototype)

An unofficial fan project: a searchable index of the words, expressions and named things
discussed on the *Words Unravelled* podcast (Rob Watts and Jess Zafarris), with a link to
the moment each one comes up. This prototype covers the **audience side** only. See
`docs/prototype_brief.md` for the background.

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
./extract_all.sh m9AaobtBMtA            #    ...or only some episodes
python3 merge.py                        # 4. merge into data/*.json, print a summary
```

**Use the `en-orig` caption track.** Most episodes have auto-dubbed audio in other
languages. On those videos YouTube's plain `en` auto-caption track is a round-trip machine
translation, not what the hosts said. For example, "Sod's law" becomes "the law of
meanness", and Jess's book titles get garbled. `fetch_subs.sh` downloads `en-orig`, and
`json3_to_text.py` prefers it when both tracks exist.

`extract_all.sh` runs `claude -p` with `extract_prompt.md` on each transcript, 5 episodes at a
time (`-j N` to change that; every other argument is a video ID, even one starting with `-`). It
checks each output and writes `video_id` and `prompt_version` into it (the version is set at
the top of the script; increase it whenever the prompt changes). It skips episodes whose output
is valid JSON with the current `prompt_version`, so files made with an older prompt are
extracted again. If a `claude` call fails, e.g. at the usage limit, it starts no new episodes,
keeps the output of calls already running, and exits 1; re-run it after the reset. Ctrl-C stops
everything at once and discards unfinished output. `EXTRACT_DIR=<dir>` writes the output
somewhere other than `extracted/`.

Downloads sleep 60 s between caption files because YouTube rate-limits them (HTTP 429), so
the full catalogue (about 100 episodes) takes about two hours. Every step skips work that's
already done, so you can stop and re-run any of them.

### merge.py

Reads `subs/*.info.json` and `extracted/*.json` and writes:

- `data/episodes.json`: `[{ id, title, date, duration }]`, newest first
- `data/entries.json`: `[{ slug, term, original, translation, language, mentions: [...] }]`,
  where each mention is

  ```json
  {"episode_id": "m9AaobtBMtA", "t": 978, "role": "subject",
   "note": "A doublet of cartouche; …",
   "links": [{"type": "same-root", "uncertain": false, "target": "cartouche", "slug": "cartouche",
              "start": 13, "end": 22}],
   "confidence": "high", "verified": true}
  ```

Entries have no kind (word, expression, name...): that will come from a later tagging pass over
the merged entries.

**Role** belongs to the mention: `subject` (discussed for its own sake), `aside` (only to make a
point about another entry) or `mention` (the hosts only point to where it was discussed).

**Links.** Extracted notes mark connections as `[[type:target]]trail`, with types `from`, `gave`,
`same-root`, `equivalent`, `unrelated` and `see`, and `?` after the type for an uncertain relation
(`[[from?:shesep ankh]]`). Letters straight after `]]` are part of the link text:
`[[see:ounce]]s` reads "ounces". In `entries.json` the note is plain text, with each link
replaced by its text; `links` lists the links in order, with `start` and `end` giving the
position of the link text in the note, in UTF-16 code units (how JavaScript indexes strings),
so the site never parses notes. `slug` is the entry the target resolves to after overrides (an
entry in the same episode first, then any entry by term, then by original form), or `null` if
it isn't an entry.

Mentions are grouped by slug: the term lowercased, with invisible characters removed,
diacritics folded and spaces turned into hyphens (`Björk` → `bjork`). If mentions disagree
on a field, the majority wins. Nothing else is merged automatically. Likely duplicates
(plural/singular, spelling variants, "to kick the bucket" vs "kick the bucket", one expression
contained in another, one entry's term being another's original form) go to
`reports/duplicates.md`, each with a ready-to-paste override, along with mentions that disagree
on language.

The summary shows how many files there are at each `prompt_version`, and counts of roles and
links. It also flags:

- low-confidence mentions not yet approved in QA
- timestamps that don't appear in the transcript (possibly invented)
- missing roles, and roles other than subject/aside/mention
- malformed links in notes (`[[x]]`, `[[x|y]]`) and unknown link types
- the same entry twice in one episode (the mention with the highest role is kept)
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
npm run dev        # http://localhost:5173, reads ../data live, shows debug details
npm run build      # -> site/dist (data copied into dist/data, index.html copied to 404.html)
npm run preview
```

- Pages: home (search, language filter, suggestions), `/entry/<slug>`, `/episode/<id>`,
  `/episodes`, `/about`.
- `npm run dev` also shows debug details: each mention's role (subject / aside / mention) as a
  small badge on result cards, entry pages and episode timelines. `npm run build` leaves them out.
- Search is client-side with Fuse.js over `term`, `original` and `translation`. It ignores
  accents and ranks exact and prefix matches first; within each of those tiers, entries that are
  only ever pointed to (role `mention`) come last.
- Entry pages list the episodes that discuss the entry (`subject`, then `aside`), and put
  episodes that only point to it under "Also mentioned in".
- Query and filters are kept in the URL, so searches can be shared and the back button works.
- YouTube players are thumbnails until clicked. They then load a `youtube-nocookie.com`
  embed at `t - 3` seconds.
- Fonts are self-hosted (Fraunces, Source Serif 4), so the site makes no requests to
  third-party font servers.

**GitHub Pages:** build with `BASE_PATH=/<repo-name>/ npm run build` for a project site.
`404.html` is a copy of the app, so deep links like `/entry/break-a-leg` work. The workflow
in `.github/workflows/pages.yml` does this on every push to `main`. Commit `data/*.json`,
because the pipeline runs locally.
