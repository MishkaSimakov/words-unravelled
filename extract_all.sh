#!/usr/bin/env bash
# Run Claude Code once per transcript, several episodes at a time. Skips transcripts whose output
# is valid JSON made with the current prompt version, so you can stop and re-run it at any time
# (e.g. after hitting a usage limit). Stops all workers at the first failed claude call.
#
#   ./extract_all.sh                          # every transcript, 5 at a time
#   ./extract_all.sh -j 2                     # 2 at a time
#   ./extract_all.sh m9AaobtBMtA 3bvK3bz_AlY  # only these episodes
#   EXTRACT_DIR=/tmp/pilot ./extract_all.sh   # write somewhere other than extracted/
#
# Don't run two copies at once on the same output folder.
set -u

# Must match "prompt_version" in extract_prompt.md. Output files with another version (or none)
# are extracted again.
PROMPT_VERSION=3
jobs=5
while getopts "j:" opt; do
  case $opt in
    j) jobs=$OPTARG ;;
    *) echo "usage: $0 [-j workers] [video_id...]" >&2; exit 2 ;;
  esac
done
shift $((OPTIND - 1))
out_dir=${EXTRACT_DIR:-extracted}
mkdir -p "$out_dir"

# True if $1 is valid JSON with the current prompt_version.
is_current() {
  python3 - "$1" "$PROMPT_VERSION" 2>/dev/null <<'EOF'
import json, sys
data = json.load(open(sys.argv[1], encoding="utf-8"))
sys.exit(0 if isinstance(data, dict) and data.get("prompt_version") == int(sys.argv[2]) else 1)
EOF
}

if (( $# )); then
  files=()
  for id in "$@"; do files+=("transcripts/$id.txt"); done
else
  files=(transcripts/*.txt)
fi

todo=()
for f in "${files[@]}"; do
  id=$(basename "$f" .txt)
  if [[ ! -f "$f" ]]; then
    echo "No transcript for $id ($f), skipped." >&2
  elif [[ ! -s "$out_dir/$id.json" ]] || ! is_current "$out_dir/$id.json"; then
    todo+=("$id")
  fi
done
if (( ${#todo[@]} == 0 )); then
  echo "Nothing to extract: every episode is at prompt_version $PROMPT_VERSION."
  exit 0
fi
(( jobs > ${#todo[@]} )) && jobs=${#todo[@]}
echo "Extracting ${#todo[@]} episode(s), $jobs at a time."

# Workers take episodes from the same list; mkdir is atomic, so each episode is claimed once.
# A "stop" file tells the other workers not to start another episode.
run=$(mktemp -d)
stop="$run/stop"

extract_one() {
  local id=$1 out="$out_dir/$1.json" status
  echo "Extracting $id..."
  claude -p --model claude-opus-5-5 "$(cat extract_prompt.md)" < "transcripts/$id.txt" > "$out.tmp"
  status=$?
  [[ -e "$stop" ]] && { rm -f "$out.tmp"; return 1; }  # interrupted

  # A failed call (e.g. "You've hit your session limit", exit 1) would fail every remaining
  # episode the same way, so stop all workers.
  if (( status != 0 )); then
    touch "$stop"
    { echo "  claude exited with status $status for $id:"; sed -e 's/^/    /' "$out.tmp"; } >&2
    rm -f "$out.tmp"
    return 1
  fi

  # Drop Markdown code fences, in case the model adds them despite the prompt.
  sed -i.bak -e '/^```/d' "$out.tmp" && rm -f "$out.tmp.bak"

  if is_current "$out.tmp"; then
    mv "$out.tmp" "$out"
    echo "  done $id"
  else
    echo "  invalid JSON or prompt_version is not $PROMPT_VERSION for $id, kept in $out.tmp" >&2
  fi
}

worker() {
  local id
  for id in "${todo[@]}"; do
    [[ -e "$stop" ]] && return
    mkdir "$run/$id" 2>/dev/null || continue
    extract_one "$id" || return
  done
}

# Ctrl-C: stop the workers and their claude calls, and drop unfinished output.
pids=()
interrupted() {
  echo; echo "Interrupted." >&2
  touch "$stop"
  for p in "${pids[@]}"; do pkill -TERM -P "$p" 2>/dev/null; kill "$p" 2>/dev/null; done
  wait
  for id in "${todo[@]}"; do
    [[ -d "$run/$id" ]] && ! is_current "$out_dir/$id.json" && rm -f "$out_dir/$id.json.tmp"
  done
  rm -rf "$run"
  exit 130
}
trap interrupted INT TERM

for ((i = 0; i < jobs; i++)); do
  worker &
  pids+=($!)
done
wait

left=0
for id in "${todo[@]}"; do is_current "$out_dir/$id.json" || left=$((left + 1)); done
if [[ -e "$stop" ]]; then
  rm -rf "$run"
  echo "Stopped with $left episode(s) left. If you hit a usage limit, re-run ./extract_all.sh after" \
       "it resets; finished episodes are skipped." >&2
  exit 1
fi
rm -rf "$run"
echo "Finished: $((${#todo[@]} - left)) extracted, $left failed (see the messages above)."
