"""Tests for data/build.py.

    python3 -m unittest discover data/test
"""
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(DATA))
from build import link_problems, render_note  # noqa: E402


def entry(term, timestamp, role="subject", note=""):
    return {"term": term, "timestamp": timestamp, "role": role, "note": note, "confidence": "high"}


class BuildTest(unittest.TestCase):
    """Runs build.py on a temporary project."""

    def setUp(self):
        self.root = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.root)
        (self.root / "data").mkdir()
        self.entries = self.root / "ingest" / "3-entries"
        self.entries.mkdir(parents=True)

    def episode(self, vid, entries, title="Title", date="2026-09-30"):
        data = {"video_id": vid, "prompt_version": 4, "title": title, "date": date, "duration": 600,
                "entries": entries}
        (self.entries / f"{vid}.json").write_text(json.dumps(data), encoding="utf-8")

    def overrides(self, ops):
        (self.root / "data" / "overrides.json").write_text(json.dumps(ops), encoding="utf-8")

    def build(self):
        r = subprocess.run([sys.executable, str(DATA / "build.py"), "--root", str(self.root)],
                           capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)
        return r.stdout

    def built(self, name):
        return json.loads((self.root / "data" / name).read_text(encoding="utf-8"))

    def test_same_entry_twice_in_an_episode(self):
        self.episode("aaaaaaaaaaa", [entry("hot dog", "00:00:10", "aside"), entry("hot dog", "00:00:20")])
        out = self.build()
        [e] = self.built("entries.json")
        self.assertEqual([(m["t"], m["role"]) for m in e["mentions"]], [(20, "subject")])
        self.assertIn("same entry twice in one episode", out)

    def test_same_entry_twice_after_a_merge(self):
        self.episode("aaaaaaaaaaa", [entry("hot dogs", "00:00:10", "aside"), entry("hot dog", "00:00:20")])
        self.overrides([{"op": "merge", "from": "hot-dogs", "into": "hot-dog"}])
        out = self.build()
        [e] = self.built("entries.json")
        self.assertEqual(e["slug"], "hot-dog")
        self.assertEqual([(m["t"], m["role"]) for m in e["mentions"]], [(20, "subject")])
        self.assertIn("same entry twice in one episode", out)

    def test_same_entry_twice_after_a_rename(self):
        self.episode("aaaaaaaaaaa", [entry("frankfurter", "00:00:10"), entry("hot dog", "00:00:20", "mention")])
        self.overrides([{"op": "rename", "slug": "frankfurter", "term": "hot dog"}])
        self.build()
        [e] = self.built("entries.json")
        self.assertEqual([(m["t"], m["role"]) for m in e["mentions"]], [(10, "subject")])

    def test_same_entry_in_two_episodes(self):
        self.episode("aaaaaaaaaaa", [entry("hot dog", "00:00:10")])
        self.episode("bbbbbbbbbbb", [entry("hot dog", "00:00:20")])
        out = self.build()
        [e] = self.built("entries.json")
        self.assertEqual(len(e["mentions"]), 2)
        self.assertNotIn("same entry twice", out)

    def test_episode_without_a_date(self):
        self.episode("aaaaaaaaaaa", [entry("fish", "00:00:10")], title="Fish", date=None)
        out = self.build()
        self.assertEqual(self.built("episodes.json")[0]["title"], "Fish")
        self.assertIn("episode without a date", out)
        self.assertNotIn("video ID used as title", out)

    def test_episode_without_a_title(self):
        self.episode("aaaaaaaaaaa", [entry("fish", "00:00:10")], title=None)
        out = self.build()
        self.assertEqual(self.built("episodes.json")[0]["title"], "aaaaaaaaaaa")
        self.assertIn("video ID used as title", out)
        self.assertNotIn("episode without a date", out)


class NoteTest(unittest.TestCase):
    def test_link(self):
        note, links = render_note("From [[from:Okeanos]]'s river and [[same-root?:cart]]ouche.")
        self.assertEqual(note, "From Okeanos's river and cartouche.")
        self.assertEqual([(l["type"], l["uncertain"], l["target"], l["start"], l["end"]) for l in links],
                         [("from", False, "Okeanos", 5, 12), ("same-root", True, "cart", 25, 34)])
        self.assertEqual(link_problems("[[from:Okeanos]]"), [])

    def test_untyped_link_and_alias(self):
        self.assertEqual(render_note("a [[b]] [[see:c|d]]"), ("a b d", []))
        self.assertEqual(len(link_problems("a [[b]] [[see:c|d]]")), 2)

    def test_target_with_brackets(self):
        note, links = render_note("cf. [[see:a [b] c]] d")
        self.assertEqual(note, "cf. a [b] c d")
        self.assertEqual([l["target"] for l in links], ["a [b] c"])
        self.assertEqual(link_problems("cf. [[see:a [b] c]] d"), [])

    def test_link_without_a_target(self):
        note, links = render_note("x [[see: ]]y z")
        self.assertEqual(links, [])
        self.assertNotIn("[[", note)
        self.assertEqual(len(link_problems("x [[see: ]]y z")), 1)

    def test_stray_brackets_before_a_link(self):
        note, links = render_note("a [[ b [[see:c]]")
        self.assertEqual([l["target"] for l in links], ["c"])

    def test_unknown_type(self):
        [(kind, _)] = link_problems("[[cognate:x]]")
        self.assertIn("unknown link type 'cognate'", kind)


if __name__ == "__main__":
    unittest.main()
