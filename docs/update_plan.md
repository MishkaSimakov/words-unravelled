> **Status: mostly implemented; kept for the record.** Steps 1–6 were done on the branch
> `extraction-v2`, but the design changed after the pilot. The final prompt is version 4 and
> has no `type` field: kinds of entries will come from a later tagging pass. Notes link what
> they name, including things that aren't entries. `extract_all.sh` runs 5 episodes at a time
> and writes `video_id` and `prompt_version` itself. Step 7, the full run over all episodes,
> has **not** been done yet. "Later: Wiktionary integration" is **not** implemented; it is
> kept as notes for later. `README.md` describes the current behaviour.
>
> The project has since been reorganised; paths here are the old ones: `merge.py` is now
> `data/build.py`, `reports/duplicates.md` is `data/duplicates.md`, `qa/` is `review/`, and the
> extraction pipeline is in `ingest/` (`subs/` → `1-youtube/`, `json3_to_text.py` →
> `2-make-transcripts.py`, `transcripts/` → `2-transcripts/`, `extract_all.sh` and
> `extract_prompt.md` → `3-extract.sh` and `3-extract-prompt.md`, `extracted/` → `3-entries/`).

# Plan: extraction v2

This plan and `extract_prompt_v2.md` contain everything you need.

## Background

The project indexes the words discussed on the *Words Unravelled* podcast. Read `README.md`
for the pipeline:
- `extract_all.sh` runs `claude -p` with `extract_prompt.md` on each `transcripts/*.txt`
  and writes `extracted/<video_id>.json`;
- `merge.py` merges these into `data/entries.json` and `data/episodes.json`;
- the site in `site/` and the QA tool in `qa/review.py` read those files.

About 100 transcripts exist; 14 have been extracted with the current prompt. We are about
to re-extract all of them with a new prompt. Re-running Claude over every transcript is
slow (4–8 min per episode) and uses a lot of the usage limit, so the new format has to be
settled and the tools ready **before** the full run.

## What's already decided and tested

The new prompt is finished: **`extract_prompt_v2.md`**. It went through four rounds of
testing on four episodes. Treat its rules as settled. Don't edit it, unless the pilot
(step 6) shows a problem the prompt causes, and then only with the user's agreement.

Changes compared with the current format, with the reason for each:

1. **Types:** `word`, `expression`, `name` and `topic` replace `word`, `idiom`, `phrase`
   and `name`.
   - **Why:** the old types were never defined, so the model chose them arbitrarily.
     *couch potato* was an idiom while *pet peeve* was a phrase, and *Sunday* was a name.
     `idiom` and `phrase` overlapped completely.
   - **Why `topic`:** named things the hosts discuss without explaining the name (Linear
     B, the Phaistos Disc, the Voynich Manuscript) weren't extracted at all.
   - The prompt contains the algorithm for choosing the type.
2. **Role** of each mention: `subject`, `aside` or `mention`.
   - It belongs to the mention (one entry in one episode), not to the entry.
   - **Why:** it lets the site show the episodes where an entry is really discussed
     first, and push passing references down.
   - Definitions:
     - `subject`: discussed for its own sake;
     - `aside`: said only to make a point about another entry;
     - `mention`: the hosts only point to where it was discussed.
3. **Typed links in notes:** `[[type:target]]trail`.
   - **Why:** untyped links made the graph connect *dessert* to *desert* even when the
     note says they're unrelated.
   - Types: `from`, `gave`, `same-root`, `equivalent`, `unrelated`, `see`.
   - A `?` suffix marks an uncertain relation: `[[from?:shesep ankh]]`.
   - Letters straight after `]]` belong to the link text, as on Wikipedia:
     `[[see:ounce]]s` reads "ounces" and links to *ounce*.
   - There is no `|text` alias any more, because it could hide the real target.
   - The target is an entry's `term` or, for a foreign entry, its `original`.
4. **`language`:** the language the term is used in, not the one it came from. The old
   prompt labelled the river *Avon* Celtic and *krill* Norwegian. `null` for topics.
5. **`prompt_version: 2`** at the top of each output file, so it's clear which files
   predate a prompt change.
6. **Removed:**
   - the proposals file: `claude -p` can't write files, and it once appended prose after
     the JSON, which broke `extracted/3bvK3bz_AlY.json.tmp`;
   - the `end` timestamp: it was considered and dropped.

New per-episode output:

```json
{
  "video_id": "m9AaobtBMtA",
  "prompt_version": 2,
  "entries": [
    {
      "term": "cartridge",
      "original": null,
      "translation": null,
      "type": "word",
      "language": "English",
      "timestamp": "00:16:18",
      "role": "subject",
      "note": "A doublet of [[same-root:cartouche]]; the French word became cartage and then cartridge, with an unetymological R.",
      "confidence": "high"
    }
  ]
}
```

