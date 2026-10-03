#!/usr/bin/env python3
"""Build the dataset the website reads from per-episode entry files and the manual edits.

Reads:
    ingest/3-entries/*.json  entries per episode (--entries to read another folder)
    data/review.json         approve/reject decisions made in the review tool (review/review.py)
    data/overrides.json      manual fixes, applied on every run

Writes:
    data/episodes.json       [{ id, title, date, duration }]
    data/entries.json        [{ slug, term, gloss?, original, translation, language, mentions: [...] }]
    data/duplicates.md       likely duplicates, for manual review (nothing is merged automatically)

Each entry file is one episode, whatever produced it (ingest/ writes them with Claude):

    {"video_id": "m9AaobtBMtA", "prompt_version": 4, "title": "...", "date": "2026-09-30",
     "duration": 2623, "entries": [{term, gloss?, original, translation, language, timestamp, role,
     note, confidence}]}

"gloss" (absent or null unless another word has the same spelling) tells homographs apart, like
a Wikipedia disambiguation suffix: a language (Gift, German), a meaning (meal, flour) or a kind
(Phoenix, city). An entry's slug is slugify(term + " " + gloss), or slugify(term) without one,
and entries.json has "gloss" only on entries that have one.

Each mention is {episode_id, t, role, note, links, confidence, verified?}:

    {"episode_id": "m9AaobtBMtA", "t": 978, "role": "subject", "note": "A doublet of cartouche...",
     "links": [{"type": "same-root", "uncertain": false, "target": "cartouche", "slug": "cartouche",
                "start": 13, "end": 22}],
     "confidence": "high"}

"role" is subject, aside or mention. Extracted notes mark links as [[type:target]]trail (letters
right after ]] are part of the link text), with a "?" after the type for an uncertain relation.
A link to a glossed entry gives the gloss in brackets, [[type:meal (flour)]], and shows only "meal".
"note" is plain text: each link is replaced by its text, and "start"/"end" give the link's position
in it, in UTF-16 code units (how JavaScript indexes strings), so the site never parses notes.
"links" lists a note's links in the order they appear; "slug" is the entry the target resolves to
(null if it isn't an entry), looked up after overrides: a target with a gloss is the slug of
the entry it names; other targets are looked up first among the entries mentioned in the same
episode, then any entry by term, then by original form. A link never resolves to the entry its
note belongs to.

Overrides (data/overrides.json) are a list of operations applied in order:

    {"op": "rename",    "slug": "beatles", "term": "The Beatles"}
    {"op": "rename",    "slug": "gift", "episode_id": "XXXXXXXXXXX", "term": "Gift", "new_slug": "gift-german"}
    {"op": "merge",     "from": "hot-dogs", "into": "hot-dog"}
    {"op": "delete",    "slug": "um"}
    {"op": "delete",    "slug": "fish", "episode_id": "XXXXXXXXXXX"}
    {"op": "timestamp", "slug": "break-a-leg", "episode_id": "XXXXXXXXXXX", "t": "00:12:03"}
    {"op": "set",       "slug": "ciao", "fields": {"language": "Italian", "original": "ciao"}}
    {"op": "distinct",  "slugs": ["latin", "latino"]}

"rename" changes the term, so the slug is rebuilt from it and the mention's gloss (or given with
"new_slug"); if the new slug already exists, the mentions join it. "set" changes entry fields
without touching the slug. "distinct" only removes a pair from the duplicates report. Keys
starting with "_" are ignored, so {"_comment": "..."} can be used anywhere as a comment.
"""
import argparse
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ROLES = ("subject", "aside", "mention")  # in order of precedence
LINK_TYPES = ("from", "gave", "same-root", "equivalent", "unrelated", "see")
ENTRY_FIELDS = ("term", "gloss", "original", "translation", "language")

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


