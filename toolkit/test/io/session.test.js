import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FILES, saveData, saveSilenced } from '../../src/io/files.js'
import { editSession } from '../../src/io/session.js'
import { small } from '../fixtures/data.js'

function session(t) {
  const dir = mkdtempSync(join(tmpdir(), 'toolkit-session-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  saveData(dir, small())
  saveSilenced(dir, [])
  return { dir, session: editSession(dir), texts: () => Object.values(FILES).map((f) => readFileSync(join(dir, f), 'utf8')) }
}

const ounceGone = [{ op: 'deleteEntry', args: ['ounce'] }]

test('preview reports the side effects and writes nothing', (t) => {
  const { session: s, texts } = session(t)
  const before = texts()
  const { version, effects } = s.preview(ounceGone)
  assert.equal(version, s.problems().version)
  assert.deepEqual(effects.entries.removed, [{ slug: 'ounce', name: 'ounce' }])
  assert.deepEqual(texts(), before)
})

test('preview and apply return the problems of a refused edit', (t) => {
  const { session: s } = session(t)
  const refused = [{ op: 'mergeEntries', args: ['bath', 'bat'] }]
  assert.deepEqual(s.preview(refused).problems.map((p) => p.code), ['mention-twice'])
  assert.deepEqual(s.apply(refused, s.problems().version).problems.map((p) => p.code), ['mention-twice'])
})

test('apply saves the edit, and undo restores the files', (t) => {
  const { session: s, texts } = session(t)
  const before = texts()
  const { version } = s.preview(ounceGone)
  const applied = s.apply(ounceGone, version)
  assert.equal(applied.undo, 1)
  assert.notEqual(applied.version, version)
  assert.ok(!texts()[0].includes('"ounce"'))
  assert.deepEqual(s.undo(), { version, undo: 0 })
  assert.deepEqual(texts(), before)
  assert.match(s.undo().conflict, /nothing to undo/)
})

test('apply refuses when the files changed since the preview', (t) => {
  const { dir, session: s, texts } = session(t)
  const { version } = s.preview(ounceGone)
  saveData(dir, { ...small(), episodes: small().episodes.slice(1) })
  const changed = texts()
  assert.match(s.apply(ounceGone, version).conflict, /changed since the preview/)
  assert.deepEqual(texts(), changed)
})

test('undo refuses when the files changed since the last apply', (t) => {
  const { dir, session: s, texts } = session(t)
  s.apply(ounceGone, s.preview(ounceGone).version)
  writeFileSync(join(dir, FILES.episodes), '[]\n')
  assert.match(s.undo().conflict, /can no longer be undone/)
  assert.equal(texts()[1], '[]\n')
})

test('problems lists warnings too, for the files as they are now', (t) => {
  const { session: s } = session(t)
  assert.deepEqual(s.problems().active.map((p) => p.code), [])
  const ops = [{ op: 'editMention', args: ['gift', 'ep-b', { note: 'Another present.' }] }]
  s.apply(ops, s.problems().version)
  assert.deepEqual(s.problems().active.map((p) => p.code), ['note-context'])
})

test('silence moves one warning to the silenced list, saved in silenced.json, and unsilence lifts it', (t) => {
  const { dir, session: s } = session(t)
  s.apply([{ op: 'editMention', args: ['gift', 'ep-b', { note: 'Another present.' }] }], s.problems().version)
  const [warning] = s.problems().active
  const silenced = s.silence(warning)
  assert.deepEqual([silenced.active, silenced.silenced, silenced.stale], [[], [warning], []])
  assert.deepEqual(JSON.parse(readFileSync(join(dir, 'silenced.json'), 'utf8')), [
    { code: 'note-context', slugs: ['gift'], mention: { slug: 'gift', episode_id: 'ep-b' } },
  ])
  assert.deepEqual(s.unsilence(warning).active, [warning])
  assert.equal(readFileSync(join(dir, 'silenced.json'), 'utf8'), '[]\n')
})

test('silence and unsilence return the refusal when they cannot', (t) => {
  const { session: s } = session(t)
  const warning = { level: 'warning', code: 'note-context', message: 'm', slugs: ['gift'], mention: { slug: 'gift', episode_id: 'ep-b' } }
  assert.deepEqual(s.silence(warning).problems.map((p) => p.code), ['silence-unknown'])
  assert.deepEqual(s.unsilence(warning).problems.map((p) => p.code), ['silence-unknown'])
})

test('a silenced record that matches no problem any more is listed as stale', (t) => {
  const { dir, session: s } = session(t)
  const record = { code: 'note-context', slugs: ['gift'], mention: { slug: 'gift', episode_id: 'ep-b' } }
  saveSilenced(dir, [record])
  assert.deepEqual(s.problems().stale, [record])
  assert.deepEqual(s.unsilence(record).stale, [])
})
