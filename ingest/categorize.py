#!/usr/bin/env python3
"""Temporary: give the entries in 3-entries/ a category, one claude call per episode.

Entries extracted before the prompt had categories have none. This sends each episode's entries
(term, gloss, original, translation, language, note) to `claude -p` with categorize-prompt.md,
which takes its rules from the "### Category" section of 3-extract-prompt.md, and writes the
category into each entry and the current PROMPT_VERSION of 3-extract.sh into the file.

    ingest/categorize.py                       # every episode with an entry without a category
    ingest/categorize.py -j 3 m9AaobtBMtA ...  # only some episodes, 3 at a time
    ingest/categorize.py --out /tmp/cats --model sonnet m9AaobtBMtA  # write copies elsewhere

Claude answers "17. term -> category" for every entry. An episode's answer is rejected, and its
file left unchanged, if a number is missing, repeated or unknown, a category is unknown, or a
term doesn't match the entry with that number (a sign the answers have shifted). Terms that
differ only slightly are reported but accepted. If a claude call fails (e.g. at the usage limit),
no new episodes are started.
"""
import argparse
import difflib
import json
import os
import re
import subprocess
import sys
import tempfile
import threading
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

INGEST = Path(__file__).resolve().parent
sys.path.insert(0, str(INGEST.parent / "data"))
from build import CATEGORIES, clean_str, render_note, slugify  # noqa: E402

LINE = re.compile(r"^\s*(\d+)\.\s+(.*?)\s*->\s*([a-z-]+)\s*$")
GLOSS = re.compile(r"\s*\[[^\]]*\]$")  # answers sometimes keep the gloss


def prompt():
    rules = re.search(r"^### Category\n(.*?)(?=^##)", (INGEST / "3-extract-prompt.md").read_text(encoding="utf-8"),
                      re.M | re.S).group(1).strip()
    return (INGEST / "categorize-prompt.md").read_text(encoding="utf-8").replace("{{CATEGORY_RULES}}", rules)


def prompt_version():
    return int(re.search(r"^PROMPT_VERSION=(\d+)", (INGEST / "3-extract.sh").read_text(encoding="utf-8"), re.M).group(1))


def describe(i, e):
    head = e["term"]
    if clean_str(e.get("gloss")):
        head += f" [{e['gloss']}]"
    extra = [f"{k}: {e[k]}" for k in ("original", "translation") if clean_str(e.get(k)) not in (None, e["term"])]
    if extra:
        head += f" ({'; '.join(extra)})"
    note, _ = render_note(clean_str(e.get("note")) or "")
    return f"{i}. {head} | {clean_str(e.get('language')) or '-'} | {note}"


def parse(output, entries):
    """(categories, warnings) for an answer, or raises ValueError saying why it is rejected."""
    found, seen, warnings, problems = {}, set(), [], []
    for line in output.splitlines():
        if not line.strip():
            continue
        m = LINE.match(line)
        if not m:
            problems.append(f"unreadable line: {line!r}")
            continue
        n, term, category = int(m.group(1)), GLOSS.sub("", m.group(2)), m.group(3)
        if not 1 <= n <= len(entries):
            problems.append(f"unknown number: {line!r}")
            continue
        if n in seen:
            problems.append(f"number given twice: {line!r}")
            continue
        seen.add(n)
        if category not in CATEGORIES:
            problems.append(f"unknown category: {line!r}")
        else:
            want, got = slugify(entries[n - 1]["term"]), slugify(term)
            if want != got:
                if difflib.SequenceMatcher(None, want, got).ratio() < 0.8:
                    problems.append(f"term doesn't match entry {n} ({entries[n - 1]['term']!r}): {line!r}")
                    continue
                warnings.append(f"entry {n} is {entries[n - 1]['term']!r}, answer says {term!r}")
            found[n] = category
    missing = [str(n) for n in range(1, len(entries) + 1) if n not in seen]
    if missing:
        problems.append(f"no answer for entries {', '.join(missing)}")
    if problems:
        raise ValueError("; ".join(problems))
    return [found[n] for n in range(1, len(entries) + 1)], warnings


