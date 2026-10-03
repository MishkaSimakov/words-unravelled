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

### One thing, one entry

- If both a name and the thing it names are discussed, they are one entry. Never split them
  into two (not *Phoenician* and *Phoenician alphabet*).
- A word that names both a people and their language or script (*Phoenician*) is one entry.
- A taxon written as such (*Monodon monoceros*, *Mysticeti*) is its own entry, separate from
  the common name (*narwhal*) when the hosts discuss both.

### Category

`category` says what kind of thing the entry is. Go down this list and stop at the first
rule that fits:

1. `word-part`: the term starts or ends with a hyphen (*-chester*, *be-*, *-nym*), is a
   letter of an alphabet (*the letter Q*, *thorn*), or is an element of words or place
   names discussed as an element rather than as a word (*aber*, *llan*).
2. `name`: it names one specific thing: a person, place, organisation, brand, band, book,
   film, character, god, ship or event (*Berlin*, *IKEA*, *Daft Punk*, *Minotaur*, *Albert*,
   *Al Capone*). These are not names: days and months, peoples and nationalities, species
   and breeds, geological periods, languages and scripts, and names used as common words
   (*Tuesday*, *Vikings*, *Triassic*, *a Judas*).
3. `about-language`: a term for describing language: grammar, rhetoric, sounds, spelling,
   punctuation, word formation, kinds of words and sayings (*calque*, *eggcorn*, *metonymy*,
   *schwa*, *Oxford comma*, *spoonerism*); or the name of a language, dialect, variety or
   script (*Polari*, *Old English*, *cuneiform*).
4. `expression`: several words that are said together rather than naming a thing: idioms,
   sayings, proverbs, catchphrases, quotations, greetings, slang phrases, rhyming slang and
   foreign sayings (*spill the beans*, *mad as a box of frogs*, *apples and pears*,
   *raining female trolls*). A multi-word term that names a thing is a `word`
   (*killer whale*, *dead drop*, *epipelagic zone*).
5. `word`: everything else: words in any language, compounds and multi-word terms for things,
   slang words, abbreviations and codes (*mortgage*, *Gift* in German, *swive*, *bladdered*).

