# Temporary: adding glosses to the existing episodes (issue #4)

**This folder is temporary.** It is only used to add `gloss` fields to the 102 already
extracted episodes. Delete it (`git rm -r transition`) before the branch is merged into
`dev`.

`transition/work/` holds the exports and answers. It is git-ignored.

## 1. Glosses for the 80 ambiguous slugs

```sh
python3 transition/gloss.py export          # -> transition/work/glosses-todo.txt
# run an agent with transition/gloss-prompt.md -> transition/work/glosses-answers.txt
python3 transition/gloss.py apply transition/work/glosses-answers.txt
python3 transition/diff.py                  # review against HEAD
python3 data/build.py                       # "same entry twice in one episode" should be gone
```

`apply` writes nothing unless the answers are complete and valid:
- one answer per exported ID;
- no brackets in glosses;
- no two entries with the same slug in one episode.

It then prints the glosses used per slug, so variants that differ only in case stand out.

## 2. Links into glossed entries

```sh
python3 transition/links.py export          # -> work/links-auto.txt (script), work/links-todo.txt (agent)
# run an agent with transition/links-prompt.md -> transition/work/links-answers.txt
python3 transition/links.py apply transition/work/links-auto.txt transition/work/links-answers.txt
python3 transition/diff.py
python3 data/build.py                       # "link to a glossed entry without its gloss" should be gone
```

`export` takes every link without a gloss whose target is spelled like a glossed entry. If the
episode has exactly one candidate, the script answers; the rest go to the agent. An answer is a
candidate's `term (gloss)`, or `-` to leave the link as it is. `apply` adds the gloss inside the
link, keeping the target's spelling: `[[see:Battle]]` → `[[see:Battle (town)]]`.

## Review

Entry files are one line of JSON each, so `git diff` doesn't help. `transition/diff.py` compares
the working copy with HEAD (or `--ref <commit>`) and shows:
- for each slug whose glosses changed, all of its entries, with the changed ones starred;
- each changed note, with only the changed links;
- anything else that changed, listed as unexpected (exit status 1).

To undo an applied answer file before it is committed: `git checkout -- ingest/3-entries`.
