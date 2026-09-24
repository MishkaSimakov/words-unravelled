# Words Unravelled Word Index: prototype brief

## Background

Words Unravelled is a YouTube and audio podcast about etymology, hosted by Rob Watts
(YouTube channel "RobWords") and Jess Zafarris. Episodes are themed (art, music, Spanish
loanwords, idioms around the world, false friends...) and each covers dozens of words,
idioms and names. The back catalogue is large and some words recur across episodes, but
there is no public way to search which episode covered what.

The long-term idea is a website with two sides:

1. **Hosts' side**: a tool for Rob and Jess to create entries, add descriptions, sources,
   notes and categories, and attach entries to episodes.
2. **Audience side**: when an episode is released, its entries become public, and viewers
   can search and browse them.

Possible later extensions: entry ratings, comments or discussions, and word proposals from
the audience (possibly collected automatically from YouTube comments).

## Goal of this prototype

A small, convincing demo of the **audience side only**, built from public data, to show
the hosts when proposing the full project. It will be an **unofficial fan project**.

The hosts' side is deliberately out of scope: it depends on their internal workflow,
which we don't know yet.

## Scope

In scope:
- A data pipeline that extracts discussed entries (words, idioms, phrases, names) from
  YouTube auto-captions, with a timestamp for each mention.
- A static website to search and explore those entries.

Out of scope for now:
- The hosts' side (editing interface, authentication).
- Ratings, comments, proposals, user accounts.
- Any backend server or database.
- Publishing transcripts or long summaries of the episodes. The site stores only the entry,
  a one-line note, and a timestamp link, so it sends people to the videos rather than
  replacing them.

## Data pipeline

### Directory layout

```
subs/          raw captions (.json3) and metadata (.info.json) from yt-dlp
transcripts/   compact timestamped text, one file per episode (<video_id>.txt)
extracted/     per-episode JSON produced by Claude (<video_id>.json)
data/          merged data used by the website, plus manual overrides
site/          the website
```

### Step 1: download captions and metadata (exists, run manually)

```
yt-dlp --write-auto-subs --sub-langs en --sub-format json3 --write-info-json \
  --skip-download --sleep-requests 5 --sleep-subtitles 60 -o "subs/%(title)s [%(id)s].%(ext)s" URL
```

YouTube rate-limits caption downloads (HTTP 429); the sleep options are required.
The `.info.json` files provide episode title, upload date and duration.
The episode list can be obtained from the channel with `--flat-playlist`. Shorts and
non-episode videos should be excluded.

### Step 2: convert captions to text (exists: `json3_to_text.py`)

Produces lines like:

```
[00:00:05] >> And what can you find under the Hungarian frog's ass?
```

`>>` marks a speaker change; a new line starts on every speaker change or after 8 seconds.
Removes `[music]`-style tags and zero-width characters (U+200B etc.).

### Step 3: extract entries (exists: `extract_prompt.md` + `extract_all.sh`)

`extract_all.sh` runs `claude -p` once per transcript with the prompt in
`extract_prompt.md`, validates the JSON output and skips already processed episodes, so it
can be re-run after hitting usage limits. Output per episode:

```json
{
  "video_id": "YBIXXAipmZw",
  "entries": [
    {
      "term": "break a leg",
      "original": null,
      "translation": null,
      "type": "idiom",
      "language": "English",
      "timestamp": "00:01:28",
      "note": "One-sentence summary of what the hosts say.",
      "confidence": "high"
    }
  ]
}
```

`type` is one of `word`, `idiom`, `phrase`, `name`. Notes must only reflect what the hosts
say, never outside etymology knowledge. The prompt tells the model to ignore the cold-open
teaser and use the timestamp of the real discussion. If you ever discover a new category, state that explicitly in your report, do not silently misattribute.

### Step 4: merge (to build)

A script that reads `subs/*.info.json` and `extracted/*.json` and writes the site data:

- `data/episodes.json`: `[{ id (video_id), title, date, duration }]`
- `data/entries.json`: `[{ slug, term, original, translation, type, language, mentions: [{ episode_id, t, note, confidence }] }]`
  where `t` is the mention time in seconds.

Requirements:
- Build slugs from normalized terms: lowercase, invisible characters removed, diacritics
  folded, spaces to hyphens. Mentions of the same entry across episodes are grouped under
  one slug.
- Don't merge aggressively. Write a report of likely duplicates (plural/singular, spelling
  variants, same term in different languages) for manual review instead.
- Apply manual fixes from `data/overrides.json` (rename, merge two slugs, delete an entry,
  fix a timestamp), so corrections survive re-running the pipeline.
- Print a summary: episodes, entries, low-confidence entries to review.

### Quality check before running the whole catalogue

Run the pipeline on 3 episodes first and check the results against the videos: missed
entries, junk entries, wrong timestamps. Adjust the prompt before processing everything.

## Website

A static site that loads `episodes.json` and `entries.json`. The dataset is small (at most a
few thousand entries), so all search happens client-side (for example with Fuse.js). It
should be free to host (GitHub Pages). Keep the stack
simple; a static site generator or a small Vite app are both fine.

### Pages

**Home**
- Search bar at the top, with fuzzy search over `term`, `original` and `translation`.
- Below it, a list of suggestions for exploration when the search is empty: entries
  that appear in several episodes, entries from the latest episode, a random selection
  that changes on reload.
- Filters by language and type.
- Typing filters the list live; clicking an item opens its entry page.

**Entry page** (`/entry/<slug>`)
- Term, original form, literal translation, type, language.
- All mentions, each with episode title, date and note.
- For each mention, a YouTube player starting a few seconds before the timestamp
  (`t - 3` seconds). Load players lazily: show a thumbnail and load the iframe on click.

**Episode page** (`/episode/<id>`)
- Episode title, date, link to YouTube, and its entries in timestamp order.

**About page**
- States clearly that this is an unofficial fan project, not affiliated with RobWords or
  Words Unravelled, and links to their channels.

### Quality Assurance

Implement a separate tool that would allow to go through extracted terms and verify each of them manually. A term can be made approved or rejected. Store results in a separate file and show only unprocessed terms.

### Design notes
- No official logos or branding.
- Responsive; works well on mobile.
- Show entry counts on the home page (for example, "1,234 entries from 87 episodes").
- Word nerdy thematic.