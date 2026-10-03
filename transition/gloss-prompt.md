# Task: give glosses to homographs

The project indexes words discussed on the *Words Unravelled* podcast. Entries are identified by
their spelling, so different words with the same spelling (German *Gift* "poison" and English
*gift*; *meal* "flour" and *meal* "repast"; *Phoenix* the city and *phoenix* the bird) end up
merged into one page. Each entry can now carry an optional **gloss** that tells it apart, like
a Wikipedia disambiguation suffix: *Gift (German)*, *meal (flour)*, *Phoenix (city)*.

## Input

`transition/work/glosses-todo.txt` lists every entry whose spelling is shared by different
words, grouped by spelling. Each line is one entry:

```
## gift
XA4d9r6Yu5A#34  Gift  [German]  German for poison, from the same source as English gift ...  (ep: Dangerous words in other languages)
XA4d9r6Yu5A#35  gift  [Swedish]  Swedish for poison, like German Gift, and also for married.  (ep: ...)
XA4d9r6Yu5A#36  gift  [English]  Simply something that has been given, like a present; ...  (ep: ...)
```

That's the ID, the term, `[language; original form; literal translation]`, the note on what
the hosts said, and the episode title. A group header is the spelling as the site folds it
(lowercase, accents and hyphens dropped). So *a-*, *A* and *å* share the group `a`, and they
need telling apart too.

## Output

Write `transition/work/glosses-answers.txt` with **one line for every ID** in the input, in
any order:

```
XA4d9r6Yu5A#34 German
XA4d9r6Yu5A#35 Swedish
XA4d9r6Yu5A#36 -
```

`-` means no gloss. You may add comment lines starting with `#` (e.g. `# unsure: ...`), and
they're shown to the reviewer. Don't edit any other file.

## Rules

1. **A gloss only marks a different word.** Within a group, decide which entries are the same
   word and which are different words that happen to share the spelling. Entries for the same
   word, including in different episodes, get exactly the same answer, character for
   character, so that they stay one entry. Different words get different answers.
2. **Usually one word per group keeps `-`.** That's typically the common English word (*gift*,
   *meal* as in breakfast, *phoenix* the bird). Every other word gets a gloss. If no word
   stands out as the default, it's fine to gloss all of them.
3. **The gloss style:**
   - a **language** for a false friend or foreign word: *Gift (German)*, *bite (French)*.
     Capitalised, as languages are;
   - a **meaning** for a homonym in one language: *meal (flour)*, *school (fish)*,
     *count (title)*. Lowercase, one or two words, chosen so that a reader recognises the
     word;
   - a **kind** for a name versus a word: *Adobe (company)*, *Phoenix (city)*,
     *Hostel (film)*, *Ruth (name)*, *Battle (town)*. Lowercase.
4. 1–3 words, no brackets, `|` or `#`. Prefer the shortest label that works across all of
   the word's occurrences.
5. If one name or meaning could be ambiguous with another gloss in the group, make it more
   specific (*Phoenix (city)*, not *Phoenix (place)* when there's also a Phoenix band).
6. Two entries in **one episode** must never get the same answer: the site would merge them
   and drop one note. If you think two such entries really are the same word mentioned twice,
   answer them differently anyway and add a `#` comment naming both IDs, so the reviewer can
   decide.

Work through every group; there are 80 groups and about 220 lines. Finish with a short summary
of the groups you were unsure about.