def entry_slug(term, gloss=None):
    """The slug of an entry: its term, plus the gloss if it has one ("meal (flour)" -> meal-flour)."""
    return slugify(f"{term} {gloss}" if gloss else term)


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


def clean_str(value):
    if value is None:
        return None
    value = INVISIBLE.sub("", str(value)).strip()
    return value or None


ANY_LINK = re.compile(r"\[\[((?:(?!\[\[).)*?)\]\]")  # the innermost [[...]]; a target may contain "]"
TYPED_LINK = re.compile(r"([a-z-]+)(\?)?:([^|]+)")  # the inside of [[type:target]] or [[type?:target]]
GLOSS = re.compile(r"\s*\([^()]*\)$")  # the " (gloss)" at the end of a link target


def utf16_len(text):
    return len(text.encode("utf-16-le")) // 2


def render_note(note):
    """(plain text, links): the note with each [[...]] replaced by its text, and the links in order.

    A link shows its target, minus any " (gloss)", plus the letters straight after "]]" (its
    trail): [[see:meal (flour)]]s shows "meals". Each link records where its text is in the plain
    note ("start", "end", in UTF-16 code units); "slug" is left for resolve_links(). Malformed
    links (no type or target, or a |alias) become plain text.
    """
    parts, links, pos, last = [], [], 0, 0

    def add(text):
        nonlocal pos
        parts.append(text)
        pos += utf16_len(text)

    for m in ANY_LINK.finditer(note):
        add(note[last:m.start()])
        last = m.end()
        inner = m.group(1)
        typed = TYPED_LINK.fullmatch(inner)
        if not typed or not typed.group(3).strip():
            target, _, alias = inner.partition("|")
            add((alias or target).strip())
            continue
        # The trail is letters; Python's re has no \p{L}, and [^\W\d_] is a letter.
        trail = re.match(r"[^\W\d_]*", note[m.end():]).group(0)
        last += len(trail)
        link = {"type": typed.group(1), "uncertain": bool(typed.group(2)), "target": typed.group(3).strip()}
        text = GLOSS.sub("", link["target"]) + trail
        start = pos
        add(text)
        links.append({**link, "slug": None, "start": start, "end": pos})
    add(note[last:])
    return "".join(parts), links


def link_problems(note):
    """(problem, link) for each link in a note that is untyped, has an alias, no target or an unknown type."""
    found = []
    for m in ANY_LINK.finditer(note or ""):
        typed = TYPED_LINK.fullmatch(m.group(1))
        if not typed:
            found.append(("untyped link or |alias (shown as plain text)", m.group(0)))
        elif not typed.group(3).strip():
            found.append(("link without a target (shown as plain text)", m.group(0)))
        elif typed.group(1) not in LINK_TYPES:
            found.append((f"unknown link type '{typed.group(1)}'", m.group(0)))
    return found


def read_entry(raw, stamps=None, duration=None):
    """Clean and check one extracted entry. build.py and the review tool both use this.

    Returns (entry, problems). entry is None if it has no term; its "t" is None if the timestamp
    can't be read. problems is a list of (kind, detail): kind groups them in the summary, detail
    (possibly "") says which link or value. "note" is the plain text from render_note(), "markup"
    the note as extracted.
    """
    problems = []
    term = clean_str(raw.get("term"))
    if not term:
        return None, [("entry without a term (skipped)", "")]
    t = parse_timestamp(raw.get("timestamp"))
    if t is None:
        problems.append(("unreadable timestamp (skipped)", ""))
    elif duration and t > duration:
        problems.append(("timestamp after the end of the video", ""))
    elif stamps is not None and t not in stamps:
        problems.append(("timestamp not found in transcript (possibly invented)", ""))

    role = clean_str(raw.get("role"))
    role = role.lower() if role else None
    if not role:
        problems.append(("missing role", ""))
    elif role not in ROLES:
        problems.append((f"unknown role '{role}' (kept as is)", ""))

    markup = clean_str(raw.get("note")) or ""
    problems += link_problems(markup)
    note, links = render_note(markup)
    confidence = clean_str(raw.get("confidence"))
    return {
        "term": term, "gloss": clean_str(raw.get("gloss")), "original": clean_str(raw.get("original")),
        "translation": clean_str(raw.get("translation")),
        "language": clean_str(raw.get("language")), "t": t, "role": role,
        "note": note, "markup": markup, "links": links,
        "confidence": confidence if confidence in ("high", "low") else "low",
    }, problems


