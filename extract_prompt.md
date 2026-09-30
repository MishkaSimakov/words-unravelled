You will receive one transcript of an episode of **Words Unravelled**, a podcast about
etymology hosted by Rob Watts (YouTube channel "RobWords") and Jess Zafarris.

The transcript comes from automatic YouTube captions. Each line starts with a timestamp
in `[HH:MM:SS]` format; `>>` marks a change of speaker. Expect transcription errors,
especially in names, foreign words and rare words. Known recurring errors: the show name
may appear as "Words Inside Out" or similar, Jess's name as "Jessie Ferris" or similar,
and swear words may be censored as `[ __ ]` (work out the word from context and set
`confidence` to `"low"`).

## Your task

List every **entry** in the episode: a word, expression or named thing that the hosts
say something about.

### What counts as an entry

Extract a term or a named thing if the hosts either:
- say something about it: its meaning, origin, history or usage, or, for a named thing,
  what it is or what happened to it; or
- point to where it was discussed (an earlier episode, one of their videos) without
  saying anything more about it here.

Don't extract:
- Things that are only named, as an example, a comparison or a setting, with nothing said
  about them: "in Egypt", "royal names like Cleopatra", "trying to be more like *absent*
  and *confident*".
- A root or source word named only as the origin of an entry, as with Latin *cuneus* in
  "cuneiform, from Latin cuneus, wedge". Put it in that entry's note as a link instead.
  If the hosts discuss the root in its own right, it is an entry.
- Sources: a book, dictionary, scholar or YouTuber the hosts take information from, or the
  text where a word is first recorded. Name them in the note if useful.
- The cold open or teaser at the start of the episode. Items teased there are usually
  discussed later; use the timestamp of that later discussion.
- Sponsor reads, merch and tour announcements, calls to subscribe, shout-outs.

### Role

`role` is the part the entry plays in this episode's conversation:

- `subject`: the hosts discuss it for its own sake.
- `aside`: it comes up only to make a point about another entry, and the hosts say nothing
  about it beyond that point. It may be an example, a cognate, a comparison, or a person or
  thing in the other entry's story (who found it, who deciphered it, who is said to have
  invented it). In "parchment and pageant had no T in French either", *parchment* and
  *pageant* are asides to *ancient*.
- `mention`: the hosts only point to where it was discussed and say nothing about it here.

If the hosts explain the entry itself (what it means, where it comes from), it's a
`subject`, even when another entry brought it up. The French for wholegrain mustard comes
up because of *ancient*, but the hosts explain what it means, so it's a subject.

"Another entry" means another entry in your output, not the episode's theme. In an
episode about sea creatures, *walrus* is a subject.

**Lists.** When the hosts go through a list that is itself the topic (old words for sex,
the zones of the ocean), every item is a `subject`, even items that are only named. So
are an entry's equivalents in other languages, and other versions of the same saying (the
French, Spanish and Dutch ways to spill the beans). A list that illustrates a point about
another entry (*parchment*, *pageant*, *peasant*, *tyrant* as examples of an added T) is
not a topic: its items are asides.

### Type

Apply the steps in order. The first match wins.

0. **Scientific names.** A taxon written as such (*Monodon monoceros*, *Mysticeti*,
   *Cetacea*) → `name`. A common word that is also a genus (octopus) follows the steps below.
1. **One specific thing?** Can you say "a ___", "another ___" or "___s" and mean a different
   one of the same kind? "every Sunday", "a Minoan", "a hieroglyph": yes, it's a kind, so go
   to step 2. "another Mesopotamia": no, it's one specific thing:
   - the hosts explain the name (its origin or meaning) → `name`;
   - otherwise → `topic` (they talk about the thing, not its name).
2. **Count the words** in `original` if it's set, otherwise in `term`. Spaces separate
   words. A hyphenated compound (*mother-in-law*) or a contraction (*don't*) is one word.
   For languages written without spaces, count the romanised form the hosts use.
   - one word → `word`
   - two or more → `expression` (idioms, proverbs, sayings, quotations, multi-word terms)

Settled cases:
- Days, months and festivals; peoples and demonyms (*Viking*); common nouns for scripts
  (*cuneiform*) → `word`.
- Languages and scripts (*Latin*, *Linear B*) → `name` or `topic`. A word that names both a
  people and their language or script (*Phoenician*) is one entry: `word` if the hosts
  discuss only the people, otherwise `name` or `topic`.
- Brands, pets, gods, mythical individuals, works, bands and songs → `name` or `topic`.
  A genericised brand ("to google") → `word`.
- If both the name and the thing are discussed → `name`, as one entry. Never split them
  into two entries (not *Phoenician* and *Phoenician alphabet*).

### Fields

- `term`: the entry in the full form the hosts use for it. Don't shorten it (*humpback
  whale*, not *humpback*), don't add words they don't say (*cup of tea*, not *one's cup of
  tea*), and don't change its grammatical form (*belly-flopping* stays as it is). Keep a
  leading article only when it is part of the expression (*the birds and the bees*).
  - A foreign single word keeps its own form (*Kummerspeck*).
  - A foreign expression (an idiom, saying, slang phrase or dish name) uses the literal
    translation the hosts give, with the foreign form in `original`. If they give no
    translation, use the foreign form.
  - Never translate a name: "Fettes Brot", not "fat bread" (put the meaning in
    `translation`).
  - For a topic, use its usual English name.
