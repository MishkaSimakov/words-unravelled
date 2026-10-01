"""Tests for ingest/3-extract.sh, run against a mock claude (mocks/claude).

    python3 -m unittest discover ingest/test

Each test copies the script into a temporary project (ingest/ with transcripts and metadata,
data/build.py) and puts the mocks first on PATH, so the real claude is never called.
"""
import json
import os
import shutil
import signal
import subprocess
import tempfile
import time
import unittest
from pathlib import Path

INGEST = Path(__file__).resolve().parent.parent
MOCKS = Path(__file__).resolve().parent / "mocks"
BUILD = INGEST.parent / "data" / "build.py"


class ExtractTest(unittest.TestCase):
    def setUp(self):
        self.root = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.root)
        self.ingest = self.root / "ingest"
        for d in ("2-transcripts", "1-youtube", "3-entries"):
            (self.ingest / d).mkdir(parents=True)
        shutil.copy(INGEST / "3-extract.sh", self.ingest)
        (self.ingest / "3-extract-prompt.md").write_text("PROMPT", encoding="utf-8")
        (self.root / "data").mkdir()
        (self.root / "data" / "build.py").symlink_to(BUILD)
        self.bin = self.root / "bin"
        self.bin.mkdir()
        shutil.copy(MOCKS / "claude", self.bin)
        self.mock = self.root / "mock"
        self.mock.mkdir()
        self.env = {**os.environ, "PATH": f"{self.bin}:{os.environ['PATH']}", "MOCK_DIR": str(self.mock)}
        self.env.pop("EXTRACT_DIR", None)

    # ---- helpers

    def episode(self, vid, lines=("[00:00:00] hello",), title="Title", info=True, **mock):
        """A transcript for vid, its metadata in 1-youtube/ (unless info=False), and what the
        mock claude does for it (see mocks/claude)."""
        text = f"# video_id: {vid}\n# title: {title} (transcript)\n\n" + "\n".join(lines) + "\n"
        (self.ingest / "2-transcripts" / f"{vid}.txt").write_text(text, encoding="utf-8")
        if info:
            meta = {"title": title, "upload_date": "20260930", "duration": 600}
            (self.ingest / "1-youtube" / f"{title} [{vid}].info.json").write_text(json.dumps(meta), encoding="utf-8")
        if mock:
            (self.mock / f"{vid}.json").write_text(json.dumps(mock), encoding="utf-8")

    def run_script(self, *args, timeout=30):
        return subprocess.run([str(self.ingest / "3-extract.sh"), *args], env=self.env, cwd=self.root,
                              capture_output=True, text=True, timeout=timeout)

    def start_script(self, *args):
        # A session of its own, so SIGINT to its process group is what Ctrl-C would do.
        return subprocess.Popen([str(self.ingest / "3-extract.sh"), *args], env=self.env, cwd=self.root,
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
                                start_new_session=True)

    def log(self):
        f = self.mock / "log"
        return f.read_text(encoding="utf-8").splitlines() if f.exists() else []

    def wait_for_log(self, line, timeout=10):
        deadline = time.monotonic() + timeout
        while line not in self.log():
            if time.monotonic() > deadline:
                self.fail(f"mock claude never logged {line!r}; log: {self.log()}")
            time.sleep(0.05)

    def output(self, vid):
        return json.loads((self.ingest / "3-entries" / f"{vid}.json").read_text(encoding="utf-8"))

    def entries_files(self):
        return sorted(f.name for f in (self.ingest / "3-entries").iterdir())

    # ---- basic behaviour

    def test_extracts_and_stamps_metadata(self):
        self.episode("aaaaaaaaaaa", title="Fish")
        r = self.run_script()
        self.assertEqual(r.returncode, 0, r.stderr)
        out = self.output("aaaaaaaaaaa")
        self.assertEqual(out["video_id"], "aaaaaaaaaaa")
        self.assertEqual(out["title"], "Fish")
        self.assertEqual(out["date"], "2026-09-30")
        self.assertEqual(out["duration"], 600)
        self.assertIsInstance(out["prompt_version"], int)
        self.assertEqual([e["term"] for e in out["entries"]], ["word"])
        self.assertEqual(self.entries_files(), ["aaaaaaaaaaa.json"])

    def test_title_from_transcript_without_metadata(self):
        self.episode("aaaaaaaaaaa", title="Fish", info=False)
        r = self.run_script()
        self.assertEqual(r.returncode, 0, r.stderr)
        out = self.output("aaaaaaaaaaa")
        self.assertEqual(out["title"], "Fish (transcript)")
        self.assertIsNone(out["date"])

    def test_skips_episodes_already_extracted(self):
        self.episode("aaaaaaaaaaa")
        self.assertEqual(self.run_script().returncode, 0)
        r = self.run_script()
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("Nothing to extract", r.stdout)
        self.assertEqual(self.log(), ["start aaaaaaaaaaa", "end aaaaaaaaaaa"])

    def test_strips_code_fences(self):
        self.episode("aaaaaaaaaaa", stdout='```json\n{"entries": []}\n```\n')
        r = self.run_script()
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(self.output("aaaaaaaaaaa")["entries"], [])

    def test_keeps_invalid_output(self):
        self.episode("aaaaaaaaaaa", stdout="not JSON")
        r = self.run_script()
        self.assertEqual(r.returncode, 1)
        self.assertIn("invalid JSON for aaaaaaaaaaa", r.stderr)
        self.assertEqual(self.entries_files(), ["aaaaaaaaaaa.json.tmp"])

    def test_failed_call_starts_no_new_episodes(self):
        self.episode("aaaaaaaaaaa", exit=1, stdout="You've hit your session limit")
        self.episode("bbbbbbbbbbb")
        r = self.run_script("-j", "1")
        self.assertEqual(r.returncode, 1)
        self.assertIn("session limit", r.stderr)
        self.assertEqual(self.log(), ["start aaaaaaaaaaa", "end aaaaaaaaaaa"])
        self.assertEqual(self.entries_files(), [])

    def test_failed_call_keeps_output_of_running_calls(self):
        self.episode("aaaaaaaaaaa", sleep=0.5, exit=1)
        self.episode("bbbbbbbbbbb", sleep=1.5)
        self.episode("ccccccccccc")
        r = self.run_script("-j", "2")
        self.assertEqual(r.returncode, 1)
        self.assertEqual(self.entries_files(), ["bbbbbbbbbbb.json"])
        self.assertNotIn("start ccccccccccc", self.log())

    # ---- arguments

    def test_dash_j_with_separate_count(self):
        for vid in ("aaaaaaaaaaa", "bbbbbbbbbbb", "ccccccccccc"):
            self.episode(vid)
        r = self.run_script("-j", "2")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("2 at a time", r.stdout)

    def test_bad_worker_count(self):
        self.assertEqual(self.run_script("-j", "0").returncode, 2)
        self.assertEqual(self.run_script("-j").returncode, 2)

    def test_video_ids_starting_with_dash(self):
        self.episode("-54FiJ0PsXo")
        r = self.run_script("-54FiJ0PsXo")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(self.output("-54FiJ0PsXo")["video_id"], "-54FiJ0PsXo")

    def test_video_id_starting_with_dash_j(self):
        # Every argument but -j is a video ID, even one that starts with "-j".
        self.episode("-jAbCdEfGhI")
        r = self.run_script("-jAbCdEfGhI")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(self.output("-jAbCdEfGhI")["video_id"], "-jAbCdEfGhI")

    def test_unknown_video_id(self):
        self.episode("aaaaaaaaaaa")
        r = self.run_script("zzzzzzzzzzz", "aaaaaaaaaaa")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("No transcript for zzzzzzzzzzz", r.stderr)
        self.assertEqual(self.entries_files(), ["aaaaaaaaaaa.json"])

    # ---- timestamp check

    def test_timestamp_check_parses_timestamps(self):
        # 16:18, 0:16:18 and 978 all name the transcript line [00:16:18]; only 00:16:19 doesn't exist.
        entries = [{"term": t, "timestamp": t} for t in ("00:16:18", "16:18", "0:16:18")]
        entries += [{"term": "seconds", "timestamp": 978}, {"term": "invented", "timestamp": "00:16:19"}]
        self.episode("aaaaaaaaaaa", lines=["[00:16:18] hello"], entries=entries)
        r = self.run_script()
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("1 timestamp(s) not in the transcript for aaaaaaaaaaa: invented (00:16:19)", r.stderr)

    # ---- Ctrl-C

    def test_interrupt_discards_unfinished_output(self):
        self.episode("aaaaaaaaaaa", sleep=30)
        p = self.start_script()
        self.wait_for_log("start aaaaaaaaaaa")
        os.killpg(p.pid, signal.SIGINT)
        p.communicate(timeout=10)
        self.assertEqual(p.returncode, 130)
        self.assertEqual(self.entries_files(), [])
        self.assertNotIn("end aaaaaaaaaaa", self.log())

    def test_interrupt_keeps_earlier_invalid_output(self):
        self.episode("aaaaaaaaaaa", stdout="not JSON")
        self.episode("bbbbbbbbbbb", sleep=30)
        p = self.start_script("-j", "1")
        self.wait_for_log("start bbbbbbbbbbb")
        os.killpg(p.pid, signal.SIGINT)
        _, err = p.communicate(timeout=10)
        self.assertEqual(p.returncode, 130)
        self.assertIn("invalid JSON for aaaaaaaaaaa, kept in", err)
        self.assertEqual(self.entries_files(), ["aaaaaaaaaaa.json.tmp"])

    def test_interrupt_while_an_episode_starts(self):
        # Ctrl-C after the worker checked for an interrupt but before claude started: the new
        # claude call must be stopped too, not run to the end.
        shutil.copy(MOCKS / "mkdir", self.bin)
        self.env["INTERRUPT_ON_CLAIM"] = "aaaaaaaaaaa"
        self.episode("aaaaaaaaaaa", sleep=5)
        started = time.monotonic()
        p = self.start_script()
        p.communicate(timeout=20)
        self.assertEqual(p.returncode, 130)
        self.assertLess(time.monotonic() - started, 4, "waited for the claude call to finish")
        self.assertNotIn("end aaaaaaaaaaa", self.log())
        self.assertEqual(self.entries_files(), [])


if __name__ == "__main__":
    unittest.main()