def review_key(video_id, term, gloss=None):
    """Key used by the review tool to store a decision about one extracted item."""
    return f"{video_id}/{entry_slug(term, gloss)}"


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
                for m in hits:
                    m["term"], m["slug"] = term, op.get("new_slug") or entry_slug(term, m["gloss"])
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


def role_rank(role):
    return ROLES.index(role) if role in ROLES else len(ROLES)


def dedupe(mentions):
    """(kept, dropped): one mention per entry and episode, the one with the highest role (the
    first on a tie). Run after overrides, which can give two mentions the same slug."""
    kept, dropped = {}, []
    for m in mentions:
        key = (m["slug"], m["episode_id"])
        other = kept.get(key)
        if other is None:
            kept[key] = m
        elif role_rank(m["role"]) < role_rank(other["role"]):
            kept[key] = m
            dropped.append(other)
        else:
            dropped.append(m)
    return list(kept.values()), dropped


def group(mentions, episodes):
    order = {vid: (ep["date"] or "", vid) for vid, ep in episodes.items()}
    by_slug = defaultdict(list)
    for m in sorted(mentions, key=lambda m: (order.get(m["episode_id"], ("", "")), m["t"])):
        by_slug[m["slug"]].append(m)

    entries, conflicts = [], []
    for slug in sorted(by_slug):
        ms = by_slug[slug]
        entry = {"slug": slug, **representative(ms)}
        if not entry["gloss"]:
            del entry["gloss"]
        languages = Counter(m["language"] for m in ms if m.get("language"))
        if len(languages) > 1:
            conflicts.append((slug, languages))
        entry["mentions"] = []
        for m in ms:
            mention = {"episode_id": m["episode_id"], "t": m["t"], "role": m["role"], "note": m["note"],
                       "links": m["links"], "confidence": m["confidence"]}
            if m.get("verified"):
                mention["verified"] = True
            entry["mentions"].append(mention)
        entries.append(entry)
    return entries, conflicts


