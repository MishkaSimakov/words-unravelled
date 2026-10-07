# ingest: transcripts of YouTube episodes

Downloads the auto-captions of *Words Unravelled* episodes on YouTube and turns them into
timestamped transcripts, the input for extracting entries. Each step is a script numbered like
the folder it writes, so the order is the order of the names:

| Step | Script | Writes | In git |
|---|---|---|---|
| 1 | `1-download.sh` | `1-youtube/`: captions (`.json3`) and metadata (`.info.json`) from yt-dlp | no |
| 2 | `2-make-transcripts.py` | `2-transcripts/<video_id>.txt`: compact timestamped text | no |

`3-extract-prompt.md` is the extraction prompt. Entries are not extracted by any script at the
moment: an agent that adds a new episode to `data/entries.json` is planned in issue #13.

```sh
ingest/1-download.sh                         # all episodes not downloaded yet
ingest/1-download.sh YBIXXAipmZw JlgQIDxufh0 # ...or only some episodes
ingest/2-make-transcripts.py                 # every caption file in 1-youtube/
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

## Extras

`extras/grab_frames.py` takes video frames around each mention's timestamp in
`data/entries.json` and packs them into contact sheets (`extras/frames/`), to read spellings the
hosts show on screen. It downloads the videos once into `extras/video/`. Neither folder is in
git.
