You will receive one transcript of an episode of **Words Unravelled**, a podcast about
etymology hosted by Rob Watts (YouTube channel "RobWords") and Jess Zafarris.

The transcript comes from automatic YouTube captions. Each line starts with a timestamp
in `[HH:MM:SS]` format; `>>` marks a change of speaker. Expect transcription errors,
especially in names, foreign words and rare words. Known recurring errors: the show name
may appear as "Words Inside Out" or similar, and Jess's name as "Jessie Ferris" or similar.

## Your task

List every **entry** the hosts actually discuss: a word, idiom, phrase or name whose
meaning, origin, history or usage they explain or talk about.

Include:
- Words and phrases whose etymology or meaning is explained, in any language.
- Foreign idioms, including their literal translation when the hosts give one.
- Names (people, places, brands, bands, artworks) when the name itself is explained.

Exclude:
- Words that are merely used or mentioned in passing.
- The cold open / teaser at the start of the episode. Items teased there are usually
  discussed properly later; use the timestamp of that later discussion.
- Sponsor reads, merch and tour announcements, calls to subscribe, listener shout-outs.

## Rules

- **Timestamps:** copy the timestamp of the line where the discussion of the entry
  begins, exactly as it appears in the transcript. Never invent or interpolate one.
- **Spelling:** correct transcription errors using context (e.g. a misheard foreign word).
  If you are not sure of the correct form, keep your best guess and set `confidence` to `"low"`.
- **No outside knowledge:** the `note` must describe only what the hosts say in this
  episode. Do not add etymology from your own knowledge, even if you are sure it is correct.
- **Duplicates:** if an entry is discussed more than once in this episode, output it once,
  with the timestamp of the first real discussion.
- **Notes** are one sentence, at most 30 words, written in your own words.
- **Links:** when the hosts connect the entry to another entry, word or root, mark it
  inside the note with an Obsidian-style link: `[[target]]`, or `[[target|shown text]]`
  when the wording of the sentence differs from the target. See "Links" below.

## Links

Add a link only when the hosts themselves make the connection in this episode, for example:
- the two share a root, or one comes from the other ("from [[via]]", "a doublet of [[diary]]");
- a foreign idiom they present as the equivalent of another ("the Spanish [[spill the beans]]");
- a pun or story that ties them together ("a pun on [[umbles|umble pie]]");
- an entry they say was covered in an earlier episode.

Never link two entries just because they share a topic, and never link based on your own
knowledge. Most notes will have no links, and that's fine.

The target is written like the `term` field:
- If the target is an entry in your output, copy its `term` exactly.
- Otherwise use the form it is best known by in English, following the same rules as
  `term`. It's fine to link to something that isn't an entry in this episode (a Latin root
  the hosts name, a word from a previous episode). Don't create an entry just to have
  something to link to.

Write links inline, as part of the sentence, not as a list at the end. Don't link an entry
to itself. Link text counts toward the 30-word limit.

## Output

Respond with a single JSON object and nothing else: no Markdown fences, no commentary.

{
  "video_id": "<copied from the '# video_id:' header>",
  "entries": [
    {
      "term": "break a leg",
      "original": null,
      "translation": null,
      "type": "idiom",
      "language": "English",
      "timestamp": "00:01:28",
      "note": "Used to wish performers luck; the hosts compare it with [[into the wolf's mouth]] and other equivalents.",
      "confidence": "high"
    }
  ]
}

Field definitions:
- `term`: the entry as it is best known in English. For a foreign idiom without an
  English form, use the literal translation the hosts give. For a **name** (band, person,
  place, brand), always use the name itself, never a translation: "Fettes Brot", not
  "fat bread"; put the meaning in `translation`.
- `original`: the form in the original language (e.g. French, Hungarian) if the hosts say
  it and it is clear from the transcript; otherwise `null`.
- `translation`: literal English translation if the hosts give one; otherwise `null`.
- `type`: one of `"word"`, `"idiom"`, `"phrase"`, `"name"`.
- `language`: the language the entry belongs to, as a plain English name ("English",
  "Hungarian", "French"). Don't add regional varieties in parentheses ("French (Quebec)",
  "Mexican Spanish"); mention the region in the `note` instead.
- `timestamp`: `"HH:MM:SS"`, copied from the transcript.
- `note`: see rules above; may contain `[[links]]`.
- `confidence`: `"high"` or `"low"`. Use `"low"` if you are unsure about the spelling,
  the original form, or whether the entry is really discussed rather than just mentioned.