def resolve_links(entries, mentions):
    """Set each link's "slug" to the entry its target names, or None. Run after overrides and grouping.

    A target with a gloss ("meal (flour)") resolves to the entry with that slug (meal-flour) or to
    nothing. Other targets are looked up by term and original form, the mention's as extracted
    as well as the entry's current ones, so links still resolve after an entry is renamed or
    merged into another. A link never resolves to its own entry.

    Returns (problem, mention, link) for links whose gloss names no entry, and for links that
    reached a glossed entry without naming its gloss (they may point at the wrong homograph).
    """
    by_slug = {e["slug"]: e for e in entries}
    in_episode, by_term, by_original = defaultdict(set), defaultdict(set), defaultdict(set)
    for e in entries:
        by_term[slugify(e["term"])].add(e["slug"])
        if e.get("original"):
            by_original[slugify(e["original"])].add(e["slug"])
    for m in mentions:
        e = by_slug.get(m["slug"])
        if not e:
            continue
        for term in (m["extracted_term"], m["term"]):
            by_term[slugify(term)].add(e["slug"])
        for original in (m["extracted_original"], m["original"]):
            if original:
                by_original[slugify(original)].add(e["slug"])
        for form in {m["extracted_term"], m["term"], m["extracted_original"], m["original"],
                     e["term"], e["original"]}:
            if form:
                in_episode[(m["episode_id"], slugify(form))].add(e["slug"])

    def pick(slugs, target, own):
        slugs = (slugs or set()) - {own}
        if not slugs:
            return None
        if target in slugs:
            return target
        return max(sorted(slugs), key=lambda s: len(by_slug[s]["mentions"]))

    found = []
    for m in mentions:
        for link in m["links"]:
            if not link["target"]:
                continue
            t, own = slugify(link["target"]), m["slug"]
            if GLOSS.search(link["target"]):
                link["slug"] = t if t in by_slug and t != own else None
                if t not in by_slug:
                    found.append(("link to a gloss that isn't an entry", m, link))
                continue
            link["slug"] = (pick(in_episode.get((m["episode_id"], t)), t, own) or pick(by_term.get(t), t, own)
                            or pick(by_original.get(t), t, own))
            if link["slug"] and by_slug[link["slug"]].get("gloss"):
                found.append(("link to a glossed entry without its gloss", m, link))
    return found


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
    by_slug = {e["slug"]: e for e in entries}

    def homographs(a, b):
        """Same term, different glosses: told apart on purpose (meal-flour, meal-repast)."""
        ea, eb = by_slug[a], by_slug[b]
        return fold(ea["term"]) == fold(eb["term"]) and fold(ea.get("gloss")) != fold(eb.get("gloss"))

    def add(a, b, reason):
        pair = tuple(sorted((a, b)))
        if a != b and pair not in ignored_pairs and pair not in found and not homographs(a, b):
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

    # One expression inside another ("cat out of the bag" in "let the cat out of the bag"): the
    # shorter one, at least 3 words long, is a run of consecutive words in the longer one.
    slugs = {e["slug"] for e in entries}
    for e in entries:
        words = e["slug"].split("-")
        for i in range(len(words)):
            for j in range(i + 3, len(words) + 1):
                part = "-".join(words[i:j])
                if j - i < len(words) and part in slugs:
                    add(part, e["slug"], "one expression contained in another")

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
        bits = [e["language"] or "?"]
        if e.get("original"):
            bits.append(f"original: {e['original']}")
        eps = sorted({m["episode_id"] for m in e["mentions"]})
        name = f"{e['term']} ({e['gloss']})" if e.get("gloss") else e["term"]
        return f"`{slug}` — **{name}** ({', '.join(bits)}; {len(eps)} episode(s))"

    lines = ["# Likely duplicates", "",
             "Generated by `data/build.py`. Nothing here was merged. For each pair, either add a",
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
                                                        s != entry_slug(by_slug[s]["term"], by_slug[s].get("gloss")),
                                                        len(s), s))
            lines += [f"- {describe(a)}", f"  {describe(b)}",
                      f"  - merge: `{json.dumps({'op': 'merge', 'from': drop, 'into': keep})}`",
                      f"  - keep apart: `{json.dumps({'op': 'distinct', 'slugs': [a, b]})}`", ""]
    if conflicts:
        lines += ["## Mentions that disagree on language", "",
                  "These mentions were grouped under one slug but give different languages.",
                  "The majority value is used; fix it with a `set` override, or split the entry",
                  "with a `rename` override limited to one `episode_id`.", ""]
        for slug, values in conflicts:
            detail = ", ".join(f"{v} ×{n}" for v, n in values.most_common())
            lines.append(f"- `{slug}` language: {detail}")
        lines.append("")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines), encoding="utf-8")