- `original`: the foreign form, if the hosts say it. Captions often garble foreign words,
  so reconstruct what the hosts said, and set `confidence` to `"low"` if you're unsure.
  If the hosts say it only in English, `original` is `null`: never supply a form they
  didn't say. For English entries it is `null`.
- `translation`: the literal English translation if the hosts give one; otherwise `null`.
- `type`: `"word"`, `"expression"`, `"name"` or `"topic"` (see above).
- `language`: the language the term is used in, not the one it comes from, as a plain
  English name without regional varieties ("French", not "French (Quebec)"). *Avon* is
  English even though the name is Celtic, and *abjad* discussed as an English word is
  English. A foreign word discussed as such keeps its language (French *moutarde à
  l'ancienne*). Scientific names are Latin. Topics: `null`; every other entry has a
  language (the name *Vulgar Latin* is English).
- `timestamp`: see Rules.
- `role`: `"subject"`, `"aside"` or `"mention"` (see above).
- `note`: see Rules. May contain links.
- `confidence`: `"low"` if you are unsure about the spelling, the original form or whether
  the entry qualifies; otherwise `"high"`.

For topics, `original` and `translation` are `null` unless the hosts give them.

## Rules

- **Timestamps:** copy the timestamp of the line where the discussion of the entry begins,
  exactly as it appears in the transcript. Never invent or interpolate one.
- **Duplicates:** output each entry once. If it comes up more than once, give it its
  highest role (subject > aside > mention) and the timestamp of the first time it has
  that role. Don't split one entry into several. The same term in two senses (*fornix*
  the arch and *fornix* in the brain) is one entry, and so is one word in several
  languages (*skinship*, with the Japanese form in `original`). The exception is when
  the hosts discuss the forms as separate words. Different words are always separate
  entries, even when they are related: doublets and cognates (*cartouche* and
  *cartridge*) each get their own entry.
- **Spelling:** correct transcription errors using context. If you are not sure of the
  correct form, keep your best guess and set `confidence` to `"low"`.
- **No outside knowledge:** the note describes only what the hosts say in this episode,
  even if you know more.
- **Notes** are one sentence of at most 30 words, in your own words. For a topic,
  summarise what the hosts say about the thing. For a mention, say where it was discussed.

## Links

Mark connections between entries inside the note as `[[type:target]]`:

| type | meaning | example |
|---|---|---|
| `from` | the target is where this entry came from | `from Latin [[from:cuneus]]` |
| `gave` | this entry is where the target came from | `which gave us [[gave:parchment]]` |
| `same-root` | they share an origin (cognates, doublets) | `a doublet of [[same-root:cartridge]]` |
| `equivalent` | a saying with the same meaning, in another language or the same one | `the French [[equivalent:spill the beans]]` |
| `unrelated` | the hosts say they look related but aren't | `unrelated to [[unrelated:desert]]` |
| `see` | any other connection: a pun, a story, a contrast, an example | `a pun on [[see:umbles]]` |

- Link only when the hosts make the connection in this episode, never from your own
  knowledge, and never just because two entries share a topic. Most notes have no links.
- Use the relation the hosts state. If one saying developed from another, use
  `from`/`gave`, not `equivalent`. If none of the types fits, use `see`.
- If the hosts present the relation as uncertain or disputed ("may be related", "one
  theory says"), add `?` to the type: `[[from?:shesep ankh]]`, `[[same-root?:phoenix]]`.
- **Target:** for an entry in your output, copy its `term`, or its `original` if it has
  one. Otherwise use the form the target is best known by in English, following the rules
  for `term`. Don't link an entry to itself.
- **Shown text:** the link shows its target. Letters written straight after `]]` become part
  of the link text, so `[[see:ounce]]s` shows "ounces". Use this only for inflections
  (plurals, -ed, -ing). Otherwise rephrase the sentence so the target reads naturally
  ("The [[see:verlan]] form of…"). Link text counts toward the 30-word limit.

## Output

Respond with a single JSON object and nothing else: no Markdown fences, no commentary, no
other files.

{
  "video_id": "<copied from the '# video_id:' header>",
  "prompt_version": 2,
  "entries": [
    {
      "term": "dessert",
      "original": null,
      "translation": null,
      "type": "word",
      "language": "English",
      "timestamp": "00:12:40",
      "role": "subject",
      "note": "From French desservir, to clear the table, because it came after the table was cleared; unrelated to [[unrelated:desert]].",
      "confidence": "high"
    },
    {
      "term": "Kummerspeck",
      "original": "Kummerspeck",
      "translation": "grief bacon",
      "type": "word",
      "language": "German",
      "timestamp": "00:31:05",
      "role": "aside",
      "note": "Weight put on by comfort eating, one of the German compounds the hosts compare with [[see:hangry]].",
      "confidence": "high"
    }
  ]
}
