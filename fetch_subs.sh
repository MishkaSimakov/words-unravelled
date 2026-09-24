#!/usr/bin/env bash
# Step 1: download auto-captions (json3) and metadata (.info.json) for Words Unravelled episodes.
#
#   ./fetch_subs.sh                 all episodes of the channel not downloaded yet
#   ./fetch_subs.sh ID [ID ...]     only these video IDs (e.g. for a trial run)
#
# The episode list comes from the channel's "Videos" tab, which doesn't contain Shorts;
# anything shorter than MIN_MINUTES is skipped as well (trailers, clips).
#
# Captions use the "en-orig" track: most episodes have auto-dubbed audio in other languages,
# and on those videos the plain "en" track is a round-trip machine translation.
# YouTube rate-limits caption downloads (HTTP 429), hence the long sleeps. Safe to re-run.
set -u
CHANNEL="https://www.youtube.com/@wordsunravelled/videos"
MIN_MINUTES=${MIN_MINUTES:-15}
mkdir -p subs

if [[ $# -gt 0 ]]; then
  ids=("$@")
else
  echo "Listing episodes from $CHANNEL ..."
  ids=()
  while IFS=$'\t' read -r id duration; do
    [[ "$duration" =~ ^[0-9]+$ ]] && (( duration >= MIN_MINUTES * 60 )) && ids+=("$id")
  done < <(yt-dlp --flat-playlist --print "%(id)s	%(duration)s" "$CHANNEL")
  echo "${#ids[@]} episodes on the channel"
fi

todo=()
for id in "${ids[@]}"; do
  if compgen -G "subs/*\[$id\].info.json" > /dev/null && compgen -G "subs/*\[$id\].en-orig.json3" > /dev/null; then
    continue
  fi
  todo+=("https://www.youtube.com/watch?v=$id")
done
echo "${#todo[@]} to download"
[[ ${#todo[@]} -eq 0 ]] && exit 0

yt-dlp --write-auto-subs --sub-langs en-orig --sub-format json3 --write-info-json \
  --skip-download --sleep-requests 5 --sleep-subtitles 60 --no-progress \
  -o "subs/%(title)s [%(id)s].%(ext)s" "${todo[@]}"

for url in "${todo[@]}"; do
  id=${url##*=}
  if ! compgen -G "subs/*\[$id\].en-orig.json3" > /dev/null; then
    echo "WARNING: no en-orig captions for $id (rate-limited, or no auto-captions). Re-run later." >&2
  fi
done
