# Wordhoard: a Words Unravelled word index (prototype)

An unofficial fan project: a searchable index of the words, expressions and named things
discussed on the *Words Unravelled* podcast (Rob Watts and Jess Zafarris), with a link to
the moment each one comes up. This prototype covers the **audience side** only. See
`docs/prototype_brief.md` for the background.

```
data/      the dataset: entries.json and episodes.json, edited by hand and read by the site as is
toolkit/   shared JS for the data: slugs, link markup, link resolution, search
ingest/    downloads episodes' captions and turns them into transcripts
site/      the website (Vite, vanilla JS, Fuse.js)
docs/      plans and briefs, kept for the record
```

`data/*.json` are the source of truth. There is no build step: the site reads them as they are,
so a fix made by hand shows up when the page is reloaded. New episodes will be added by an
extraction agent (issue #13); until then they can't be ingested. After editing the data by
hand, run `cd toolkit && npm run check` (see **Checks** below).

Requirements: Node 20+, and for `ingest/`: Python 3.9+ and
[yt-dlp](https://github.com/yt-dlp/yt-dlp).

```sh
cd site && npm run dev        # http://localhost:5173
cd toolkit && npm run check   # problems in data/: errors and warnings
cd toolkit && npm test        # the toolkit's tests, including a check that data/ has no errors
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

`toolkit/` holds the code that reads, checks and edits the data, shared by the site and, later,
the tools that edit it (the extraction agent's MCP server in issue #13, and a review tool). It is plain ES modules with no browser or Node globals, so the site
imports it directly (Vite's `server.fs.allow` includes it). Its one dependency is Fuse.js, for
search; run `npm install` in `toolkit/` before building the site.

```
toolkit/src/model/slugs.js       slugify, entrySlug, the A-to-Z filing form
toolkit/src/model/links.js       link types; parse, format and rewrite link markup
toolkit/src/model/schema.js      categories, roles, field order, entryName
toolkit/src/model/transcript.js  the times transcript lines start at
toolkit/src/query/links.js       linkIndex and resolveLink
toolkit/src/query/index.js       buildIndex and its lookups: entry, episode, episodeMentions,
                                 noteParts (resolved links), backlinks, homographs
toolkit/src/query/search.js      search, as on the site
toolkit/src/query/plain.js       plainMentions: notes that name an entry without linking to it
toolkit/src/query/entries.js     episodeCounts
toolkit/src/checks/              problems() and introduced(); codes.js lists every problem code;
                                 invariants.js: dataChanges and linkResolutions
toolkit/src/edit/                edits: episodes, mentions, entries, names (gloss, rename), merges
toolkit/src/io/files.js          Node only: load and save the data files
toolkit/cli/check.js             npm run check
toolkit/test/                    node --test, mirroring src/; fixtures/data.js is a small dataset,
                                 helpers.js the invariants every edit test checks
```

Everything but `io/` and `cli/` is pure: plain data in, plain data out. Data is always
`{ entries, episodes }`, shaped like the files.

### Checks

`problems(data, { warnings, transcripts })` returns every problem in the data as
`{ level, code, message, slugs, mention?, episode?, detail? }`. `checks/codes.js` lists each
code with its level and meaning.

- **Errors** make the data invalid:
  - fields of the wrong type, and unknown categories, roles and confidences;
  - an entry without mentions, two mentions of one entry in one episode, a mention of an
    unknown episode or after its end;
  - a slug that isn't the slug of its term and gloss, or that two entries share;
  - malformed links, unknown link types, a target that several original forms match, and an
    unglossed target when only glossed entries have that term.

  Given transcripts (`{ episode id: text }`), it also reports timestamps that start no
  transcript line. `check` doesn't pass them, since hand-corrected timestamps needn't match a
  line.
- **Warnings** are only reported:
  - likely duplicates (article or "to", spacing or hyphen variants, plurals, spelling variants,
    an expression inside another, a term that is another entry's original form);
  - link targets that resolve to nothing but are close to an entry, a link to its own entry
    included;
  - notes that start as if next to other entries ("Another…", "Also…", "One of the…", "The
    same…").

  Duplicate detection compares every pair of entries, so `warnings: false` skips the warnings
  when only errors matter.

A problem's identity is its code, slugs, mention, episode and detail, not its wording.
`introduced(before, after)` returns the problems of `after` that `before` doesn't have, so a
tool can show what one change caused without the hundreds of known warnings.

`npm run check` prints every problem grouped by code and exits with 1 if there are errors. The
Pages workflow runs it before building, so a deploy fails on data with errors.

### Edits

Each edit takes data and returns new data, keeping the files' order (entries by slug, mentions
by episode date and time, episodes newest first) and key order, and reusing the objects it
doesn't change. It never changes its input. If it can't be applied (an unknown slug, episode or
mention, or a field it doesn't set), or if its result has errors the input didn't
(`introduced()`), it throws a `ToolkitError` whose `problems` say why. Edits never run the
warnings.

| edit | does |
|---|---|
| `addEpisode(data, episode)` | adds `{ id, title, date, duration }` |
| `replaceEpisodeMentions(data, id, items)` | replaces all of an episode's mentions; creates the entries the items declare, removes entries left without mentions |
| `addMention(data, id, item)` | adds one mention, to an existing or a new entry |
| `editMention(data, slug, id, fields)` | sets a mention's `t`, `role`, `note` or `confidence` |
| `deleteMention(data, slug, id)` | deletes a mention, and the entry if it has no others |
| `setFields(data, slug, fields)` | sets `original`, `translation`, `language` or `category` |
| `deleteEntry(data, slug)` | deletes an entry; links to it show as plain text |
| `setGloss(data, slug, gloss)` | sets or (with null) removes the gloss, so the slug; links that named the entry get the gloss and keep their text (`[[see:meal]]s` → `[[see:meal (flour)]]s`) |
| `renameEntry(data, slug, term)` | changes the term, so the slug; links that named the entry name the new term |
| `mergeEntries(data, from, into)` | moves `from`'s mentions to `into` and deletes `from`; links that resolved to `from` name `into`. Refused if both have a mention in one episode |

A mention item is `{ slug, t, role, note, confidence }`, or, for a new entry,
`{ entry: { term, gloss?, original, translation, language, category }, t, role, note,
confidence }`.

`io/files.js` loads the data files and saves them atomically: each file is written to a
temporary file renamed over the old one, with the same formatting, so a failed save leaves the
old file whole and a save changes only the bytes of what changed.

Every edit test runs the edit on frozen data and checks the invariants in `test/helpers.js`:
valid data stays valid, the order is kept, only the intended entries change (others may differ
in link targets only, where the edit renames), every link resolves to the same entry as before,
and a refused edit leaves the data as it was. `test/checks/codes.test.js` and
`test/edit/refusals.test.js` fail if a problem or refusal code has no test.

Tests: `cd toolkit && npm install && npm test`.

## Website

```sh
cd toolkit && npm install && cd ../site
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