Sort by the sense the hosts discuss. *Covent Garden* discussed as rhyming slang for a
farthing is an `expression`. A word that comes from a name is a `word` (*sandwich*,
*leotard*), and the person it comes from (*Jules Léotard*) is a `name`. A name whose origin
the hosts explain is still a `name` (*Montana*).

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
  - For a named thing the hosts only talk about (a person, place or work whose name they
    don't discuss), use its usual English name.
- `original`: the foreign form, if the hosts say it. Captions often garble foreign words,
  so reconstruct what the hosts said, and set `confidence` to `"low"` if you're unsure.
  If the hosts say it only in English, `original` is `null`: never supply a form they
  didn't say. For English entries it is `null`.
- `translation`: the literal English translation if the hosts give one; otherwise `null`.
- `language`: the language the term is used in, not the one it comes from, as a plain
  English name without regional varieties ("French", not "French (Quebec)"). *Avon* is
  English even though the name is Celtic, and *abjad* discussed as an English word is
  English. A foreign word discussed as such keeps its language (French *moutarde à
  l'ancienne*). Scientific names are Latin. For a named thing whose name the hosts discuss,
  it is the language the name is used in, not the one it comes from: *Montana* is an
  English name, even though it comes from Spanish. `null` for a named thing whose name the
  hosts don't discuss (a person, place or work they only talk about). Every other entry has
  a language (the name *Vulgar Latin* is English).
- `category`: `"word"`, `"name"`, `"expression"`, `"about-language"` or `"word-part"` (see
  above).
- `timestamp`: see Rules.
- `role`: `"subject"`, `"aside"` or `"mention"` (see above).
- `note`: see Rules. May contain links.
- `confidence`: `"low"` if you are unsure about the spelling, the original form or whether
  the entry qualifies; otherwise `"high"`.

For named things, `original` and `translation` are `null` unless the hosts give them.

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
- **Notes** are one sentence of at most 30 words, in your own words. For a named thing,
  summarise what the hosts say about it, and if they explain its name (where it comes from
  or what it means), include that explanation. For a mention, say where it was discussed.

## Links

Mark connections inside the note as `[[type:target]]`:

| type | meaning | example |
|---|---|---|
| `from` | the target is where this entry came from | `from Latin [[from:cuneus]]` |
| `gave` | this entry is where the target came from | `which gave us [[gave:parchment]]` |
| `same-root` | they share an origin (cognates, doublets) | `a doublet of [[same-root:cartridge]]` |
| `equivalent` | a saying with the same meaning, in another language or the same one | `the French [[equivalent:spill the beans]]` |
| `unrelated` | the hosts say they look related but aren't | `unrelated to [[unrelated:desert]]` |
| `see` | any other connection: a pun, a story, a contrast, an example | `a pun on [[see:umbles]]` |

- **Link what the note names.** When the note names an entry in your output, or a person,
  place, work or source word that is part of this entry's story (who coined or used it,
  what it comes from, what it is compared with), link it. In "named after Jules Léotard",
  link *Jules Léotard*.
- **A link never replaces an entry.** First decide the entries (see "What counts as an
  entry"); links come after. Anything that qualifies is listed as its own entry, even if
  another entry's note also links to it. This includes the equivalents of a saying, in
  English or other languages: if the hosts give an English saying as the equivalent of a
  foreign idiom, the English saying is an entry too. Link to something that isn't an entry
  only when it doesn't qualify, like a root named only as an origin or a person only named.
- **Don't link** words used in their ordinary sense ("a small toothed whale" in an
  episode about whales), languages and nationalities ("from Latin", "offensive to the
  Spanish"), which the `language` field already records, or the books, dictionaries and
  scholars the hosts take information from.
- Link only connections the hosts make in this episode, never from your own knowledge, and
  never just because two entries share a topic.
- Use the relation the hosts state. If one saying developed from another, use
  `from`/`gave`, not `equivalent`. If none of the types fits, use `see`.
- If the hosts present the relation as uncertain or disputed ("may be related", "one
  theory says"), add `?` to the type: `[[from?:shesep ankh]]`, `[[same-root?:phoenix]]`.
- **Target:** for an entry in your output, copy its `term`, or its `original` if it has
  one. Otherwise use the form the target is best known by in English, following the rules
  for `term`. Don't link an entry to itself. A possessive stays outside the link:
  `[[see:Jules Léotard]]'s`.
- **Shown text:** the link shows its target; there is no `[[type:target|text]]` form.
  Letters written straight after `]]` become part of the link text, so `[[see:ounce]]s`
  shows "ounces". Use this only for inflections (plurals, -ed, -ing). Otherwise rephrase the sentence so the target reads naturally
  ("The [[see:verlan]] form of…"). Link text counts toward the 30-word limit.

## Output

Respond with a single JSON object and nothing else: no Markdown fences, no commentary, no
other files.

{
  "entries": [
    {
      "term": "dessert",
      "original": null,
      "translation": null,
      "language": "English",
      "category": "word",
      "timestamp": "00:12:40",
      "role": "subject",
      "note": "From French desservir, to clear the table, because it came after the table was cleared; unrelated to [[unrelated:desert]].",
      "confidence": "high"
    },
    {
      "term": "Kummerspeck",
      "original": "Kummerspeck",
      "translation": "grief bacon",
      "language": "German",
      "category": "word",
      "timestamp": "00:31:05",
      "role": "aside",
      "note": "Weight put on by comfort eating, one of the German compounds the hosts compare with [[see:hangry]].",
      "confidence": "high"
    },
    {
      "term": "leotard",
      "original": null,
      "translation": null,
      "language": "English",
      "category": "word",
      "timestamp": "00:24:17",
      "role": "subject",
      "note": "Named after [[from:Jules Léotard]], the French acrobat who popularised the one-piece garment in the 1860s.",
      "confidence": "high"
    }
  ]
}
