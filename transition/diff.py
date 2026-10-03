#!/usr/bin/env python3
"""Temporary (issue #4): a readable diff of the entry files against a commit (default HEAD).

    python3 transition/diff.py            # everything that changed
    python3 transition/diff.py --ref dev

Entry files are one line of JSON each, so `git diff` shows little. This prints:
- glosses: for every slug with a changed gloss, all of the slug's entries, changed ones marked;
- notes: each changed note, with only the links that changed.
Any other change (a field other than gloss or note, entries added or removed) is listed as
unexpected, and the exit status is 1.
"""
import argparse
import difflib
import sys
from collections import defaultdict

from common import ANY_LINK, describe, load_episodes, load_head, plain, set_gloss, slugify


def tokens(note):
    """The note split into links and the text between them."""
    out, last = [], 0
    for m in ANY_LINK.finditer(note or ""):
        out += [note[last:m.start()], m.group(0)]
        last = m.end()
    return out + [note[last:]]


def note_changes(old, new):
    """['[[a]] -> [[b]]', ...] for the parts of the note that changed."""
    a, b = tokens(old), tokens(new)
    changes = []
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(a=a, b=b, autojunk=False).get_opcodes():
        if op != "equal":
            changes.append(f"{''.join(a[i1:i2]) or '∅'}  →  {''.join(b[j1:j2]) or '∅'}")
    return changes


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--ref", default="HEAD")
    args = p.parse_args()

    episodes = load_episodes()
    gloss_slugs, notes, unexpected = set(), [], []
    heads = {}
    for vid, new in episodes.items():
        old = load_head(vid, args.ref)
        if old == new:
            continue
        if old is None:
            unexpected.append(f"{vid}: new file")
            continue
        heads[vid] = old
        if {k: v for k, v in old.items() if k != "entries"} != {k: v for k, v in new.items() if k != "entries"}:
            unexpected.append(f"{vid}: episode fields changed")
        if len(old["entries"]) != len(new["entries"]):
            unexpected.append(f"{vid}: {len(old['entries'])} -> {len(new['entries'])} entries")
            continue
        for i, (a, b) in enumerate(zip(old["entries"], new["entries"])):
            if a == b:
                continue
            for k in sorted(set(a) | set(b)):
                if a.get(k) == b.get(k):
                    continue
                if k == "gloss":
                    gloss_slugs.add(slugify(b["term"]))
                elif k == "note":
                    notes.append((vid, i, b, note_changes(a.get("note"), b.get("note"))))
                else:
                    unexpected.append(f"{vid}#{i} {a.get('term')!r}: {k} {a.get(k)!r} -> {b.get(k)!r}")
            if list(b) != list(set_gloss(a, b.get("gloss"))):
                unexpected.append(f"{vid}#{i}: key order changed")

    if gloss_slugs:
        by_slug = defaultdict(list)
        for vid, data in episodes.items():
            for i, e in enumerate(data["entries"]):
                s = slugify(e.get("term") or "")
                if s in gloss_slugs:
                    by_slug[s].append((vid, i, e))
        print(f"# Glosses ({len(gloss_slugs)} slugs)\n")
        for s in sorted(by_slug):
            print(f"## {s}")
            for vid, i, e in sorted(by_slug[s], key=lambda x: (x[2].get("gloss") or "", x[0], x[1])):
                old = heads.get(vid, episodes[vid])["entries"][i].get("gloss")
                new = e.get("gloss")
                mark = "  " if old == new else "* "
                was = "" if old == new else f"  (was {old or 'none'})"
                note = plain(e.get("note"))
                note = note if len(note) <= 90 else note[:89] + "…"
                print(f"{mark}{vid}#{i:<3} {e['term']}  ->  {new or '—'}{was}   {describe(e)} {note}")
            print()

    if notes:
        print(f"# Notes ({len(notes)} changed)\n")
        for vid, i, e, changes in notes:
            gloss = f" ({e['gloss']})" if e.get("gloss") else ""
            for c in changes:
                print(f"{vid}#{i:<3} {e['term']}{gloss}:  {c}")
        print()

    if unexpected:
        print(f"# Unexpected changes ({len(unexpected)})\n")
        print("\n".join(unexpected))
        sys.exit(1)
    if not gloss_slugs and not notes:
        print(f"No changes against {args.ref}.")


if __name__ == "__main__":
    main()
