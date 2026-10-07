#!/usr/bin/env python3
"""Grab video frames around each mention of an entry, to read on-screen spellings later.

The hosts often show a card with the term written in its original language (diacritics,
non-Latin scripts), which the captions can't carry. For every selected entry this script
takes frames from a short window around its timestamp and packs them into one contact sheet:

    frames/<video_id>/<HH-MM-SS>_<slug>.jpg     one sheet per mention, each frame labelled with its time
    frames/index.html                           all sheets with their entries, for manual review

Videos are downloaded once, video-only at <=480p, into video/ (about 50-150 MB per episode)
and kept, so re-running with a different window doesn't download them again.

    python3 grab_frames.py                      every episode in data/episodes.json
    python3 grab_frames.py YBIXXAipmZw          only these episodes
    python3 grab_frames.py --all                every entry, not only non-English ones
    python3 grab_frames.py --before 2 --after 10 --step 2 --force

Sheets that already exist are skipped (use --force after changing the window).
"""
import argparse
import html
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE.parent.parent / "data"
VIDEO = HERE / "video"
FRAMES = HERE / "frames"

FRAME_WIDTH = 800   # per frame; 2 columns give a 1600 px wide sheet
COLUMNS = 2


def fmt_time(t):
    return f"{t // 3600:02}:{t % 3600 // 60:02}:{t % 60:02}"


def load_mentions():
    """video_id -> [(t, entry, note)] for every mention in data/entries.json."""
    by_episode = {}
    for e in json.loads((DATA / "entries.json").read_text(encoding="utf-8")):
        for m in e["mentions"]:
            by_episode.setdefault(m["episode_id"], []).append((m["t"], e, m["note"]))
    return by_episode


def selected(mentions, include_all):
    return [(t, e, note) for t, e, note in sorted(mentions, key=lambda x: x[0])
            if include_all or (e.get("language") or "English") != "English"]


def sheet_name(t, e):
    return f"{fmt_time(t).replace(':', '-')}_{e['slug']}.jpg"


def find_video(video_id):
    # Skips unfinished downloads (.part, .ytdl)
    return next((p for p in VIDEO.glob(f"{video_id}.*") if p.suffix in (".mp4", ".webm", ".mkv")), None)


def download(video_id):
    video = find_video(video_id)
    if video:
        return video
    print(f"  downloading video {video_id}...")
    VIDEO.mkdir(exist_ok=True)
    subprocess.run(
        ["yt-dlp", "-f", "bv*[height<=480]/b[height<=480]/wv*/w",
         "--sleep-requests", "5", "--no-progress", "--no-playlist",
         "-o", str(VIDEO / "%(id)s.%(ext)s"),
         f"https://www.youtube.com/watch?v={video_id}"],
        check=True,
    )
    return find_video(video_id)


def contact_sheet(video, t, out, before, after, step):
    """Frames at t-before, t-before+step, ..., t+after, tiled 2 columns wide."""
    start = max(0, t - before)
    count = (t + after - start) // step + 1
    rows = -(-count // COLUMNS)
    label = (
        f"drawtext=text='%{{pts\\:hms\\:{start}}}':x=10:y=10:fontsize=28:"
        "fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=6"
    )
    vf = f"fps=1/{step},scale={FRAME_WIDTH}:-2,{label},tile={COLUMNS}x{rows}:padding=4"
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", str(start), "-i", str(video),
         "-t", str((count - 1) * step + step / 2), "-vf", vf,
         "-frames:v", "1", "-q:v", "3", str(out)],
        check=True,
    )


def write_index(mentions):
    """One page listing every sheet with its entry, grouped by episode."""
    parts = ["<!doctype html><meta charset=utf-8><title>Frames</title>",
             "<style>body{font:15px system-ui;margin:20px;background:#f6f6f6}"
             "figure{margin:0 0 32px}img{max-width:100%;border:1px solid #ccc}"
             "figcaption{margin:6px 0}code{background:#e8e8e8;padding:1px 4px}</style>"]
    for video_id in sorted(mentions):
        folder = FRAMES / video_id
        if not folder.is_dir():
            continue
        parts.append(f"<h2>{video_id}</h2>")
        for t, e, note in selected(mentions[video_id], include_all=True):
            name = sheet_name(t, e)
            if not (folder / name).exists():
                continue
            link = f"https://www.youtube.com/watch?v={video_id}&t={t}s"
            extra = " · ".join(html.escape(str(e[k])) for k in ("original", "translation") if e.get(k))
            parts.append(
                f"<figure><figcaption><b>{html.escape(e['term'])}</b> ({html.escape(e.get('language') or '')})"
                f"{' · ' + extra if extra else ''} · <a href='{link}'>{fmt_time(t)}</a><br>"
                f"<small>{html.escape(note or '')}</small></figcaption>"
                f"<img loading=lazy src='{video_id}/{name}'></figure>"
            )
    (FRAMES / "index.html").write_text("\n".join(parts))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("ids", nargs="*", help="video IDs (default: every episode in data/episodes.json)")
    ap.add_argument("--all", action="store_true", help="include English entries too")
    ap.add_argument("--before", type=int, default=2, help="seconds before the timestamp (default 2)")
    ap.add_argument("--after", type=int, default=8, help="seconds after the timestamp (default 8)")
    ap.add_argument("--step", type=int, default=2, help="seconds between frames (default 2)")
    ap.add_argument("--force", action="store_true", help="rebuild sheets that already exist")
    args = ap.parse_args()

    mentions = load_mentions()
    ids = args.ids or [ep["id"] for ep in json.loads((DATA / "episodes.json").read_text(encoding="utf-8"))]
    for video_id in ids:
        if video_id not in mentions:
            print(f"{video_id}: no mentions in data/entries.json, skipping", file=sys.stderr)
            continue
        todo = []
        for t, e, _ in selected(mentions[video_id], args.all):
            out = FRAMES / video_id / sheet_name(t, e)
            if args.force or not out.exists():
                todo.append((t, e, out))
        print(f"{video_id}: {len(todo)} sheets to make")
        if not todo:
            continue

        try:
            video = download(video_id)
        except subprocess.CalledProcessError:
            print(f"  download failed for {video_id}, skipping", file=sys.stderr)
            continue
        (FRAMES / video_id).mkdir(parents=True, exist_ok=True)
        for t, e, out in todo:
            try:
                contact_sheet(video, t, out, args.before, args.after, args.step)
            except subprocess.CalledProcessError:
                print(f"  ffmpeg failed for {e['term']!r} at {fmt_time(t)}", file=sys.stderr)

    write_index(mentions)
    print(f"Open {FRAMES / 'index.html'} to review.")


if __name__ == "__main__":
    main()