def with_category(entry, category):
    out = {}
    for k, v in entry.items():
        if k != "category":
            out[k] = v
        if k == "language":
            out["category"] = category
    out.setdefault("category", category)
    return out


def needs_category(path):
    data = json.loads(path.read_text(encoding="utf-8"))
    return any(e.get("category") not in CATEGORIES for e in data["entries"])


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("ids", nargs="*", help="video IDs (default: every episode with an entry without a category)")
    p.add_argument("-j", type=int, default=5, help="episodes at a time (default 5)")
    p.add_argument("--model", default="claude-sonnet-5-5", help="(default: claude-sonnet-5-5)")
    p.add_argument("--effort", choices=("low", "medium", "high", "xhigh", "max"))
    p.add_argument("--out", type=Path, help="write the files here instead of over 3-entries/ (no skipping)")
    args = p.parse_args()

    src = INGEST / "3-entries"
    if args.ids:
        paths = []
        for vid in args.ids:
            if (src / f"{vid}.json").exists():
                paths.append(src / f"{vid}.json")
            else:
                print(f"No entry file for {vid}, skipped.", file=sys.stderr)
    else:
        paths = sorted(src.glob("*.json"))
    if not args.out:
        paths = [path for path in paths if needs_category(path)]
    if not paths:
        print("Nothing to do: every entry has a category.")
        return
    out_dir = args.out or src
    out_dir.mkdir(parents=True, exist_ok=True)
    system, version = prompt(), prompt_version()
    cmd = ["claude", "-p", "--model", args.model, "--tools", "", "--strict-mcp-config",
           "--disable-slash-commands", "--no-session-persistence", "--system-prompt", system]
    if args.effort:
        cmd += ["--effort", args.effort]
    raw_dir = Path(tempfile.mkdtemp(prefix="categorize-"))
    stop = threading.Event()
    lock = threading.Lock()
    totals, done, failed = Counter(), [], []

    def say(*lines):
        with lock:
            for line in lines:
                print(line, flush=True)

    def one(path):
        if stop.is_set():
            return
        vid = path.stem
        data = json.loads(path.read_text(encoding="utf-8"))
        entries = data["entries"]
        text = f"Episode: {data.get('title')}\n\n" + "\n".join(describe(i, e) for i, e in enumerate(entries, 1)) + "\n"
        r = subprocess.run(cmd, input=text, capture_output=True, text=True)
        (raw_dir / f"{vid}.txt").write_text(r.stdout + r.stderr, encoding="utf-8")
        if r.returncode != 0:
            stop.set()
            failed.append(vid)
            say(f"  {vid}: claude exited with status {r.returncode}; starting no new episodes",
                *(f"    {line}" for line in (r.stdout + r.stderr).strip().splitlines()[-5:]))
            return
        try:
            categories, warnings = parse(r.stdout, entries)
        except ValueError as e:
            failed.append(vid)
            say(f"  {vid}: answer rejected ({raw_dir / (vid + '.txt')}): {e}")
            return
        data["prompt_version"] = version
        data["entries"] = [with_category(e, c) for e, c in zip(entries, categories)]
        dst = out_dir / f"{vid}.json"
        dst.with_suffix(".json.part").write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        os.replace(dst.with_suffix(".json.part"), dst)
        counts = Counter(categories)
        with lock:
            totals.update(counts)
            done.append(vid)
        say(f"  {vid}: {len(entries)} entries ({', '.join(f'{k} {v}' for k, v in counts.most_common())})",
            *(f"    warning: {w}" for w in warnings))

    print(f"Categorizing {len(paths)} episode(s), {min(args.j, len(paths))} at a time; raw answers in {raw_dir}")
    with ThreadPoolExecutor(max_workers=max(1, args.j)) as pool:
        list(pool.map(one, paths))
    print(f"Done: {len(done)} episode(s), {sum(totals.values())} entries "
          f"({', '.join(f'{k} {v}' for k, v in totals.most_common())}).")
    skipped = len(paths) - len(done) - len(failed)
    if failed or skipped:
        print(f"Failed: {len(failed)} ({' '.join(failed)}); not started: {skipped}. Re-run to retry.")
        sys.exit(1)


if __name__ == "__main__":
    main()
