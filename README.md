# Wordhoard: a Words Unravelled word index (prototype)

An unofficial fan project: a searchable index of the words, expressions and named things
discussed on the *Words Unravelled* podcast (Rob Watts and Jess Zafarris), with a link to
the moment each one comes up. This prototype covers the **audience side** only. See
`docs/prototype_brief.md` for the background.

```
data/      the dataset: entries.json and episodes.json, edited by hand and read by the site as is
toolkit/   shared JS for the data: slugs, link markup, link resolution, search
ingest/    downloads episodes' captions and turns them into transcripts
site/      the website (Svelte 5, SvelteKit)
docs/      plans and briefs, kept for the record
```

`data/*.json` are the source of truth. There is no build step: the site reads them as they are,
so a fix made by hand shows up when the page is reloaded. New episodes will be added by an
extraction agent (issue #13); until then they can't be ingested. After editing the data by
hand, run `cd toolkit && npm run check` (see **Checks** below).

Requirements: Node 22.17+, and for `ingest/`: Python 3.9+ and
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
*Gift (German)* by its term.

Links may lead nowhere, by design: a target that is no entry is valid data, shown as plain text
(about 950 of 13,600 links, mostly to things without an entry, like `[[from?:tan galán]]`). So
deleting an entry leaves the links to it as they are. `check` warns about such a link only when
it is close to an entry (`link-unresolved-close`), not about every one; instead, the review tool
lists the links an edit orphans before it is applied (`sideEffects()`). Parsing and resolution live in `toolkit/src/model/links.js` and
`toolkit/src/query/links.js`.

## Toolkit

`toolkit/` holds the code that reads, checks and edits the data, shared by the site and, later,
the tools that edit it (the review tool on the dev site, and later the extraction agent's MCP server in issue #13). It is plain ES modules with no browser or Node globals, so the site
imports it directly (as `#toolkit/*`, a package import in `site/package.json`). Its one dependency is Fuse.js, for
search; run `npm install` in `toolkit/` before building the site.

```
toolkit/src/model/slugs.js       slugify, entrySlug, the A-to-Z filing form
toolkit/src/model/links.js       link types; parse, format and rewrite link markup
toolkit/src/model/schema.js      categories, roles, field order, entryName
toolkit/src/model/transcript.js  the times transcript lines start at
toolkit/src/query/links.js       linkIndex and resolveLink
toolkit/src/query/index.js       buildIndex and its lookups: entry, episode, episodeMentions,
                                 episodeCounts, noteParts (resolved links), backlinks, homographs
toolkit/src/query/search.js      search, as on the site
toolkit/src/query/plain.js       plainMentions: notes that name an entry without linking to it
toolkit/src/query/groups.js      groupBy, the grouping the indexes and checks share
toolkit/src/checks/              problems() and introduced(); codes.js lists every problem code;
                                 invariants.js: dataChanges and linkResolutions;
                                 effects.js: sideEffects, what an edit changes
toolkit/src/edit/                edits: episodes, mentions, entries, names (gloss, rename), merges;
                                 batch.js: applyEdits, a list of edits applied as one
toolkit/src/io/files.js          Node only: load and save the data files
toolkit/src/io/session.js        Node only: preview, apply and undo edits on the data files
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
tool can show what one change caused without the hundreds of known warnings. It counts keys, so
a second copy of a known problem (a second identical bad link in one note) is new.

`npm run check` prints every problem grouped by code and exits with 1 if there are errors.
Each line starts with its code in brackets, so `npm run check | grep '\[note-context\]'` lists
one kind. The
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
| `deleteEntry(data, slug)` | deletes an entry; links to it show as plain text, unless that leaves a link that needs a gloss or is ambiguous: then it is refused |
| `setGloss(data, slug, gloss)` | sets or (with null) removes the gloss, so the slug; links that named the entry get the gloss and keep their text (`[[see:meal]]s` → `[[see:meal (flour)]]s`) |
| `renameEntry(data, slug, term)` | changes the term, so the slug; links that named the entry name the new term |
| `mergeEntries(data, from, into, { keep })` | moves `from`'s mentions to `into` and deletes `from`; `into` keeps its fields; links that resolved to `from` name `into`. Where both have a mention in one episode, `keep` (`{ episode id: 'from' \| 'into' }`) says whose stays; a clash it doesn't settle is refused |

`setGloss` and `renameEntry` are refused (`link-taken`) if the new slug would take a link that
resolves to another entry by its original form, since a slug match comes first. Links that
resolved to nothing may start resolving to the renamed entry. Removing entries the same way
(`deleteMention`, `replaceEpisodeMentions`) is refused like `deleteEntry` when it would leave a
link in error.

A merge keeps the links to `from` even when none of its mentions survive, which deleting the
clashing mention first wouldn't: deleting an entry's last mention deletes the entry, and its
links then lead nowhere. To give the survivor fields of the other entry, run `setFields` first.

A mention item is `{ slug, t, role, note, confidence }`, or, for a new entry,
`{ entry: { term, gloss?, original, translation, language, category }, t, role, note,
confidence }`.

`io/files.js` loads the data files and saves them atomically: each file is written to a
temporary file (`data/*.tmp`, ignored by git) renamed over the old one, with the same
formatting, so a failed save leaves the old file whole and a save changes only the bytes of what
changed. Data without both `entries` and `episodes` lists is refused before anything is written.

`applyEdits(data, ops)` applies a list of edits, `[{ op, args }]` with `op` a name in `EDITS`
(`{ op: 'setFields', args: [slug, fields] }`), as one: if any refuses, none is applied.

`sideEffects(before, after)` (`checks/effects.js`) lists everything an edit changed, computed
from the two versions alone, so it can't drift from what the edits do:
- entries added, removed (with `into` when their mentions moved to one entry: a rename or a
  merge) and changed in their fields;
- mentions added, removed (with their notes), moved to another entry, and changed;
- notes whose link targets were rewritten;
- links whose resolution changed: orphaned, captured (an added entry, or a new original form, now
  matches a link that led nowhere) or sent to another entry, with `follows` for links that follow
  a rename or merge. Links are matched through moved mentions, so they are compared across
  renamed and merged owners;
- the problems, warnings included, that the edit introduced.

`editSession(dir)` (`io/session.js`, Node only) edits the data files: `preview(ops)` returns the
side effects without writing; `apply(ops, version)` saves, but only if the files are still the
version the preview saw; `undo()` restores the files before the last apply, while they are still
as it left them (up to 20 steps). Each call reads the files afresh, so edits made by hand or by
an agent in the meantime are never overwritten.

Every edit test runs the edit on frozen data and checks the invariants in `test/helpers.js`:
valid data stays valid, the order is kept, only the intended entries change (others may differ
in link targets only, where the edit renames), every link resolves to the same entry as before,
and a refused edit leaves the data as it was. Each edit also has a test of the side effects
`sideEffects()` reports for it. `test/checks/codes.test.js` and
`test/edit/refusals.test.js` fail if a problem or refusal code has no test.

Tests: `cd toolkit && npm install && npm test`.

## Website

```sh
cd toolkit && npm install && cd ../site
npm install
npm run dev        # http://localhost:5173, reads ../data live; debug mode and the review tool
npm run build      # -> site/dist (data copied into dist/data, 404.html is the app shell)
npm run preview
npm run check      # svelte-check
```

The site is a SvelteKit single-page app (`ssr = false`, adapter-static with a `404.html`
fallback). SvelteKit is configured in `vite.config.js`, which also serves and copies the data.
The data is fetched once when the app starts (`src/lib/db.js`); the layout shows the pages once
it has loaded.

```
site/src/app.html            the page shell
site/src/app.css             colours, fonts, base styles and the classes several pages share
site/src/routes/             pages: home (+page.svelte), entry/[slug], episode/[id], episodes,
                             about, review (dev only), [...path] (unknown paths) and +error; +layout.svelte is the
                             header, footer, loading state and the / shortcut
site/src/lib/components/     EntryItem, EntryList, EntryName, Note, CategoryTag, Mention, Player…
site/src/lib/db.js           loading, sorting and indexing the data (and reloading it after an edit); search
site/src/lib/debug.svelte.js the Debug switch (dev only)
site/src/lib/edit/           the review tool (dev only): edit forms, the merge and confirmation dialogs,
                             the /review list, and the flow every edit goes through (edits.svelte.js)
site/src/lib/entries.js      categories, display forms, role order, link titles
site/src/lib/format.js       numbers, plurals, times, dates
site/src/lib/paths.js        links under the base path
site/src/lib/youtube.js      YouTube URLs and the IFrame API loader
```

Each component's CSS is scoped to it. `src/lib` is imported as `#lib/*`.

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
- `npm run dev` adds a **Debug** switch to the header (on by default, remembered in the browser).
  It shows each mention's role (subject / aside / mention) as a small badge on result cards, entry
  pages and episode timelines, and the review tool below. Switched off, the site looks as
  visitors see it. `npm run build` has neither the switch nor anything it shows.
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

### Review tool

The data can be edited on the site itself, under `npm run dev` with Debug on. A build contains
none of it: the edit tools (`src/lib/edit/`) are loaded only behind `import.meta.env.DEV`, and
the endpoint that writes the data exists only in the dev server (`vite.config.js`).

- **Entry pages:** edit the term, gloss, original form, literal translation, language and
  category; merge the entry into another; delete it. A new term or gloss that is another entry's
  name offers a merge instead of the rename. Each mention can be edited (time, role, confidence,
  and the note as raw `[[type:target]]` markup with a live preview that marks links leading
  nowhere), moved to another entry, or deleted.
- **Episode pages,** where a new episode is reviewed while it plays: the same mention tools, with
  the time taken from the player, "Mark checked" (confidence high) for unverified mentions, and
  adding a mention to an existing or a new entry. The timeline follows each edit without reloading
  the page, so the player keeps playing.
- **Merging:** the dialog shows both entries' fields side by side; the survivor keeps its name and
  its fields, with blanks filled from the other by default, and each field can be chosen. In each
  episode where both entries have a mention, you choose whose mention stays.
- **`/review`** lists every problem `check` finds, one collapsible list per kind, 50 at a time:
  likely duplicates with a merge in either direction, and problems in notes with the mention's
  editor. It is checked again after every edit.

Every edit is a list of toolkit edits (`[{ op, args }]`) that the dev server previews first: a
dialog lists everything it changes, computed by `sideEffects()` (entries removed or renamed,
mentions moved or removed, notes rewritten, links that change where they lead, new warnings),
and nothing is written until it is applied. The server reads `data/` afresh for every request,
refuses to apply an edit if the files changed since its preview, and can undo the edits of the
session while the files are as it left them. Older changes are in git; commit `data/` as
usual. The dev server loads the toolkit for the endpoint once, so restart it after changing
toolkit code.

**GitHub Pages:** build with `BASE_PATH=/<repo-name>/ npm run build` for a project site.
`404.html` is the app shell, so deep links like `/entry/break-a-leg` work. The workflow
in `.github/workflows/pages.yml` does this on every push to `main`, from the committed
`data/*.json`.