# ---------------------------------------------------------------------------


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--root", type=Path, default=ROOT, help="project directory (default: the one with this script)")
    p.add_argument("--entries", type=Path, help="folder of entry files (default: <root>/ingest/3-entries)")
    p.add_argument("-v", "--verbose", action="store_true", help="list every low-confidence mention")
    args = p.parse_args()
    root = args.root

    entries_dir = args.entries or root / "ingest" / "3-entries"
    review = load_json(root / "data" / "review.json", {})
    overrides = Overrides(load_json(root / "data" / "overrides.json", []))

    problems = defaultdict(list)
    episodes, mentions = {}, []
    versions = Counter()
    for f in sorted(entries_dir.glob("*.json")):
        data = load_json(f, None)
        versions[(data or {}).get("prompt_version")] += 1
        vid = (data or {}).get("video_id") or f.stem
        if vid != f.stem:
            problems["video_id differs from file name (file name used)"].append(f.name)
            vid = f.stem
        ep = {"id": vid, "title": (data or {}).get("title"), "date": (data or {}).get("date"),
              "duration": (data or {}).get("duration")}
        if not ep["title"]:
            problems["episode without a title (video ID used as title)"].append(vid)
            ep["title"] = vid
        if not ep["date"]:
            problems["episode without a date (listed last)"].append(vid)
        episodes[vid] = ep

        for raw in (data or {}).get("entries", []):
            entry, found = read_entry(raw, duration=ep["duration"])
            where = f"{vid} {raw.get('timestamp')} {clean_str(raw.get('term'))!r}"
            for kind, detail in found:
                problems[kind].append(f"{where} {detail}".rstrip())
            if entry is None or entry["t"] is None:
                continue
            decision = (review.get(review_key(vid, entry["term"], entry["gloss"])) or {}).get("status")
            if decision == "rejected":
                continue
            mentions.append({
                **entry, "slug": entry_slug(entry["term"], entry["gloss"]), "episode_id": vid,
                # As extracted, so links still resolve after overrides rename or merge the entry.
                "extracted_term": entry["term"], "extracted_original": entry["original"],
                "verified": decision == "approved", "where": where,
            })

    rejected = sum(1 for v in review.values() if v.get("status") == "rejected")
    mentions = overrides.apply_to_mentions(mentions)
    mentions, dropped = dedupe(mentions)
    for m in dropped:
        problems["same entry twice in one episode (highest role kept)"].append(f"{m['where']} -> {m['slug']}")
    entries, conflicts = group(mentions, episodes)
    overrides.apply_to_entries(entries)
    for kind, m, link in resolve_links(entries, mentions):
        problems[kind].append(f"{m['where']} [[{link['type']}:{link['target']}]] -> {link['slug']}")

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
    report = root / "data" / "duplicates.md"
    write_report(report, entries, duplicates, conflicts, episodes)

    # ---- summary
    all_mentions = [(e, m) for e in entries for m in e["mentions"]]
    low = [(e, m) for e, m in all_mentions if m["confidence"] == "low" and not m.get("verified")]
    verified = sum(1 for _, m in all_mentions if m.get("verified"))
    roles = Counter(m["role"] for _, m in all_mentions)
    links = [link for _, m in all_mentions for link in m["links"]]
    link_types = Counter(link["type"] for link in links)

    def counts(counter, label=str):
        return ", ".join(f"{label(k)} {v}" for k, v in counter.most_common())

    print(f"Files:     {sum(versions.values())}  ({counts(versions, lambda v: f'prompt_version {v}')})")
    print(f"Episodes:  {len(episode_list)}")
    print(f"Entries:   {len(entries)}")
    print(f"Mentions:  {len(all_mentions)}  ({verified} approved and {rejected} rejected in review)")
    print(f"Roles:     {counts(roles)}")
    print(f"Links:     {len(links)}  ({sum(1 for link in links if link['slug'])} resolve to an entry; "
          f"{counts(link_types)})")
    print(f"Low confidence, not yet reviewed: {len(low)}")
    for e, m in (low if args.verbose else low[:15]):
        print(f"    {m['episode_id']} {fmt_time(m['t'])}  {e['term']}")
    if len(low) > 15 and not args.verbose:
        print(f"    ... and {len(low) - 15} more (use -v, or review them with review/review.py)")
    print(f"Likely duplicates: {len(duplicates)} pairs, {len(conflicts)} language conflicts -> {report.relative_to(root)}")
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
