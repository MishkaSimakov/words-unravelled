#!/usr/bin/env python3
"""Temporary (issue #4): add glosses to links that point into a set of homographs.

    python3 transition/links.py export      # -> work/links-auto.txt, work/links-todo.txt
    python3 transition/links.py apply transition/work/links-auto.txt transition/work/links-answers.txt
    python3 transition/diff.py              # review the result against HEAD

export takes every link without a gloss whose target is spelled like a glossed entry. The ID is
<video_id>#<entry index>@<link index in the note>. Each link has candidates: the entries with
that spelling, written "term (gloss)", or "term" for the one without a gloss.
- If the episode has exactly one candidate (not counting the linking entry), the answer is
  written to links-auto.txt: its name, or "-" when it is the gloss-less word or an entry that
  only has the target as its original form.
- Every other link goes to links-todo.txt for the agent (instructions in links-prompt.md).

An answer is "<id> <term (gloss)>" to add that gloss to the link, or "<id> -" to leave the link
as it is (it then means the gloss-less word, or the entry whose original form it is).
apply rewrites [[type:Target]]trail as [[type:Target (gloss)]]trail, keeping the target's
spelling, so the note reads the same.
"""
import argparse
import sys
from collections import defaultdict

from common import (ANY_LINK, GLOSS, TYPED_LINK, WORK, describe, entry_slug, load_episodes,
                    name, plain, read_answers, save_episode, slugify)

AUTO = WORK / "links-auto.txt"
TODO = WORK / "links-todo.txt"


def scan(episodes):
    """[link]: every unglossed link whose target is spelled like a glossed entry, with candidates."""
    glossed = {slugify(e["term"]) for d in episodes.values() for e in d["entries"] if e.get("gloss")}
    # Every word with a glossed spelling: {term slug: {entry slug: name}}
    words = defaultdict(dict)
    for d in episodes.values():
        for e in d["entries"]:
            s = slugify(e["term"])
            if s in glossed:
                words[s].setdefault(entry_slug(e["term"], e.get("gloss")), name(e))

    links = []
    for vid, d in episodes.items():
        entries = d["entries"]
        for i, e in enumerate(entries):
            own = entry_slug(e["term"], e.get("gloss"))
            for k, m in enumerate(ANY_LINK.finditer(e.get("note") or "")):
                typed = TYPED_LINK.fullmatch(m.group(1))
                if not typed or not typed.group(3).strip():
                    continue
                target = typed.group(3).strip()
                s = slugify(target)
                if s not in glossed or GLOSS.search(target):
                    continue
                here = {}  # entry slug -> label, for the other entries of this episode
                for j, x in enumerate(entries):
                    xs = entry_slug(x["term"], x.get("gloss"))
                    if j == i or xs == own:
                        continue
                    if slugify(x["term"]) == s:
                        here[xs] = name(x)
                    elif x.get("original") and slugify(x["original"]) == s:
                        here[xs] = f"{name(x)}, original form {x['original']}"
                links.append({
                    "id": f"{vid}#{i}@{k}", "vid": vid, "i": i, "k": k, "entry": e, "target": target,
                    "type": typed.group(1) + (typed.group(2) or ""), "here": here,
                    "words": {xs: label for xs, label in words[s].items() if xs != own},
                    "title": d.get("title") or vid,
                })
    return links


def auto_answer(link):
    """The answer when the episode has exactly one candidate, else None."""
    if len(link["here"]) != 1:
        return None
    [(slug, label)] = link["here"].items()
    words = link["words"]
    return words[slug] if slug in words and "(" in words[slug] else "-"


def export(args):
    links = scan(load_episodes())
    auto, todo = [], []
    for link in links:
        answer = auto_answer(link)
        if answer is not None:
            auto.append(f"{link['id']} {answer}")
            continue
        e = link["entry"]
        note = e.get("note") or ""
        m = list(ANY_LINK.finditer(note))[link["k"]]
        marked = plain(note[:m.start()]) + "»" + m.group(0) + "«" + plain(note[m.end():])
        tag = lambda label: label if "(" in label else f"{label} [answer -]"  # noqa: E731
        here = "; ".join(map(tag, link["here"].values())) or "none"
        elsewhere = "; ".join(tag(label) for slug, label in link["words"].items() if slug not in link["here"])
        todo += [f"{link['id']}  in {name(e)} {describe(e)}  (ep: {link['title']})",
                 f"    note: {marked}",
                 f"    in this episode: {here}",
                 f"    elsewhere: {elsewhere or 'none'}", ""]
    WORK.mkdir(exist_ok=True)
    AUTO.write_text("\n".join(auto) + "\n", encoding="utf-8")
    TODO.write_text("\n".join(todo), encoding="utf-8")
    print(f"{len(links)} links: {len(auto)} decided by script -> {AUTO}, {len(links) - len(auto)} for the agent -> {TODO}")


def apply(args):
    episodes = load_episodes()
    links = {link["id"]: link for link in scan(episodes)}
    answers = read_answers(args.answers)

    errors = [f"{key}: not an exported link (already glossed, or the note changed?)"
              for key in sorted(answers.keys() - links.keys())]
    errors += [f"{key}: no answer" for key in sorted(links.keys() - answers.keys())]
    edits = defaultdict(dict)  # (vid, i) -> {k: gloss}
    for key, answer in answers.items():
        link = links.get(key)
        if not link or answer == "-":
            continue
        names = {label: slug for slug, label in link["words"].items()}
        if answer not in names or "(" not in answer:
            errors.append(f"{key}: {answer!r} is not one of {sorted(n for n in names if '(' in n)} or -")
            continue
        gloss = GLOSS.search(answer).group(0).strip()[1:-1]
        if slugify(f"{link['target']} {gloss}") != names[answer]:
            errors.append(f"{key}: {link['target']} ({gloss}) would not resolve to {names[answer]}")
            continue
        edits[(link["vid"], link["i"])][link["k"]] = gloss
    if errors:
        sys.exit("Nothing written.\n" + "\n".join(errors))

    for (vid, i), glosses in edits.items():
        e = episodes[vid]["entries"][i]
        note, out, last = e["note"], [], 0
        for k, m in enumerate(ANY_LINK.finditer(note)):
            if k in glosses:
                out += [note[last:m.end() - 2], f" ({glosses[k]})]]"]
                last = m.end()
        e["note"] = "".join(out) + note[last:]
    for vid in sorted({vid for vid, _ in edits}):
        save_episode(vid, episodes[vid])
    n = sum(len(g) for g in edits.values())
    print(f"Added a gloss to {n} links, left {len(answers) - n} as they are, "
          f"in {len({vid for vid, _ in edits})} files.")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("export", help="write the script's answers and the agent's todo list")
    a = sub.add_parser("apply", help="add the glosses from answer files to the links")
    a.add_argument("answers", nargs="+")
    args = p.parse_args()
    {"export": export, "apply": apply}[args.cmd](args)


if __name__ == "__main__":
    main()