**Known limits (accept them; don't try to fix them in the prompt):**
- **Run-to-run variation.** Two runs of the same episode agree on about 85% of entries:
  - half of the difference is wording (*tasseled*/*tasselled*);
  - the rest is borderline entries, and now and then a real one goes missing.
- **Fields on shared entries:** role differs on 3–6%, type on about 1%. Timestamps
  occasionally differ by one caption line.
- **Invented originals.** The model sometimes supplies an `original` the hosts only said
  in English. These are marked `confidence: "low"`, so QA sees them.
- **Growth.** Compared with the current output there are about 65% more entries and
  about 1.7× the output size.

## Steps

Work on a branch (e.g. `extraction-v2`) and commit each step separately. Old-format files
must keep working until the full run is done, because `extracted/` will be partly old and
partly new during the run.

### 1. Prompt

`git mv extract_prompt_v2.md extract_prompt.md` (overwriting the old prompt).

### 2. `extract_all.sh`

- **Stop the loop when `claude` exits non-zero.** At the usage limit it exits with 1 and
  prints "You've hit your session limit" to stdout. Today the script would treat that as
  invalid JSON and fail every remaining episode the same way. Delete the `.tmp` file and
  tell the user to re-run after the reset.
- **Skip only valid files with the current version.** A file counts as done only if it is
  valid JSON *and* has `prompt_version` equal to the current version (keep that in a
  variable at the top of the script). A partial re-run must not skip old-format files.

### 3. `merge.py`

**Types**
- `KNOWN_TYPES = ("word", "expression", "name", "topic")`. `qa/review.py` imports it.
- Also accept `idiom` and `phrase` without the "NEW TYPE" warning while old files remain.
  Keep them in a separate `LEGACY_TYPES` tuple so they're easy to remove later.
- **Name beats topic:** when voting an entry's `type`, if any mention says `name` and the
  others say `topic`, the entry is a `name`. The hosts explain a name in one episode and
  only talk about the thing in another, so this is expected. Don't report `name`/`topic`
  as a type conflict in `reports/duplicates.md`.

**Role**
- Pass `role` through to each mention. Warn about any value other than `subject`,
  `aside` or `mention`.
- Mentions from old-format files (no `prompt_version`) get `role: null`. Don't invent one.
- "Same entry twice in one episode": keep the mention with the highest role
  (subject > aside > mention), not the first one, and still warn.

**Links**
- Parse links in v2 notes with `\[\[([a-z-]+)(\?)?:([^\]|]+)\]\]([^\W\d_]*)`. Python's `re`
  has no `\p{L}`; `[^\W\d_]` means "a Unicode letter".
- Write them to each mention as
  `"links": [{"type": "from", "uncertain": false, "target": "cuneus", "slug": "cuneus"}]`,
  in the order they appear in the note.
- Resolve `slug` **after** overrides are applied and entries are grouped, so renames and
  merges are taken into account. Try, in order:
  1. an entry with a mention in the same episode whose term or original slugifies to the
     same slug as the target;
  2. any entry with that term slug;
  3. any entry with that original slug;
  4. otherwise `null` (a link to something that isn't an entry is allowed).
- In v2 files, warn about untyped links (`[[x]]` or `[[x|y]]`) and unknown types.
- In old-format files, keep parsing `[[target]]` and `[[target|text]]` as today and record
  them with `"type": null`.

**Duplicates report**
- Add a check for one expression contained in another: flag a pair when one slug's words
  appear as a run of consecutive words inside the other's, and the shorter one has at
  least 3 words. Example: `cat-out-of-the-bag` in `let-the-cat-out-of-the-bag`. Terms now
  follow the hosts' wording, so the same idiom will be worded differently across
  episodes.

**Summary**
- Show how many files are at each `prompt_version`.
- Show counts per role.
- Show the new link warnings.

**Documentation**
- Update the docstring and the `merge.py` section of `README.md`: the new `entries.json`
  shape, types and warnings.

New mention shape in `data/entries.json`:

```json
{"episode_id": "m9AaobtBMtA", "t": 978, "role": "subject", "note": "…",
 "links": [{"type": "same-root", "uncertain": false, "target": "cartouche", "slug": "cartouche"}],
 "confidence": "high"}
```

### 4. Site (`site/src/main.js`)

**Types**
- `TYPES`: `word`, `expression` (Expressions), `name`, `topic` (Topics), in that order,
  because the filter chips follow it.
- Keep the `idiom` and `phrase` labels until the full run is merged.

**Note rendering (`noteHtml`)**
- Render typed links from the mention's `links` array: the i-th typed link in the text uses
  `links[i].slug`.
- Put the trail inside the `<a>`.
- Set `data-type` and, for uncertain links, `data-uncertain`, so CSS can style
  `unrelated` and uncertain links differently. A muted or dotted underline is enough.
  Add a `title` such as "unrelated" or "possibly from".
- Keep rendering old `[[target]]` / `[[target|text]]` notes, which have no `links` or
  have `type: null`.
- Note that `WIKILINK` is also passed to `graph.js` on the `graph-prototype` branch (see
  step 7).

**Entry page**
- Order mentions `subject` first, then `aside`, then by date (`role: null` counts as
  `subject`).
- Mentions with role `mention` go under a separate "Also mentioned in" heading.
- Entries without a language or original form (topics) must look right. Both fields
  are already hidden when empty, but check.

**Search**
- Entries whose mentions are all `mention` rank after all others, within the existing
  exact / prefix / fuzzy tiers.

**About page**
- "dozens of words, idioms and names" → "dozens of words, expressions and names".

### 5. QA tool (`qa/review.py`, `qa/index.html`)

- Show `role` on each item.
- Add a filter by role.
- Flag untyped links in v2 files, as `merge.py` does.
- Types update automatically through `KNOWN_TYPES`.

### 6. Pilot, then stop and report

1. Extract these 7 episodes into a scratch folder, **not** `extracted/`:
   - `52GtCvS7HCU`, `6Rr6qfIIapY`, `JlgQIDxufh0` and `YBIXXAipmZw` (the episodes in
     `extracted_old/`);
   - `m9AaobtBMtA`, `-54FiJ0PsXo` and `3bvK3bz_AlY`.

   Use the exact `claude -p` call from `extract_all.sh`. Run at most 2–3 in parallel.
2. Run `merge.py` on them. It has `--root`, so point it at a copy of the project whose
   `extracted/` holds the pilot output.
3. Check:
   - all files are valid JSON and every timestamp exists in its transcript;
   - recall against the current `extracted/*.json` for the same episodes: list the old
     entries that are missing and say whether each was renamed or dropped;
   - no `idiom`/`phrase` types and no link warnings;
   - these types, allowing for the known run-to-run variation:

     | entries | expected |
     |---|---|
     | *Minoan*, *cuneiform*, *hieroglyph* (m9AaobtBMtA) | `word` |
     | *Rosetta Stone*, *Mesopotamia* (m9AaobtBMtA) | `name` |
     | *Linear B*, *Phaistos Disc*, *Voynich Manuscript* (m9AaobtBMtA) | `topic` |
     | *Code of Hammurabi* (m9AaobtBMtA) | `topic`, role `aside` |
     | *moutarde à l'ancienne* (m9AaobtBMtA) | `expression`, counted in `original` |
     | *Monodon monoceros*, *Mysticeti* (-54FiJ0PsXo) | `name` |
     | *octopus* (-54FiJ0PsXo) | `word` |
     | *spill the beans* and its foreign equivalents (6Rr6qfIIapY) | `expression`, all `subject` |
     | *break a leg* (YBIXXAipmZw) | `expression` |
   - no entry that appears in several pilot episodes has conflicting types in
     `reports/duplicates.md`, apart from `name`/`topic`;
   - the site renders typed links, topics and the "Also mentioned in" section with this
     data;
   - output size, and an estimate for the full run.
4. **Report to the user and wait for approval before step 7.**

### 7. Full run (only after the user approves)

1. Move the current `extracted/*.json` to a new folder `extracted_v1/`. Don't use
   `extracted_old/`: it already holds older files. Delete
   `extracted/3bvK3bz_AlY.json.tmp`.
2. Run `./extract_all.sh`. It takes about 10 hours if run one episode at a time and will
   hit usage limits; it resumes where it stopped.
3. Run `python3 merge.py`, then review `reports/duplicates.md` with the user.
4. Afterwards:
   - remove `LEGACY_TYPES` and the site's `idiom`/`phrase` labels;
   - confirm `merge.py` shows no "NEW TYPE" warnings.
5. On the `graph-prototype` branch, change `graph.js` to build edges from each mention's
   `links` instead of parsing notes. Leave out `unrelated` links, draw uncertain ones
   dashed, and ignore links with `slug: null`.

## Out of scope

- **Changing extraction rules**, unless the pilot shows a problem and the user agrees.
- **Anything that can be worked out from the extracted data alone**, without the
  transcripts: Wiktionary and Wikipedia links, native script, tags. These come in cheaper
  passes after the full run. Do them only if the user asks. The notes below are for then.

### Later: Wiktionary integration

- **Coverage:** 845 of the 1,019 current entries match a Wiktionary page by `term` or
  `original` directly.
- **Why some don't match:**
  - Wiktionary's own headword conventions (*know one's onions*, *apple-pie order*,
    lowercase *impressionism*);
  - foreign idioms stored only as a translation;
  - obscure words Wiktionary doesn't have.
- **Approach:**
  1. A script tries the exact title, then variants: lowercase, *your* → *one's*,
     hyphens. It links to the right language section (`#German` and so on).
  2. A cheap model pass over the misses, with a Wiktionary search tool. It sees `term`,
     `original`, `language` and `note`, never the transcript.
  3. The result goes in a separate `wiktionary_title` field. `term` stays as the hosts
     said it.
- **Names** are usually better linked to Wikipedia.
