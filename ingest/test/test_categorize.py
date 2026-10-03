"""Tests for the temporary ingest/categorize.py, run against a fake claude.

    python3 -m unittest discover ingest/test
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

INGEST = Path(__file__).resolve().parent.parent
BUILD = INGEST.parent / "data" / "build.py"

# Answers "n. term -> word" for every numbered line on stdin. FAKE_SHIFT=1 answers each number
# with the next entry's term, as if the answers had shifted by one.
FAKE_CLAUDE = r'''#!/usr/bin/env python3
import os, re, sys
lines = [m.groups() for m in re.finditer(r"^(\d+)\. (.+?)(?: \[| \(| \|)", sys.stdin.read(), re.M)]
terms = [t for _, t in lines]
if os.environ.get("FAKE_SHIFT"):
    terms = terms[1:] + terms[:1]
for (n, _), t in zip(lines, terms):
    print(f"{n}. {t} -> {'name' if t[0].isupper() else 'word'}")
'''


class CategorizeTest(unittest.TestCase):
    def setUp(self):
        self.root = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.root)
        self.ingest = self.root / "ingest"
        (self.ingest / "3-entries").mkdir(parents=True)
        for name in ("categorize.py", "categorize-prompt.md", "3-extract-prompt.md", "3-extract.sh"):
            shutil.copy(INGEST / name, self.ingest)
        (self.root / "data").mkdir()
        (self.root / "data" / "build.py").symlink_to(BUILD)
        bin_dir = self.root / "bin"
        bin_dir.mkdir()
        (bin_dir / "claude").write_text(FAKE_CLAUDE, encoding="utf-8")
        (bin_dir / "claude").chmod(0o755)
        self.env = {**os.environ, "PATH": f"{bin_dir}:{os.environ['PATH']}"}
        self.file = self.ingest / "3-entries" / "aaaaaaaaaaa.json"
        entries = [{"term": t, "language": "English", "timestamp": "00:00:10", "role": "subject",
                    "note": "A [[see:thing]].", "confidence": "high"} for t in ("ocean", "Okeanos", "sea")]
        self.file.write_text(json.dumps({"video_id": "aaaaaaaaaaa", "prompt_version": 4, "title": "T",
                                         "entries": entries}), encoding="utf-8")

    def run_script(self, **env):
        return subprocess.run([sys.executable, str(self.ingest / "categorize.py")], env={**self.env, **env},
                              capture_output=True, text=True, timeout=30)

    def test_writes_categories_and_prompt_version(self):
        r = self.run_script()
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        data = json.loads(self.file.read_text(encoding="utf-8"))
        self.assertGreater(data["prompt_version"], 4)
        self.assertEqual([e["category"] for e in data["entries"]], ["word", "name", "word"])
        self.assertEqual(list(data["entries"][0])[:3], ["term", "language", "category"])
        self.assertIn("Nothing to do", self.run_script().stdout)

    def test_shifted_answers_are_rejected(self):
        before = self.file.read_text(encoding="utf-8")
        r = self.run_script(FAKE_SHIFT="1")
        self.assertEqual(r.returncode, 1)
        self.assertIn("term doesn't match entry 1", r.stdout)
        self.assertEqual(self.file.read_text(encoding="utf-8"), before)


if __name__ == "__main__":
    unittest.main()
