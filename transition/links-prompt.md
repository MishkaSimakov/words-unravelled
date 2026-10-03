# Task: point links at the right homograph

The project indexes words discussed on the *Words Unravelled* podcast. Each entry has a note
on what the hosts said, and notes link to other entries as `[[type:target]]`. Some spellings
are shared by different words, which are told apart by a **gloss**: *Gift (German)* and
*gift*; *Battle (town)* and *battle*. A link has to name the gloss to reach a glossed entry,
as in `[[same-root:battle (town)]]`. Without a gloss it means the word that has none.

## Input

`transition/work/links-todo.txt` lists links whose target could mean more than one of these
words. Each block is one link:

```
4CJRYBxDdGg#15@0  in combat [English]  (ep: How do you pronounce lieutenant? | MILITARY WORDS)
    note: Shares a root meaning to beat or fight with »[[same-root:battle]]«; literally fighting together.
    in this episode: battle [answer -]; Battle (town)
    elsewhere: none
```

That's the link ID, the entry whose note has the link, its `[language; ...]` and episode,
the note with the link between `»«`, and the candidates. The candidates are the words with
that spelling discussed in the same episode, and those discussed in other episodes. A
candidate marked `[answer -]` is the word without a gloss.

## Output

Write `transition/work/links-answers.txt` with **one line for every link ID** in the input:

```
4CJRYBxDdGg#15@0 -
1PM_iwxAyb8#86@0 school (fish)
```

- `<id> <term (gloss)>`: the link means that glossed candidate. Copy the candidate exactly as
  listed, including the brackets.
- `<id> -`: the link means the candidate without a gloss, an entry whose original form it is,
  or none of the candidates (leave the link as it is).

You may add comment lines starting with `#` (e.g. `# unsure: ...`) for the reviewer. Don't
edit any other file.

## How to decide

- Read the note: the link's type (`same-root`, `from`, `gave`, `see`, `unrelated`,
  `equivalent`) and the sentence usually say which word is meant. For example, a *same-root*
  link from *combat* to *battle* means the English word, not the town.
- A language named next to the link ("German *Gift*", "French *péter*") points to the glossed
  foreign word.
- Prefer a candidate from the same episode, unless the note clearly means another word.
- When it's truly undecidable, answer `-` and add a `# unsure:` comment.

Work through all of them (about 107). Finish with a short list of the links you were unsure
about.
