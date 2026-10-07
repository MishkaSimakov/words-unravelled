#!/usr/bin/env bash
# Adds one new episode to data/ and commits it on a new branch, episode/<id>, for review:
#
#   ingest/new-episode.sh [video_id] [--model claude-opus-5-5]
#
# Without a video ID it takes the next episode (lib/next-episode.js): the oldest one on the
# channel that is newer than every episode in data/ and has no episode/<id> branch yet. If there
# is none, it says so and exits with 0.
#
# Steps, each its own script (see README.md):
#   1 1-download.sh            captions and metadata  -> 1-youtube/
#   2 2-make-transcripts.py    transcript             -> 2-transcripts/<id>.txt
#   3 3-extract/run.js         the agent adds it      -> data/, runs/<id>/3-record.json, 3-agent-log.md
#   4 4-verify/verify.js       checks the change      -> runs/<id>/4-verify.txt
#   5 5-report/report.js       the report             -> runs/<id>/5-report.md
# then a commit of data/ and runs/<id>/ on episode/<id>, and the pull request's title and body.
#
# Stops at the first step that fails. Once step 3 has started, a failure also puts data/ back as
# it is at HEAD and moves runs/<id>/ to ingest/failed/, so the working tree is as before.
set -euo pipefail
cd "$(dirname "$0")"

usage() { echo "Usage: ingest/new-episode.sh [video_id] [--model M]" >&2; exit 2; }
id=""
model_args=()
while (( $# )); do
  case "$1" in
    --model) [[ $# -ge 2 ]] || usage; model_args=(--model "$2"); shift 2 ;;
    --model=*) model_args=(--model "${1#--model=}"); shift ;;
    -h|--help) usage ;;
    *) [[ -z "$id" ]] || usage; id=$1; shift ;;
  esac
done

for dir in node_modules/@modelcontextprotocol ../toolkit/node_modules/fuse.js; do
  [[ -d "$dir" ]] || { echo "Dependencies missing: run npm ci in ingest/ and in toolkit/." >&2; exit 1; }
done
if [[ -n "$(git status --porcelain)" ]]; then
  echo "The working tree has changes. Commit or stash them first (git stash -u)." >&2
  exit 1
fi

if [[ -z "$id" ]]; then
  echo "== Looking for the next episode"
  id=$(node lib/next-episode.js)
  if [[ -z "$id" ]]; then
    echo "No new episode: every recent episode on the channel is in data/ or has an episode/ branch."
    exit 0
  fi
  echo "Next episode: $id"
fi
branch="episode/$id"
if git show-ref --verify --quiet "refs/heads/$branch"; then
  echo "Branch $branch exists already. Delete it to add the episode again." >&2
  exit 1
fi

echo "== Step 1: download"
./1-download.sh "$id"
echo "== Step 2: transcript"
captions=$(find 1-youtube -name "*\[$id\].en-orig.json3" | head -n 1)
./2-make-transcripts.py "$captions"
echo "== Step 3: extract"
node 3-extract/run.js "$id" ${model_args[@]+"${model_args[@]}"}
echo "== Step 4: verify"
node 4-verify/verify.js "$id"
echo "== Step 5: report"
node 5-report/report.js "$id"

title=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).episode.title)' "runs/$id/3-record.json")
git switch --quiet -c "$branch"
git add ../data/entries.json ../data/episodes.json "runs/$id"
git commit --quiet -m "Add episode \"$title\" ($id)"
echo "== Committed on $branch"
echo
node 5-report/report.js "$id" --pr
