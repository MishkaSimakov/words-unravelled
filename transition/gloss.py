#!/usr/bin/env python3
"""Temporary (issue #4): give glosses to the entries of the 80 ambiguous slugs.

    python3 transition/gloss.py export                    # -> transition/work/glosses-todo.txt
    python3 transition/gloss.py apply transition/work/glosses-answers.txt
    python3 transition/diff.py                            # review the result against HEAD

export lists every entry whose term has one of the 80 slugs, grouped by slug, one line each:

    ## gift
    XA4d9r6Yu5A#34  Gift  [German]  German for poison, ...  (ep: Dangerous words in other languages)

The ID is <video_id>#<index in the file's entries>. The answers file has one line per ID:
"<id> <gloss>", or "<id> -" for no gloss. apply checks the whole file before writing anything.
"""
import argparse
import sys
from collections import Counter, defaultdict

from common import (AMBIGUOUS, WORK, describe, entry_slug, load_episodes, plain, read_answers,
                    save_episode, set_gloss, slugify)

TODO = WORK / "glosses-todo.txt"
BAD_CHARS = set("()[]|#")


def items(episodes):
    """[(slug, id, vid, index, entry)] for every entry whose term slug is one of the 80."""
    found = []
    wanted = set(AMBIGUOUS)
    for vid, data in episodes.items():
        for i, e in enumerate(data["entries"]):
            s = slugify(e.get("term") or "")
            if s in wanted:
                found.append((s, f"{vid}#{i}", vid, i, e))
    found.sort(key=lambda x: (x[0], episodes[x[2]].get("date") or "", x[2], x[3]))
    return found


def export(args):
    episodes = load_episodes()
    found = items(episodes)
    lines, current = [], None
    for s, key, vid, _, e in found:
        if s != current:
            lines += ["", f"## {s}"]
            current = s
        gloss = f"  gloss: {e['gloss']}" if e.get("gloss") else ""
        lines.append(f"{key}  {e['term']}  {describe(e)}{gloss}  {plain(e.get('note'))}"
                     f"  (ep: {episodes[vid].get('title') or vid})")
    WORK.mkdir(exist_ok=True)
    TODO.write_text("\n".join(lines).lstrip() + "\n", encoding="utf-8")
    print(f"{len(found)} entries in {len({x[0] for x in found})} slugs -> {TODO}")
    missing = set(AMBIGUOUS) - {x[0] for x in found}
    if missing:
        print(f"warning: no entries for {', '.join(sorted(missing))}")


def apply(args):
    episodes = load_episodes()
    found = {key: (s, vid, i, e) for s, key, vid, i, e in items(episodes)}
    answers = read_answers(args.answers)

    errors = []
    for key in answers.keys() - found.keys():
        errors.append(f"{key}: not an exported ID")
    for key in sorted(found.keys() - answers.keys()):
        errors.append(f"{key}: no answer ({found[key][3]['term']})")
    glosses = {}
    for key, answer in answers.items():
        if key not in found:
            continue
        gloss = None if answer == "-" else answer
        if gloss and (BAD_CHARS & set(gloss) or len(gloss) > 40):
            errors.append(f"{key}: bad gloss {gloss!r} (no brackets, | or #; at most 40 characters)")
        glosses[key] = gloss

    # Two different words in one episode must not end up with the same slug.
    slugs = defaultdict(list)
    for key, (s, vid, i, e) in found.items():
        if key in glosses:
            slugs[(vid, entry_slug(e["term"], glosses[key]))].append(key)
    for (vid, s), keys in sorted(slugs.items()):
        if len(keys) > 1:
            errors.append(f"{' '.join(keys)}: same slug '{s}' in one episode (give them different glosses)")
    if errors:
        sys.exit("Nothing written.\n" + "\n".join(errors))

    changed = set()
    for key, gloss in glosses.items():
        s, vid, i, e = found[key]
        if e.get("gloss") != gloss:
            episodes[vid]["entries"][i] = set_gloss(e, gloss)
            changed.add(vid)
    for vid in sorted(changed):
        save_episode(vid, episodes[vid])

    # Per slug, the glosses used: spelling variants of one gloss make separate entries.
    by_slug = defaultdict(Counter)
    for key, gloss in glosses.items():
        by_slug[found[key][0]][gloss or "-"] += 1
    print(f"Wrote {len(changed)} files. Glosses per slug ('-' = none):")
    for s in sorted(by_slug):
        counts = by_slug[s]
        note = ""
        folded = Counter(slugify(g) for g in counts if g != "-")
        if any(n > 1 for n in folded.values()):
            note = "  <- glosses that differ only in case or punctuation"
        elif "-" not in counts:
            note = "  <- every entry has a gloss: /entry/{} will be 'not found'".format(s)
        print(f"    {s}: " + ", ".join(f"{g} ×{n}" for g, n in counts.most_common()) + note)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("export", help=f"write {TODO.name} for the agent")
    a = sub.add_parser("apply", help="write the glosses from an answers file into the entry files")
    a.add_argument("answers", nargs="+")
    args = p.parse_args()
    {"export": export, "apply": apply}[args.cmd](args)


if __name__ == "__main__":
    main()
