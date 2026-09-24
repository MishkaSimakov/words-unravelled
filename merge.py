#!/usr/bin/env python3
"""Merge per-episode extractions into the data files used by the website.

Reads:
    subs/*.info.json        episode metadata from yt-dlp (title, upload date, duration)
    extracted/*.json        entries extracted by Claude, one file per episode
    transcripts/*.txt       used only to check that timestamps really exist
    data/review.json        decisions made in the QA tool (qa/review.py)
    data/overrides.json     manual fixes, applied on every run

Writes:
    data/episodes.json      [{ id, title, date, duration }]
    data/entries.json       [{ slug, term, original, translation, type, language, mentions: [...] }]
    reports/duplicates.md   likely duplicates, for manual review (nothing is merged automatically)

Overrides (data/overrides.json) are a list of operations applied in order:

    {"op": "rename",    "slug": "beatles", "term": "The Beatles"}
    {"op": "rename",    "slug": "gift", "episode_id": "XXXXXXXXXXX", "term": "Gift", "new_slug": "gift-german"}
    {"op": "merge",     "from": "hot-dogs", "into": "hot-dog"}
    {"op": "delete",    "slug": "um"}
    {"op": "delete",    "slug": "fish", "episode_id": "XXXXXXXXXXX"}
    {"op": "timestamp", "slug": "break-a-leg", "episode_id": "XXXXXXXXXXX", "t": "00:12:03"}
    {"op": "set",       "slug": "ciao", "fields": {"language": "Italian", "original": "ciao"}}
    {"op": "distinct",  "slugs": ["latin", "latino"]}

"rename" changes the term, so the slug is rebuilt from it (or given with "new_slug"); if the
new slug already exists, the mentions join it. "set" changes entry fields without touching the
slug. "distinct" only removes a pair from the duplicates report. Keys starting with "_" are
ignored, so {"_comment": "..."} can be used anywhere as a comment.
"""
import argparse
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
KNOWN_TYPES = ("word", "idiom", "phrase", "name")
ENTRY_FIELDS = ("term", "original", "translation", "type", "language")
VIDEO_ID = re.compile(r"\[([A-Za-z0-9_-]{11})\]")

# ---------------------------------------------------------------------------
# Slugs


INVISIBLE = re.compile(r"[\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]")
UNFOLDABLE = str.maketrans({
    "ß": "ss", "æ": "ae", "œ": "oe", "ø": "o", "ł": "l", "đ": "d",
    "ð": "d", "þ": "th", "ı": "i", "&": " and ",
})


def slugify(term: str) -> str:
    """Lowercase, drop invisible characters, fold diacritics, spaces to hyphens."""
    s = INVISIBLE.sub("", term or "").lower().translate(UNFOLDABLE)
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"['’‘`´]", "", s)          # "don't" -> "dont", not "don-t"
    s = re.sub(r"[\W_]+", "-", s)           # anything else that isn't a letter or digit
    return s.strip("-") or "entry"


def fold(text):
    return slugify(text) if text else None


# ---------------------------------------------------------------------------
# Loading


def parse_timestamp(value):
    """'HH:MM:SS' or 'MM:SS' -> seconds, or None if it can't be parsed."""
    if isinstance(value, (int, float)):
        return int(value)
    m = re.fullmatch(r"\s*(?:(\d+):)?(\d{1,2}):(\d{2})\s*", str(value or ""))
    if not m:
        return None
    h, mnt, s = int(m.group(1) or 0), int(m.group(2)), int(m.group(3))
    return h * 3600 + mnt * 60 + s


def fmt_time(t):
    return f"{t // 3600:02}:{t % 3600 // 60:02}:{t % 60:02}"


