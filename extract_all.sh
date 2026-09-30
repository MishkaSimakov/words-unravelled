#!/usr/bin/env bash
# Run Claude Code once per transcript. Skips transcripts whose output is valid JSON made with the
# current prompt version, so you can stop and re-run it at any time (e.g. after hitting a usage
# limit). Stops at the first failed claude call.
#
#   ./extract_all.sh                          # every transcript
#   ./extract_all.sh m9AaobtBMtA 3bvK3bz_AlY  # only these episodes
#   EXTRACT_DIR=/tmp/pilot ./extract_all.sh   # write somewhere other than extracted/
set -u

# Must match "prompt_version" in extract_prompt.md. Output files with another version (or none)
# are extracted again.
PROMPT_VERSION=2
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

# Ctrl-C reaches claude too, but claude catches it and exits normally, so bash would just move on
# to the next transcript. Stop the whole loop instead.
out=""
trap 'echo; echo "Interrupted." >&2; rm -f "$out.tmp"; exit 130' INT

for f in "${files[@]}"; do
  id=$(basename "$f" .txt)
  out="$out_dir/$id.json"

  if [[ ! -f "$f" ]]; then
    echo "No transcript for $id ($f), skipped." >&2
    continue
  fi
  if [[ -s "$out" ]] && is_current "$out"; then
    continue
  fi

  echo "Extracting $id..."
  claude -p --model claude-opus-5-5 "$(cat extract_prompt.md)" < "$f" > "$out.tmp"
  status=$?

  # A failed call (e.g. "You've hit your session limit", exit 1) would fail every remaining
  # episode the same way, so stop here.
  if (( status != 0 )); then
    echo "  claude exited with status $status for $id:" >&2
    sed -e 's/^/    /' "$out.tmp" >&2
    rm -f "$out.tmp"
    echo "Stopped. If you hit a usage limit, re-run ./extract_all.sh after it resets;" \
         "finished episodes are skipped." >&2
    exit 1
  fi

  # Drop Markdown code fences, in case the model adds them despite the prompt.
  sed -i.bak -e '/^```/d' "$out.tmp" && rm -f "$out.tmp.bak"

  if is_current "$out.tmp"; then
    mv "$out.tmp" "$out"
  else
    echo "  invalid JSON or prompt_version is not $PROMPT_VERSION for $id, kept in $out.tmp" >&2
  fi
done
