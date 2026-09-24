#!/usr/bin/env python3
"""QA tool: go through the extracted entries one by one and approve or reject each of them.

    python3 qa/review.py              # then open http://localhost:8765
    python3 qa/review.py --port 9000

The page shows each extracted entry next to the video (starting at its timestamp) and the
transcript around it. Decisions are saved immediately to data/review.json, keyed by
"<video_id>/<slug of the extracted term>", and only undecided entries are shown, so you can
stop at any time and carry on later.

merge.py reads data/review.json: rejected entries are left out of the site, and approved
ones are marked as verified (no longer counted as low-confidence entries to review).
Standard library only; the server listens on localhost.
"""
import argparse
import json
import os
import re
import sys
import threading
import webbrowser
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from merge import KNOWN_TYPES, load_info, parse_timestamp, review_key  # noqa: E402

PAGE = Path(__file__).resolve().parent / "index.html"
REVIEW = ROOT / "data" / "review.json"
LINE = re.compile(r"\[(\d\d:\d\d:\d\d)\] (.*)")
lock = threading.Lock()


def load_review():
    if not REVIEW.exists():
        return {}
    return json.loads(REVIEW.read_text(encoding="utf-8"))


def save_review(review):
    REVIEW.parent.mkdir(exist_ok=True)
    tmp = REVIEW.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(review, ensure_ascii=False, indent=1, sort_keys=True) + "\n", encoding="utf-8")
    os.replace(tmp, REVIEW)


def transcript_lines(vid):
    f = ROOT / "transcripts" / f"{vid}.txt"
    if not f.exists():
        return []
    lines = []
    for raw in f.read_text(encoding="utf-8").splitlines():
        m = LINE.match(raw)
        if m:
            lines.append({"t": parse_timestamp(m.group(1)), "text": m.group(2)})
    return lines


def all_items():
    """Every extracted entry, in episode order (newest first) then by timestamp."""
    info = load_info(ROOT / "subs")
    items = []
    for f in sorted((ROOT / "extracted").glob("*.json")):
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        vid = f.stem
        ep = info.get(vid, {})
        stamps = {line["t"] for line in transcript_lines(vid)}
        for e in data.get("entries", []):
            term = (e.get("term") or "").strip()
            if not term:
                continue
            t = parse_timestamp(e.get("timestamp"))
            flags = []
            if t is None:
                flags.append("unreadable timestamp")
            elif stamps and t not in stamps:
                flags.append("timestamp not in transcript")
            if (e.get("type") or "").lower() not in KNOWN_TYPES:
                flags.append(f"new type: {e.get('type')}")
            items.append({
                "key": review_key(vid, term),
                "video_id": vid,
                "episode": ep.get("title") or vid,
                "date": ep.get("date"),
                "term": term,
                "original": e.get("original"),
                "translation": e.get("translation"),
                "type": e.get("type"),
                "language": e.get("language"),
                "timestamp": e.get("timestamp"),
                "t": t or 0,
                "note": e.get("note"),
                "confidence": e.get("confidence"),
                "flags": flags,
            })
    items.sort(key=lambda i: (i["date"] or "", i["video_id"], -i["t"]), reverse=True)
    return items


def stats(items, review):
    keys = {i["key"] for i in items}
    decided = [v for k, v in review.items() if k in keys]
    return {
        "total": len(keys),
        "approved": sum(1 for v in decided if v.get("status") == "approved"),
        "rejected": sum(1 for v in decided if v.get("status") == "rejected"),
    }


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):  # keep the terminal quiet
        pass

    def send(self, status, body, content_type="application/json; charset=utf-8"):
        data = body if isinstance(body, bytes) else json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path in ("/", "/index.html"):
            self.send(HTTPStatus.OK, PAGE.read_bytes(), "text/html; charset=utf-8")
        elif path == "/api/items":
            with lock:
                review = load_review()
            items = all_items()
            pending = [i for i in items if i["key"] not in review]
            self.send(HTTPStatus.OK, {"items": pending, "stats": stats(items, review)})
        elif path.startswith("/api/transcript/"):
            vid = path.rsplit("/", 1)[-1]
            if not re.fullmatch(r"[A-Za-z0-9_-]{11}", vid):
                return self.send(HTTPStatus.BAD_REQUEST, {"error": "bad video id"})
            self.send(HTTPStatus.OK, {"lines": transcript_lines(vid)})
        else:
            self.send(HTTPStatus.NOT_FOUND, {"error": "not found"})

    def do_POST(self):
        if self.path != "/api/decision":
            return self.send(HTTPStatus.NOT_FOUND, {"error": "not found"})
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        except json.JSONDecodeError:
            return self.send(HTTPStatus.BAD_REQUEST, {"error": "invalid JSON"})
        key, status = body.get("key"), body.get("status")
        if not isinstance(key, str) or status not in ("approved", "rejected", None):
            return self.send(HTTPStatus.BAD_REQUEST, {"error": "need key and status approved|rejected|null"})
        with lock:
            review = load_review()
            if status is None:  # undo
                review.pop(key, None)
            else:
                record = {"status": status, "term": body.get("term"),
                          "at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}
                if body.get("comment"):
                    record["comment"] = str(body["comment"])[:500]
                review[key] = record
            save_review(review)
        self.send(HTTPStatus.OK, {"stats": stats(all_items(), review)})


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--port", type=int, default=8765)
    p.add_argument("--no-browser", action="store_true", help="don't open the page automatically")
    args = p.parse_args()

    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    url = f"http://localhost:{args.port}/"
    print(f"QA tool running at {url}  (decisions are saved to {REVIEW.relative_to(ROOT)}; Ctrl+C to stop)")
    if not args.no_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped. Run merge.py to apply the decisions to the site data.")


if __name__ == "__main__":
    main()
