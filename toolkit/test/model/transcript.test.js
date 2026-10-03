import { test } from 'node:test'
import assert from 'node:assert/strict'
import { transcriptTimes } from '../../src/model/transcript.js'

test('transcriptTimes reads the time each line starts at, in seconds', () => {
  const text = '# video_id: x\n# title: y\n\n[00:00:00] hello\n[00:01:05] there\n[01:02:03] later\nno time [00:00:09]\n'
  assert.deepEqual([...transcriptTimes(text)], [0, 65, 3723])
  assert.deepEqual([...transcriptTimes('')], [])
})
