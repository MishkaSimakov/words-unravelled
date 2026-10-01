#!/usr/bin/env bash
# Run Claude Code once per transcript, several episodes at a time. Skips transcripts whose output
# is valid JSON made with the current prompt version, so you can stop and re-run it at any time
# (e.g. after hitting a usage limit).
#
#   ./extract_all.sh                          # every transcript, 5 at a time
#   ./extract_all.sh -j 2                     # 2 at a time
#   ./extract_all.sh m9AaobtBMtA -54FiJ0PsXo  # only these episodes
#   EXTRACT_DIR=/tmp/pilot ./extract_all.sh   # write somewhere other than extracted/
#
# If a claude call fails (e.g. at the usage limit), no new episodes are started; calls already
# running finish and their output is kept. Ctrl-C stops everything at once and discards
# unfinished output. Don't run two copies at once on the same output folder.
set -u

# Version of extract_prompt.md: increase it whenever the prompt changes. The script writes it
# into each output file as "prompt_version"; files with another version (or none) are
# extracted again.
PROMPT_VERSION=4

usage() { echo "usage: $0 [-j workers] [video_id...]" >&2; exit 2; }

# Only -j is an option; everything else is a video ID, even if it starts with "-".
jobs=5
while (( $# )); do
  case $1 in
    -j) (( $# >= 2 )) || usage; jobs=$2; shift 2 ;;
    -j*) jobs=${1#-j}; shift ;;
    -h|--help) usage ;;
    --) shift; break ;;
    *) break ;;
  esac
done
[[ $jobs =~ ^[1-9][0-9]*$ ]] || { echo "-j needs a whole number of workers, 1 or more (got '$jobs')." >&2; exit 2; }

out_dir=${EXTRACT_DIR:-extracted}
mkdir -p "$out_dir"

# Prints the IDs among "$@" whose output isn't valid JSON with the current prompt_version.
not_current() {
  python3 - "$out_dir" "$PROMPT_VERSION" "$@" <<'EOF'
import json, sys
from pathlib import Path
out_dir, version = Path(sys.argv[1]), int(sys.argv[2])
for vid in sys.argv[3:]:
    try:
        data = json.loads((out_dir / f"{vid}.json").read_text(encoding="utf-8"))
        ok = isinstance(data, dict) and data.get("prompt_version") == version
    except (OSError, ValueError):
        ok = False
    if not ok:
        print(vid)
EOF
}

# Checks the model's output in $1 (a JSON object with an "entries" list) and writes it to $2
# with the video ID $3 and the current prompt_version. The file is written under another name
# and renamed, so an interrupt never leaves half a file. Fails, writing nothing, if the output
# isn't valid.
stamp() {
  python3 - "$1" "$2" "$3" "$PROMPT_VERSION" 2>/dev/null <<'EOF'
import json, os, sys
src, dst, vid, version = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
data = json.load(open(src, encoding="utf-8"))
if not isinstance(data, dict) or not isinstance(data.get("entries"), list):
    sys.exit(1)
data = {"video_id": vid, "prompt_version": version,
        **{k: v for k, v in data.items() if k not in ("video_id", "prompt_version")}}
with open(dst + ".part", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False)
os.replace(dst + ".part", dst)
EOF
}

ids=()
if (( $# )); then
  for id in "$@"; do
    if [[ -f "transcripts/$id.txt" ]]; then ids+=("$id"); else echo "No transcript for $id, skipped." >&2; fi
  done
else
  for f in transcripts/*.txt; do [[ -f $f ]] && ids+=("$(basename "$f" .txt)"); done
fi
todo=()
if (( ${#ids[@]} )); then
  while IFS= read -r id; do todo+=("$id"); done < <(not_current "${ids[@]}")
fi
if (( ${#todo[@]} == 0 )); then
  echo "Nothing to extract: every episode is at prompt_version $PROMPT_VERSION."
  exit 0
fi
(( jobs > ${#todo[@]} )) && jobs=${#todo[@]}
echo "Extracting ${#todo[@]} episode(s), $jobs at a time."

# Workers take episodes from the same list; mkdir is atomic, so each episode is claimed once.
#   $run/failed       a claude call failed: start no new episodes, keep finished output
#   $run/interrupted  Ctrl-C: stop now, discard unfinished output
#   $run/pid-<id>     the running claude call for an episode, in its own process group
run=$(mktemp -d)
failed="$run/failed"
interrupted="$run/interrupted"

extract_one() {
  local id=$1 out="$out_dir/$1.json" pid status
  echo "Extracting $id..."
  # A process group of its own keeps Ctrl-C away from claude: only this script decides to stop
  # (claude would otherwise catch it and exit normally with partial output).
  python3 -c 'import os, sys; os.setpgid(0, 0); os.execvp(sys.argv[1], sys.argv[1:])' \
    claude -p --model claude-opus-5-5 "$(cat extract_prompt.md)" < "transcripts/$id.txt" > "$out.tmp" &
  pid=$!
  echo "$pid" > "$run/pid-$id"
  { wait "$pid"; } 2>/dev/null  # bash 3.2 reports "Terminated" jobs on stderr
  status=$?
  rm -f "$run/pid-$id"

  if [[ -e "$interrupted" ]]; then
    rm -f "$out.tmp"
    return 1
  fi
  # A failed call (e.g. "You've hit your session limit", exit 1) would fail every remaining
  # episode the same way, so stop starting new ones.
  if (( status != 0 )); then
    touch "$failed"
    { echo "  claude exited with status $status for $id:"; sed -e 's/^/    /' "$out.tmp"; } >&2
    rm -f "$out.tmp"
    return 1
  fi

  # Drop Markdown code fences, in case the model adds them despite the prompt.
  sed -i.bak -e '/^```/d' "$out.tmp" && rm -f "$out.tmp.bak"

  if stamp "$out.tmp" "$out" "$id"; then
    rm -f "$out.tmp"
    echo "  done $id"
  else
    echo "  invalid JSON for $id, kept in $out.tmp" >&2
  fi
}

worker() {
  local id
  for id in "${todo[@]}"; do
    [[ -e "$failed" || -e "$interrupted" ]] && return
    mkdir "$run/claim-$id" 2>/dev/null || continue
    extract_one "$id" || return
  done
}

on_interrupt() {
  trap '' INT TERM
  echo; echo "Interrupted." >&2
  touch "$interrupted"
  local f
  for f in "$run"/pid-*; do
    [[ -e $f ]] && { kill -TERM -- "-$(cat "$f")" || kill -TERM "$(cat "$f")"; } 2>/dev/null
  done
  wait
  for f in "$run"/claim-*; do
    [[ -e $f ]] && rm -f "$out_dir/${f##*/claim-}.json.tmp" "$out_dir/${f##*/claim-}.json.part"
  done
  rm -rf "$run"
  exit 130
}
trap on_interrupt INT TERM

for ((i = 0; i < jobs; i++)); do
  worker &
done
wait

left=()
while IFS= read -r id; do left+=("$id"); done < <(not_current "${todo[@]}")
done_count=$(( ${#todo[@]} - ${#left[@]} ))
if [[ -e "$failed" ]]; then
  rm -rf "$run"
  echo "Stopped after a failed call: $done_count extracted, ${#left[@]} left. If you hit a usage limit," \
       "re-run ./extract_all.sh after it resets; finished episodes are skipped." >&2
  exit 1
fi
rm -rf "$run"
echo "Finished: $done_count extracted, ${#left[@]} failed (see the messages above)."
(( ${#left[@]} == 0 ))
