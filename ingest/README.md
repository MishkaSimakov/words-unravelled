# ingest: entries from YouTube episodes

Turns *Words Unravelled* episodes on YouTube into entry files for `data/`, using the episodes'
auto-captions and Claude. Each step is a script numbered like the folder it writes, so the
order is the order of the names:

| Step | Script | Writes | In git |
|---|---|---|---|
| 1 | `1-download.sh` | `1-youtube/`: captions (`.json3`) and metadata (`.info.json`) from yt-dlp | no |
| 2 | `2-make-transcripts.py` | `2-transcripts/<video_id>.txt`: compact timestamped text | no |
| 3 | `3-extract.sh` + `3-extract-prompt.md` | `3-entries/<video_id>.json`: entries per episode | yes |

Then `python3 data/build.py` turns `3-entries/` into the site's data (see the main README).

```sh
ingest/1-download.sh                         # all episodes not downloaded yet
ingest/1-download.sh YBIXXAipmZw JlgQIDxufh0 # ...or only some episodes
ingest/2-make-transcripts.py                 # every caption file in 1-youtube/
ingest/3-extract.sh                          # Claude extracts entries, 5 episodes at a time
ingest/3-extract.sh m9AaobtBMtA              # ...or only some episodes
```

The scripts work from any directory. Every step skips work that's already done, so you can stop
and re-run any of them.

## 1. Download

Downloads sleep 60 s between caption files because YouTube rate-limits them (HTTP 429), so the
full catalogue (about 100 episodes) takes about two hours.

**Use the `en-orig` caption track.** Most episodes have auto-dubbed audio in other languages.
On those videos YouTube's plain `en` auto-caption track is a round-trip machine translation,
not what the hosts said. For example, "Sod's law" becomes "the law of meanness", and Jess's book
titles get garbled. `1-download.sh` downloads `en-orig`, and `2-make-transcripts.py` prefers it
when both tracks exist.

## 3. Extract

`3-extract.sh` runs `claude -p` with `3-extract-prompt.md` on each transcript, 5 episodes at a
time (`-j N` to change that; every other argument is a video ID, even one starting with `-`). It
checks each output and writes `video_id`, `prompt_version` and the episode's `title`, `date`
and `duration` (from `1-youtube/`) into it, and reports timestamps that aren't in the
transcript. The version is set at the top of the script; increase it whenever the prompt
changes. It skips episodes whose output is valid JSON with the current `prompt_version`, so files
made with an older prompt are extracted again. If a `claude` call fails, e.g. at the usage
limit, it starts no new episodes, keeps the output of calls already running, and exits 1;
re-run it after the reset. Ctrl-C stops everything at once and discards unfinished output.
`EXTRACT_DIR=<dir>` writes the output somewhere other than `3-entries/`.

Tests: `python3 -m unittest discover ingest/test`. They run the script in a temporary folder
with a mock `claude` (`test/mocks/`), so they use no Claude usage.

## Extras

`extras/grab_frames.py` takes video frames around each entry's timestamp and packs them into
contact sheets (`extras/frames/`), to read spellings the hosts show on screen. It downloads the
videos once into `extras/video/`. Neither folder is in git.