def load_json(path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        sys.exit(f"error: {path} is not valid JSON ({e})")


def load_info(subs_dir):
    """video_id -> {id, title, date, duration} from yt-dlp .info.json files."""
    episodes = {}
    for f in sorted(subs_dir.glob("*.info.json")):
        info = load_json(f, {})
        vid = info.get("id")
        if not vid:
            m = list(VIDEO_ID.finditer(f.name))
            vid = m[-1].group(1) if m else None
        if not vid:
            continue
        d = str(info.get("upload_date") or "")
        episodes[vid] = {
            "id": vid,
            "title": info.get("title") or f.name,
            "date": f"{d[:4]}-{d[4:6]}-{d[6:8]}" if len(d) == 8 else None,
            "duration": int(info["duration"]) if info.get("duration") else None,
        }
    return episodes


def transcript_info(transcripts_dir, vid):
    """(title from the header, set of timestamps present) for a transcript, if it exists."""
    f = transcripts_dir / f"{vid}.txt"
    if not f.exists():
        return None, None
    title, stamps = None, set()
    for line in f.read_text(encoding="utf-8").splitlines():
        if line.startswith("# title:"):
            title = line.split(":", 1)[1].strip()
        m = re.match(r"\[(\d\d:\d\d:\d\d)\]", line)
        if m:
            stamps.add(parse_timestamp(m.group(1)))
    return title, stamps


def clean_str(value):
    if value is None:
        return None
    value = INVISIBLE.sub("", str(value)).strip()
    return value or None


def review_key(video_id, term):
    """Key used by the QA tool to store a decision about one extracted item."""
    return f"{video_id}/{slugify(term)}"


# ---------------------------------------------------------------------------
# Overrides


class Overrides:
    def __init__(self, ops):
        if not isinstance(ops, list):
            sys.exit("error: data/overrides.json must be a JSON list of operations")
        self.ops = ops
        self.warnings = []

    def warn(self, i, op, msg):
        self.warnings.append(f"override #{i} {json.dumps(op, ensure_ascii=False)}: {msg}")

    def apply_to_mentions(self, mentions):
        """rename / merge / delete / timestamp, in file order."""
        for i, op in enumerate(self.ops):
            kind = op.get("op")
            if kind in ("set", "distinct") or all(k.startswith("_") for k in op):
                continue  # entry-level ops come later; objects with only "_" keys are comments
            if kind == "rename":
                hits = self._select(mentions, op.get("slug"), op.get("episode_id"))
                term = clean_str(op.get("term"))
                if not term:
                    self.warn(i, op, "missing 'term'")
                    continue
                new_slug = op.get("new_slug") or slugify(term)
                for m in hits:
                    m["term"], m["slug"] = term, new_slug
            elif kind == "merge":
                src, dst = op.get("from"), op.get("into")
                hits = self._select(mentions, src)
                target = [m for m in mentions if m["slug"] == dst]
                if not target:
                    self.warn(i, op, f"target '{dst}' does not exist; the entry is only renamed")
                fields = representative(target) if target else {}
                for m in hits:
                    m["slug"] = dst
                    m.update(fields)
            elif kind == "delete":
                hits = self._select(mentions, op.get("slug"), op.get("episode_id"))
                ids = {id(m) for m in hits}
                mentions[:] = [m for m in mentions if id(m) not in ids]
            elif kind == "timestamp":
                hits = self._select(mentions, op.get("slug"), op.get("episode_id"))
                t = parse_timestamp(op.get("t"))
                if t is None or not op.get("episode_id"):
                    self.warn(i, op, "needs 'episode_id' and 't' as HH:MM:SS")
                    continue
                for m in hits:
                    m["t"] = t
            else:
                self.warn(i, op, f"unknown op '{kind}'")
                continue
            if not hits:
                self.warn(i, op, "matched nothing (stale override?)")
        return mentions

    def apply_to_entries(self, entries):
        by_slug = {e["slug"]: e for e in entries}
        for i, op in enumerate(self.ops):
            if op.get("op") != "set":
                continue
            e = by_slug.get(op.get("slug"))
            if not e:
                self.warn(i, op, "matched nothing (stale override?)")
                continue
            for k, v in (op.get("fields") or {}).items():
                if k in ENTRY_FIELDS:
                    e[k] = v
                else:
                    self.warn(i, op, f"unknown field '{k}'")

    def distinct_pairs(self):
        pairs = set()
        for op in self.ops:
            if op.get("op") == "distinct":
                slugs = sorted(op.get("slugs") or [])
                pairs.update((a, b) for a in slugs for b in slugs if a < b)
        return pairs

    @staticmethod
    def _select(mentions, slug, episode_id=None):
        return [m for m in mentions
                if m["slug"] == slug and (episode_id is None or m["episode_id"] == episode_id)]


# ---------------------------------------------------------------------------
# Grouping


def vote(mentions, field):
    """Most common non-null value; ties go to the earliest mention."""
    values = [m[field] for m in mentions if m.get(field)]
    if not values:
        return None
    counts = Counter(values)
    best = max(counts.values())
    return next(v for v in values if counts[v] == best)


def representative(mentions):
    return {f: vote(mentions, f) for f in ENTRY_FIELDS}


def group(mentions, episodes):
    order = {vid: (ep["date"] or "", vid) for vid, ep in episodes.items()}
    by_slug = defaultdict(list)
    for m in sorted(mentions, key=lambda m: (order.get(m["episode_id"], ("", "")), m["t"])):
        by_slug[m["slug"]].append(m)

    entries, conflicts = [], []
    for slug in sorted(by_slug):
        ms = by_slug[slug]
        entry = {"slug": slug, **representative(ms)}
        for f in ("language", "type"):
            values = Counter(m[f] for m in ms if m.get(f))
            if len(values) > 1:
                conflicts.append((slug, f, values))
        entry["mentions"] = []
        for m in ms:
            mention = {"episode_id": m["episode_id"], "t": m["t"], "note": m["note"],
                       "confidence": m["confidence"]}
            if m.get("verified"):
                mention["verified"] = True
            entry["mentions"].append(mention)
        entries.append(entry)
    return entries, conflicts


# ---------------------------------------------------------------------------
# Duplicate detection (report only, never merges)

LEADING = ("to-", "a-", "an-", "the-")


def core(slug):
    for p in LEADING:
        if slug.startswith(p) and len(slug) > len(p):
            return slug[len(p):]
    return slug


def singular(word):
    if len(word) > 4 and word.endswith("ies"):
        return word[:-3] + "y"
    if len(word) > 4 and word.endswith("es") and word[:-2].endswith(("s", "x", "z", "ch", "sh")):
        return word[:-2]
    if len(word) > 3 and word.endswith("s") and not word.endswith(("ss", "us", "is")):
        return word[:-1]
    return word


def singular_phrase(slug):
    parts = slug.split("-")
    return "-".join(parts[:-1] + [singular(parts[-1])])


def within_distance(a, b, limit):
    """True if the Levenshtein distance between a and b is <= limit."""
    if abs(len(a) - len(b)) > limit:
        return False
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        if min(cur) > limit:
            return False
        prev = cur
    return prev[-1] <= limit


def find_duplicates(entries, ignored_pairs):
    found = {}  # (a, b) -> reason

    def add(a, b, reason):
        pair = tuple(sorted((a, b)))
        if a != b and pair not in ignored_pairs and pair not in found:
            found[pair] = reason

    def buckets(keyfunc, reason):
        groups = defaultdict(set)
        for e in entries:
            groups[keyfunc(e["slug"])].add(e["slug"])
        for slugs in groups.values():
            slugs = sorted(slugs)
            for i, a in enumerate(slugs):
                for b in slugs[i + 1:]:
                    add(a, b, reason)

    buckets(lambda s: core(s).replace("-", ""), "article, spacing or hyphen variant")
    buckets(lambda s: singular_phrase(core(s)).replace("-", ""), "plural / singular")

    # Spelling variants: small edit distance, compared within the same first letter.
    by_letter = defaultdict(list)
    for e in entries:
        c = core(e["slug"]).replace("-", "")
        if len(c) >= 5:
            by_letter[c[0]].append((c, e["slug"]))
    for items in by_letter.values():
        for i, (ca, a) in enumerate(items):
            for cb, b in items[i + 1:]:
                limit = 2 if min(len(ca), len(cb)) >= 9 else 1
                if within_distance(ca, cb, limit):
                    add(a, b, "spelling variant")

    # The same thing in different languages: one entry's term is another's original form.
    forms = defaultdict(set)
    for e in entries:
        for f in ("term", "original", "translation"):
            if e.get(f):
                forms[core(fold(e[f]))].add(e["slug"])
    for slugs in forms.values():
        slugs = sorted(slugs)
        for i, a in enumerate(slugs):
            for b in slugs[i + 1:]:
                add(a, b, "same term in another form or language")
    return found


def write_report(path, entries, duplicates, conflicts, episodes):
    by_slug = {e["slug"]: e for e in entries}

    def describe(slug):
        e = by_slug[slug]
        bits = [e["type"] or "?", e["language"] or "?"]
        if e.get("original"):
            bits.append(f"original: {e['original']}")
        eps = sorted({m["episode_id"] for m in e["mentions"]})
        return f"`{slug}` — **{e['term']}** ({', '.join(bits)}; {len(eps)} episode(s))"

    lines = ["# Likely duplicates", "",
             "Generated by `merge.py`. Nothing here was merged. For each pair, either add a",
             "`merge` override to `data/overrides.json`, or a `distinct` override to hide it.", ""]
    if not duplicates:
        lines.append("_No likely duplicates found._")
    by_reason = defaultdict(list)
    for pair, reason in sorted(duplicates.items()):
        by_reason[reason].append(pair)
    for reason, pairs in by_reason.items():
        lines += [f"## {reason.capitalize()} ({len(pairs)})", ""]
        for a, b in pairs:
            keep, drop = sorted((a, b), key=lambda s: (-len(by_slug[s]["mentions"]),
                                                        s != slugify(by_slug[s]["term"]), len(s), s))
            lines += [f"- {describe(a)}", f"  {describe(b)}",
                      f"  - merge: `{json.dumps({'op': 'merge', 'from': drop, 'into': keep})}`",
                      f"  - keep apart: `{json.dumps({'op': 'distinct', 'slugs': [a, b]})}`", ""]
    if conflicts:
        lines += ["## Mentions that disagree on language or type", "",
                  "These mentions were grouped under one slug but were classified differently.",
                  "The majority value is used; fix it with a `set` override, or split the entry",
                  "with a `rename` override limited to one `episode_id`.", ""]
        for slug, field, values in conflicts:
            detail = ", ".join(f"{v} ×{n}" for v, n in values.most_common())
            lines.append(f"- `{slug}` {field}: {detail}")
        lines.append("")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines), encoding="utf-8")


