"""Shared helpers for the temporary gloss tooling (issue #4). Deleted before the branch is merged."""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENTRIES = ROOT / "ingest" / "3-entries"
WORK = Path(__file__).resolve().parent / "work"
sys.path.insert(0, str(ROOT / "data"))
from build import ANY_LINK, GLOSS, TYPED_LINK, entry_slug, render_note, slugify  # noqa: E402,F401

# The 80 slugs that issue #4 sorted by hand as different words merged into one entry.
AMBIGUOUS = sorted(set("""
adobe aspen avatar bad battle beamer bm brassiere casino casualty chef chester clam cold-turkey
count ecu fast fat gift gin gonzo gross gypsy hackney handy heorot hobnob hostel juggernaut lego
lich lore magazine mark maroon meal meme meta muster narcissus ness ol orange panache petulant pig
pregnant punch rum ruth school sensible sleuth spell three-dog-night wap
a berliner bite coin con crayon dick diner donner dracula er est fare ian ing jolly long nike pal
people peter phoenix slut tag
""".split()))

ID = re.compile(r"([A-Za-z0-9_-]{11})#(\d+)")


def load_episodes():
    """{video_id: data} for every entry file."""
    return {f.stem: json.loads(f.read_text(encoding="utf-8")) for f in sorted(ENTRIES.glob("*.json"))}


def load_head(vid, ref="HEAD"):
    """The entry file as committed at ref, or None if it isn't there."""
    r = subprocess.run(["git", "show", f"{ref}:ingest/3-entries/{vid}.json"], cwd=ROOT,
                       capture_output=True, text=True, encoding="utf-8")
    return json.loads(r.stdout) if r.returncode == 0 else None


def save_episode(vid, data):
    """Write an entry file the way ingest/3-extract.sh does: one line, no trailing newline."""
    (ENTRIES / f"{vid}.json").write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")


def set_gloss(entry, gloss):
    """The entry with "gloss" right after "term", or without "gloss" if it is None."""
    out = {}
    for k, v in entry.items():
        if k == "gloss":
            continue
        out[k] = v
        if k == "term" and gloss:
            out["gloss"] = gloss
    return out


def name(entry):
    gloss = entry.get("gloss")
    return f"{entry['term']} ({gloss})" if gloss else entry["term"]


def describe(entry):
    """[language; orig. X; lit. 'Y'] for an export line."""
    bits = [entry.get("language") or "?"]
    if entry.get("original") and entry["original"] != entry["term"]:
        bits.append(f"orig. {entry['original']}")
    if entry.get("translation"):
        bits.append(f"lit. '{entry['translation']}'")
    return "[" + "; ".join(bits) + "]"


def plain(note):
    return render_note(note or "")[0]


def read_answers(paths):
    """{id: answer} from answer files ("<id> <answer>" per line; blank lines and # lines skipped).
    Exits with a message on malformed or repeated lines."""
    answers, errors = {}, []
    for path in paths:
        for n, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), 1):
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            key, _, answer = line.partition(" ")
            answer = answer.strip()
            if not answer:
                errors.append(f"{path}:{n}: no answer: {line}")
            elif key in answers:
                errors.append(f"{path}:{n}: {key} answered twice")
            else:
                answers[key] = answer
    if errors:
        sys.exit("\n".join(errors))
    return answers
