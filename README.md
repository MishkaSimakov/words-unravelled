# Wordhoard: a Words Unravelled word index (prototype)

An unofficial fan project: a searchable index of the words, expressions and named things
discussed on the *Words Unravelled* podcast (Rob Watts and Jess Zafarris), with a link to
the moment each one comes up. This prototype covers the **audience side** only. See
`docs/prototype_brief.md` for the background.

```
data/      the dataset: entries.json and episodes.json, edited by hand and read by the site as is
toolkit/   shared JS for reading the data: slugs, link markup, link resolution
ingest/    downloads episodes' captions and turns them into transcripts
site/      the website (Vite, vanilla JS, Fuse.js)
docs/      plans and briefs, kept for the record
```

`data/*.json` are the source of truth. There is no build step: the site reads them as they are,
so a fix made by hand shows up when the page is reloaded. New episodes will be added by an
extraction agent (issue #13); until then they can't be ingested. Nothing checks the data for
duplicates or broken links yet (issue #12).

Requirements: Node 20+, and for `ingest/`: Python 3.9+ and
[yt-dlp](https://github.com/yt-dlp/yt-dlp).

```sh
cd site && npm run dev        # http://localhost:5173
cd toolkit && npm test        # the toolkit's tests, including checks on data/entries.json
```

## Data

- `data/episodes.json`: `[{ id, title, date, duration }]`, newest first
- `data/entries.json`: `[{ slug, term, gloss?, original, translation, language, category,
  mentions: [...] }]`, where each mention is

  ```json
  {"episode_id": "m9AaobtBMtA", "t": 978, "role": "subject",
   "note": "The loop around royal names in hieroglyphs; a doublet of [[same-root:cartridge]], …",
   "confidence": "high"}
  ```

Both files are JSON with one-space indentation (`indent=1`). Keep that formatting when editing
them, so that git diffs show only what changed.

**Slug.** The entry's term, followed by the gloss if there is one, lowercased, with invisible
characters removed, diacritics folded, apostrophes dropped and anything else that isn't a letter
or digit turned into hyphens (`Björk` → `bjork`, *Gift (German)* → `gift-german`). It must stay
equal to the slug of the term and gloss (`entrySlug()` in `toolkit/src/model/slugs.js`), so
renaming an entry or adding a gloss changes its slug, and links that name it.

**Gloss** tells apart different words with the same spelling. It is absent unless another word
has the same spelling, and is a short label like a Wikipedia disambiguation suffix: a language
for a false friend (*Gift (German)*), a meaning for a homonym (*meal (flour)*, *school (fish)*),
or a kind for a name (*Phoenix (city)*). Usually one word per spelling (typically the common
English one) has no gloss.

**Category** says what kind of thing an entry is: `word`, `name`, `expression`,
`about-language` (terms for describing language, and names of languages and scripts) or
`word-part` (*-chester*, *aber*, letters). The rules are in `ingest/3-extract-prompt.md`.

**Role** belongs to the mention: `subject` (discussed for its own sake), `aside` (only to make a
point about another entry) or `mention` (the hosts only point to where it was discussed).
**Confidence** is `high` or `low`; the site marks low-confidence mentions "Unverified", so set
it to `high` once a mention has been checked against the video.

**Links.** Notes mark connections as `[[type:target]]trail`, with types `from`, `gave`,
`same-root`, `equivalent`, `unrelated` and `see`, and `?` after the type for an uncertain
relation (`[[from?:shesep ankh]]`). Letters straight after `]]` are part of the link text:
`[[see:ounce]]s` reads "ounces". A link to a glossed entry gives the gloss in brackets,
`[[same-root:meal (flour)]]`, and reads "meal". The site resolves a target to:

1. the entry whose slug is the target's slug (term, plus gloss if given), unless that is the
   entry the note belongs to;
2. else the one other entry whose `original` has the target's slug;
3. else nothing: the link text is shown as plain text (a link to something that isn't an
   entry, or a target that several original forms match).

So a target without a gloss means the word without one: `[[see:gift]]` never reaches
*Gift (German)* by its term. Parsing and resolution live in `toolkit/src/model/links.js` and
`toolkit/src/query/links.js`.

## Toolkit

`toolkit/` holds the code that reads the data, shared by the site and, later, the tools that
edit it (issues #12 and #13). It is plain ES modules with no dependencies and no browser or
Node globals, so the site imports it directly (Vite's `server.fs.allow` includes it).

```
toolkit/src/model/slugs.js   slugify, entrySlug, the A-to-Z filing form
toolkit/src/model/links.js   link types and parseNote
toolkit/src/query/links.js   linkIndex and resolveLink
toolkit/test/                node --test; data.test.js checks the real data/entries.json
```

Tests: `cd toolkit && npm test`.

## Website

```sh
cd site
npm install
npm run dev        # http://localhost:5173, reads ../data live, shows debug details
npm run build      # -> site/dist (data copied into dist/data, index.html copied to 404.html)
npm run preview
```

- Pages: home (search, category chips, language filter, suggestions), `/entry/<slug>`,
  `/episode/<id>`, `/episodes`, `/about`.
- Categories: chips under the search box filter by category (`?cat=name`), and each chip counts
  the entries the current search and language filter leave. On narrow screens the chips scroll
  sideways. Result cards, entry pages and episode timelines show each entry's category in
  lowercase italics beside its language; on the entry page it links to that category.
- Browsing lists entries A to Z under letter headings. An entry files under its term with accents
  folded, letters like *æ* and *þ* spelt out (*ae*, *th*) and leading punctuation ignored, so
  *-ness* sits next to *ness* and *ælf* under A; digits and other scripts come first, under #.
  The entry page's previous and next links follow the same order.
- `npm run dev` also shows debug details: each mention's role (subject / aside / mention) as a
  small badge on result cards, entry pages and episode timelines. `npm run build` leaves them out.
- Search is client-side with Fuse.js over `term`, `gloss`, `original` and `translation`. It
  ignores accents and ranks exact and prefix matches first; within each of those tiers, entries
  that are only ever pointed to (role `mention`) come last.
- A glossed entry is shown as its term with the gloss muted after it, *meal (flour)*, wherever
  its name appears; note links show only the term, with the full name in the tooltip.
- Notes are parsed when the data loads, and each link is resolved with the toolkit (see
  **Links** above). An entry page lists the entries whose notes link to it under "Linked from".
- Entry pages list the episodes that discuss the entry (`subject`, then `aside`), and put
  episodes that only point to it under "Also mentioned in".
- Query and filters are kept in the URL, so searches can be shared and the back button works.
- YouTube players are thumbnails until clicked. They then load a `youtube-nocookie.com`
  embed at `t - 3` seconds.
- Fonts are self-hosted (Fraunces, Source Serif 4), so the site makes no requests to
  third-party font servers.

**GitHub Pages:** build with `BASE_PATH=/<repo-name>/ npm run build` for a project site.
`404.html` is a copy of the app, so deep links like `/entry/break-a-leg` work. The workflow
in `.github/workflows/pages.yml` does this on every push to `main`, from the committed
`data/*.json`.
