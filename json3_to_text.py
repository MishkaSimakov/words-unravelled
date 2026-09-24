#!/usr/bin/env python3
"""Convert YouTube json3 captions (downloaded with yt-dlp) into compact,
timestamped text that is easy for an LLM to read.

Output format (one file per video, named <video_id>.txt):

    # video_id: YBIXXAipmZw
    # title: The funniest sayings from around the world

    [00:00:00] How do you say "no feathers or down" in other languages?
    [00:00:02] >> What is Rob's wife's favorite idiomatic expression?

">>" marks a speaker change. A new line starts on every speaker change,
or when the current line has run longer than --window seconds.

Usage:
    python json3_to_text.py subs/ -o transcripts/
    python json3_to_text.py "Some title [VIDEOID].en-orig.json3" -o transcripts/

Download captions with --sub-langs en-orig: on videos with auto-dubbed audio tracks the
plain "en" track is a round-trip machine translation, not what the hosts said.
"""
import argparse
import json
import re
import sys
from pathlib import Path

TAG = re.compile(r"\[[A-Za-z _]{1,20}\]")          # [music], [laughter], [Applause]...
VIDEO_ID = re.compile(r"\[([A-Za-z0-9_-]{11})\]")  # yt-dlp's default "Title [ID].en.json3"
INVISIBLE = re.compile(r"[\u200b\u200c\u200d\u2060\ufeff]")  # zero-width chars, BOM


def fmt(ms: int) -> str:
    s = ms // 1000
    return f"{s // 3600:02}:{s % 3600 // 60:02}:{s % 60:02}"


def iter_segments(events):
    """Yield (absolute_ms, text, is_speaker_change) for every caption segment."""
    for ev in events:
        if ev.get("aAppend") or "segs" not in ev:  # skip "\n" line-break events and window setup
            continue
        start = ev.get("tStartMs", 0)
        segs = ev["segs"]
        for i, seg in enumerate(segs):
            text = INVISIBLE.sub("", seg.get("utf8", ""))
            speaker_change = bool(seg.get("isSpeakerChange"))
            if text.lstrip().startswith(">>"):  # en-orig tracks also put ">>" in the text itself
                text = text.lstrip()[2:].lstrip()
                speaker_change = True

            if not text.strip():
                continue
            if i == len(segs) - 1:
                text += " "  # events are separated by "\n" events we skip, so add the gap back
            yield start + seg.get("tOffsetMs", 0), text, speaker_change


def clean(text: str) -> str:
    text = TAG.sub("", text)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s+([?.,!;:])", r"\1", text)  # "expression ?" -> "expression?"
    return text.strip()


def convert(events, window_ms: int = 8000) -> str:
    lines = []
    line_start = None
    buf = []

    def flush():
        text = clean("".join(buf))
        if text and text != ">>":
            lines.append(f"[{fmt(line_start)}] {text}")

    for ms, text, speaker_change in iter_segments(events):
        too_long = line_start is not None and ms - line_start >= window_ms
        if buf and (speaker_change or too_long):
            flush()
            buf = []
        if not buf:
            line_start = ms
            if speaker_change:
                buf.append(">> ")
        buf.append(text)
    if buf:
        flush()
    return "\n".join(lines)


def collect(inputs):
    """json3 files to convert, one per video. On videos with auto-dubbed audio, the "en" track
    is a machine translation of a translation, so "en-orig" (the real speech) wins if present."""
    files = []
    for path in inputs:
        if path.is_dir():
            files.extend(sorted(path.glob("*.json3")))
        else:
            files.append(path)
    orig_ids = {m[-1].group(1) for f in files if f.name.endswith(".en-orig.json3")
                for m in [list(VIDEO_ID.finditer(f.name))] if m}
    return [f for f in files
            if f.name.endswith(".en-orig.json3")
            or not any(m.group(1) in orig_ids for m in VIDEO_ID.finditer(f.name))]


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("inputs", nargs="+", type=Path, help="json3 files or directories containing them")
    p.add_argument("-o", "--out-dir", type=Path, default=Path("transcripts"))
    p.add_argument("--window", type=float, default=8.0, help="max seconds per line (default: 8)")
    args = p.parse_args()

    files = collect(args.inputs)
    if not files:
        sys.exit("No .json3 files found.")

    args.out_dir.mkdir(parents=True, exist_ok=True)
    for f in files:
        matches = list(VIDEO_ID.finditer(f.name))
        if not matches:
            print(f"skip (no [video_id] in file name): {f.name}", file=sys.stderr)
            continue
        m = matches[-1]
        video_id, title = m.group(1), f.name[: m.start()].strip()

        events = json.loads(f.read_text(encoding="utf-8")).get("events", [])
        body = convert(events, int(args.window * 1000))

        out = args.out_dir / f"{video_id}.txt"
        out.write_text(f"# video_id: {video_id}\n# title: {title}\n\n{body}\n", encoding="utf-8")
        print(f"{f.name} -> {out}")


if __name__ == "__main__":
    main()