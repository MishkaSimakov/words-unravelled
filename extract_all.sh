#!/usr/bin/env bash
# Run Claude Code once per transcript. Skips transcripts that already have valid output,
# so you can stop and re-run it at any time (e.g. after hitting a usage limit).
set -u
mkdir -p extracted

# Ctrl-C reaches claude too, but claude catches it and exits normally, so bash would just move on
# to the next transcript. Stop the whole loop instead.
out=""
trap 'echo; echo "Interrupted." >&2; rm -f "$out.tmp"; exit 130' INT

for f in transcripts/*.txt; do
  id=$(basename "$f" .txt)
  out="extracted/$id.json"

  if [[ -s "$out" ]] && python3 -m json.tool "$out" > /dev/null 2>&1; then
    continue
  fi

  echo "Extracting $id..."
  claude -p --model claude-opus-5-5 "$(cat extract_prompt.md)" < "$f" > "$out.tmp"

  # Drop Markdown code fences, in case the model adds them despite the prompt.
  sed -i.bak -e '/^```/d' "$out.tmp" && rm -f "$out.tmp.bak"

  if python3 -m json.tool "$out.tmp" > /dev/null 2>&1; then
    mv "$out.tmp" "$out"
  else
    echo "  invalid JSON for $id, kept in $out.tmp" >&2
  fi
done