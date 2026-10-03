# Wordhoard: a Words Unravelled word index (prototype)

An unofficial fan project: a searchable index of the words, expressions and named things
discussed on the *Words Unravelled* podcast (Rob Watts and Jess Zafarris), with a link to
the moment each one comes up. This prototype covers the **audience side** only. See
`docs/prototype_brief.md` for the background.

```
data/      the dataset the site shows, the manual edits to it, and build.py, which builds it
ingest/    produces entries from YouTube episodes with Claude: one way to feed data/
review/    a tool to approve or reject entries next to the video
site/      the website (Vite, vanilla JS, Fuse.js)
docs/      plans and briefs, kept for the record
```

How they fit together:

```
ingest/3-entries/<video_id>.json ─┐
data/overrides.json (by hand) ────┼─> data/build.py ─> data/entries.json, episodes.json ─> site/
data/review.json (review/) ───────┘                    data/duplicates.md (to check by hand)
```

Requirements: Python 3.9+, Node 20+, and for `ingest/`: [yt-dlp](https://github.com/yt-dlp/yt-dlp)
and the `claude` CLI.

```sh
ingest/1-download.sh          # see ingest/README.md for the steps
ingest/2-make-transcripts.py
ingest/3-extract.sh
python3 data/build.py         # build data/*.json, print a summary
cd site && npm run dev        # http://localhost:5173
```

## Data

`data/build.py` reads the entry files in `ingest/3-entries/` (`--entries <dir>` for another
folder), `data/overrides.json` and `data/review.json`, and writes:

- `data/episodes.json`: `[{ id, title, date, duration }]`, newest first
- `data/entries.json`: `[{ slug, term, gloss?, original, translation, language, mentions: [...] }]`,
  where each mention is

  ```json
  {"episode_id": "m9AaobtBMtA", "t": 978, "role": "subject",
   "note": "A doublet of cartouche; …",
   "links": [{"type": "same-root", "uncertain": false, "target": "cartouche", "slug": "cartouche",
              "start": 13, "end": 22}],
   "confidence": "high", "verified": true}
  ```
- `data/duplicates.md`: likely duplicates, for manual review

**Entry files** are the boundary between whatever produces entries and the dataset. One file per
episode, `<video_id>.json`:

```json
{"video_id": "m9AaobtBMtA", "prompt_version": 4,
 "title": "Ancient writing systems and how they work", "date": "2026-09-30", "duration": 2623,
 "entries": [{"term": "cartridge", "original": null, "translation": null, "language": "English",
              "timestamp": "00:16:18", "role": "subject",
              "note": "A doublet of [[same-root:cartouche]]; …", "confidence": "high"}]}
```

Entries have no kind (word, expression, name...): that will come from a later tagging pass over
the built entries.

**Gloss** tells apart different words with the same spelling. It is absent or `null` unless
another word has the same spelling, and is a short label like a Wikipedia disambiguation
suffix: a language for a false friend (*Gift (German)*), a meaning for a homonym
(*meal (flour)*, *school (fish)*), or a kind for a name (*Phoenix (city)*). Usually one word per
spelling (typically the common English one) has no gloss. In `entries.json`, `gloss` is only
present on entries that have one.

**Role** belongs to the mention: `subject` (discussed for its own sake), `aside` (only to make a
point about another entry) or `mention` (the hosts only point to where it was discussed).

**Links.** Notes in entry files mark connections as `[[type:target]]trail`, with types `from`,
`gave`, `same-root`, `equivalent`, `unrelated` and `see`, and `?` after the type for an uncertain
relation (`[[from?:shesep ankh]]`). Letters straight after `]]` are part of the link text:
`[[see:ounce]]s` reads "ounces". A link to a glossed entry gives the gloss in brackets,
`[[same-root:meal (flour)]]`, and reads "meal". In `entries.json` the note is plain text, with
each link replaced by its text; `links` lists the links in order, with `start` and `end` giving
the position of the link text in the note, in UTF-16 code units (how JavaScript indexes
strings), so the site never parses notes. `slug` is the entry the target resolves to after
overrides, or `null` if it isn't an entry: a target with a gloss resolves to the entry with that
slug; any other target to an entry in the same episode first, then any entry by term, then by
original form. A link never resolves to the entry its note belongs to.

Mentions are grouped by slug: the term, followed by the gloss if there is one, lowercased, with
invisible characters removed, diacritics folded and spaces turned into hyphens (`Björk` →
`bjork`, *Gift (German)* → `gift-german`). If mentions disagree on a field, the majority wins.
Nothing else is merged automatically. Likely duplicates (plural/singular, spelling variants,
"to kick the bucket" vs "kick the bucket", one expression contained in another, one entry's
term being another's original form; never two entries with the same term and different
glosses) go to `data/duplicates.md`, each with a ready-to-paste override, along with mentions
that disagree on language.

The summary shows how many files there are at each `prompt_version`, and counts of roles and
links. It also flags:

- low-confidence mentions not yet approved in the review tool
- timestamps after the end of the video
- missing roles, and roles other than subject/aside/mention
- malformed links in notes (`[[x]]`, `[[x|y]]`, `[[see: ]]`) and unknown link types
- the same entry twice in one episode, including after overrides (the mention with the highest
  role is kept); for two different words with one spelling, a gloss is missing
- links that reach a glossed entry without naming its gloss (they may point at the wrong
  homograph), and links whose gloss names no entry
- episodes without a title (the video ID is used) or a date (listed last)
- overrides that no longer match anything

Timestamps that aren't in the transcript are reported by `ingest/3-extract.sh` and flagged in
the review tool, which both have the transcript.

Tests: `python3 -m unittest discover data/test`.

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

- `rename` rebuilds the slug from the new term and the mention's gloss, or uses `new_slug` if
  given. With `episode_id` it applies to one mention only, which lets you split an entry.
- `set` changes entry fields but keeps the slug.
- `distinct` only hides a pair from the duplicates report.

## Review tool

```sh
python3 review/review.py        # opens http://localhost:8765
```

Shows one entry from `ingest/3-entries/` at a time, next to the video (starting 3 s before the
timestamp) and the transcript around it, with the same checks as `data/build.py` plus
timestamps missing from the transcript. Controls:

- **A** approve, **R** reject, **S** skip, **U** undo, **C** add a comment
- filter by episode or role, or show only low-confidence and flagged entries

Decisions are saved at once to `data/review.json`, keyed by `<video_id>/<slug of the
extracted term and gloss>`. Only undecided entries are shown. On the next `data/build.py` run, rejected
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