# ---------------------------------------------------------------------------


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--root", type=Path, default=ROOT, help="project directory (default: this script's)")
    p.add_argument("-v", "--verbose", action="store_true", help="list every low-confidence mention")
    args = p.parse_args()
    root = args.root

    info = load_info(root / "subs")
    review = load_json(root / "data" / "review.json", {})
    overrides = Overrides(load_json(root / "data" / "overrides.json", []))

    problems = defaultdict(list)
    episodes, mentions = {}, []
    for f in sorted((root / "extracted").glob("*.json")):
        data = load_json(f, None)
        vid = (data or {}).get("video_id") or f.stem
        if vid != f.stem:
            problems["video_id differs from file name (file name used)"].append(f.name)
            vid = f.stem
        title, stamps = transcript_info(root / "transcripts", vid)
        ep = info.get(vid)
        if not ep:
            problems["no .info.json (title from transcript, no date)"].append(vid)
            ep = {"id": vid, "title": title or vid, "date": None, "duration": None}
        episodes[vid] = ep

        seen = set()
        for raw in (data or {}).get("entries", []):
            term = clean_str(raw.get("term"))
            where = f"{vid} {raw.get('timestamp')} {term!r}"
            if not term:
                problems["entry without a term (skipped)"].append(where)
                continue
            t = parse_timestamp(raw.get("timestamp"))
            if t is None:
                problems["unreadable timestamp (skipped)"].append(where)
                continue
            if ep["duration"] and t > ep["duration"]:
                problems["timestamp after the end of the video"].append(where)
            elif stamps is not None and t not in stamps:
                problems["timestamp not found in transcript (possibly invented)"].append(where)

            decision = (review.get(review_key(vid, term)) or {}).get("status")
            if decision == "rejected":
                continue
            slug = slugify(term)
            if slug in seen:
                problems["same entry twice in one episode (first kept)"].append(where)
                continue
            seen.add(slug)

            typ = clean_str(raw.get("type"))
            typ = typ.lower() if typ else None
            if typ not in KNOWN_TYPES:
                problems[f"NEW TYPE '{typ}' (kept as is, not remapped)"].append(where)
            confidence = clean_str(raw.get("confidence")) or "low"
            mentions.append({
                "slug": slug, "term": term,
                "original": clean_str(raw.get("original")),
                "translation": clean_str(raw.get("translation")),
                "type": typ, "language": clean_str(raw.get("language")),
                "episode_id": vid, "t": t, "note": clean_str(raw.get("note")) or "",
                "confidence": confidence if confidence in ("high", "low") else "low",
                "verified": decision == "approved",
            })

    for vid in sorted(set(info) - set(episodes)):
        problems["downloaded but not extracted yet"].append(f"{vid} {info[vid]['title']}")

    rejected = sum(1 for v in review.values() if v.get("status") == "rejected")
    mentions = overrides.apply_to_mentions(mentions)
    entries, conflicts = group(mentions, episodes)
    overrides.apply_to_entries(entries)

    # Only episodes that still have entries are published.
    used = {m["episode_id"] for e in entries for m in e["mentions"]}
    episode_list = sorted((ep for vid, ep in episodes.items() if vid in used),
                          key=lambda ep: (ep["date"] or "", ep["id"]), reverse=True)

    out = root / "data"
    out.mkdir(exist_ok=True)
    (out / "episodes.json").write_text(json.dumps(episode_list, ensure_ascii=False, indent=1) + "\n",
                                       encoding="utf-8")
    (out / "entries.json").write_text(json.dumps(entries, ensure_ascii=False, indent=1) + "\n",
                                      encoding="utf-8")

    duplicates = find_duplicates(entries, overrides.distinct_pairs())
    report = root / "reports" / "duplicates.md"
    write_report(report, entries, duplicates, conflicts, episodes)

    # ---- summary
    all_mentions = [(e, m) for e in entries for m in e["mentions"]]
    low = [(e, m) for e, m in all_mentions if m["confidence"] == "low" and not m.get("verified")]
    verified = sum(1 for _, m in all_mentions if m.get("verified"))
    types = Counter(e["type"] for e in entries)
    print(f"Episodes:  {len(episode_list)}")
    print(f"Entries:   {len(entries)}  ({', '.join(f'{k} {v}' for k, v in types.most_common())})")
    print(f"Mentions:  {len(all_mentions)}  ({verified} approved in QA, {rejected} rejected in QA)")
    print(f"Low confidence, not yet reviewed: {len(low)}")
    for e, m in (low if args.verbose else low[:15]):
        print(f"    {m['episode_id']} {fmt_time(m['t'])}  {e['term']}")
    if len(low) > 15 and not args.verbose:
        print(f"    ... and {len(low) - 15} more (use -v, or review them with qa/review.py)")
    print(f"Likely duplicates: {len(duplicates)} pairs, {len(conflicts)} field conflicts -> {report.relative_to(root)}")
    for kind, items in problems.items():
        print(f"\n{kind}: {len(items)}")
        for item in items[:10]:
            print(f"    {item}")
        if len(items) > 10:
            print(f"    ... and {len(items) - 10} more")
    if overrides.warnings:
        print("\nOverride warnings:")
        for w in overrides.warnings:
            print(f"    {w}")


if __name__ == "__main__":
    main()
