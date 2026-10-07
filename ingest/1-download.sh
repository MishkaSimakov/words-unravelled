#!/usr/bin/env bash
# Step 1: download auto-captions (json3) and metadata (.info.json) for Words Unravelled episodes
# into 1-youtube/.
#
#   ./1-download.sh                 all episodes of the channel not downloaded yet
#   ./1-download.sh ID [ID ...]     only these video IDs (e.g. for a trial run)
#
# The episode list comes from the channel's "Videos" tab, which doesn't contain Shorts;
# anything shorter than MIN_MINUTES is skipped as well (trailers, clips).
#
# Captions use the "en-orig" track: most episodes have auto-dubbed audio in other languages,
# and on those videos the plain "en" track is a round-trip machine translation.
# YouTube rate-limits caption downloads (HTTP 429), hence the long sleeps, and often asks
# datacenter IPs (cloud machines) to sign in; the android_vr client usually gets through, so it
# is tried after the default ones. Videos still missing are tried again, up to ATTEMPTS times.
# Exits with 1 if captions are still missing. Safe to re-run.
set -u
cd "$(dirname "$0")"
CHANNEL="https://www.youtube.com/@wordsunravelled/videos"
MIN_MINUTES=${MIN_MINUTES:-15}
ATTEMPTS=${ATTEMPTS:-3}
mkdir -p 1-youtube

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

# The IDs whose captions or metadata are missing.
missing() {
  for id in "${ids[@]}"; do
    if ! compgen -G "1-youtube/*\[$id\].info.json" > /dev/null || ! compgen -G "1-youtube/*\[$id\].en-orig.json3" > /dev/null; then
      echo "$id"
    fi
  done
}

for (( attempt = 1; attempt <= ATTEMPTS; attempt++ )); do
  todo=($(missing))
  if [[ ${#todo[@]} -eq 0 ]]; then
    (( attempt == 1 )) && echo "Captions and metadata are downloaded already."
    exit 0
  fi
  if (( attempt > 1 )); then
    echo "${#todo[@]} still missing; trying again in 60 s (attempt $attempt of $ATTEMPTS)"
    sleep 60
  else
    echo "${#todo[@]} to download"
  fi
  yt-dlp --write-auto-subs --sub-langs en-orig --sub-format json3 --write-info-json \
    --skip-download --sleep-subtitles 60 --no-progress \
    --extractor-args "youtube:player_client=default,android_vr" \
    -o "1-youtube/%(title)s [%(id)s].%(ext)s" "${todo[@]/#/https://www.youtube.com/watch?v=}"
done

todo=($(missing))
[[ ${#todo[@]} -eq 0 ]] && exit 0
echo "No en-orig captions or metadata for: ${todo[*]} (rate-limited, blocked, or no auto-captions yet). Re-run later." >&2
exit 1
