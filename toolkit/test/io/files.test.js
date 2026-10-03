import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FILES, formatJson, loadData, saveData, writeAtomic } from '../../src/io/files.js'
import { small } from '../fixtures/data.js'

const REAL = fileURLToPath(new URL('../../../data/', import.meta.url))

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'toolkit-io-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}
const bytes = (dir) => Object.values(FILES).map((f) => readFileSync(join(dir, f)))

test('saving loaded data gives back the same bytes, on the real data', (t) => {
  const dir = tempDir(t)
  cpSync(join(REAL, FILES.entries), join(dir, FILES.entries))
  cpSync(join(REAL, FILES.episodes), join(dir, FILES.episodes))
  const before = bytes(dir)
  saveData(dir, loadData(dir))
  assert.deepEqual(bytes(dir), before)
  // ...and formatting does not depend on the files being there.
  assert.equal(formatJson(loadData(dir).entries), readFileSync(join(REAL, FILES.entries), 'utf8'))
})

test('saving and loading a dataset round-trips it, with one-space indentation', (t) => {
  const dir = tempDir(t)
  saveData(dir, small())
  assert.deepEqual(loadData(dir), small())
  assert.ok(readFileSync(join(dir, FILES.episodes), 'utf8').startsWith('[\n {\n  "id": "ep-c",'))
  assert.deepEqual(readdirSync(dir).sort(), Object.values(FILES).sort())
})

test('a value that cannot be saved leaves both files as they were', (t) => {
  const dir = tempDir(t)
  saveData(dir, small())
  const before = bytes(dir)
  const bad = small()
  bad.episodes[0].duration = 10n // JSON.stringify throws on a BigInt
  assert.throws(() => saveData(dir, bad), TypeError)
  assert.deepEqual(bytes(dir), before)
  assert.deepEqual(readdirSync(dir).sort(), Object.values(FILES).sort())
})

test('data without both lists is refused before anything is written', (t) => {
  const dir = tempDir(t)
  saveData(dir, small())
  const before = bytes(dir)
  assert.throws(() => saveData(dir, { entries: small().entries }), /data.episodes must be an array/)
  assert.throws(() => saveData(dir, { entries: {}, episodes: [] }), /data.entries must be an array/)
  assert.deepEqual(bytes(dir), before)
})

test('a failed write leaves the old file intact and no temporary file', (t) => {
  const dir = tempDir(t)
  const path = join(dir, 'entries.json')
  writeFileSync(path, 'old')
  mkdirSync(`${path}.tmp`) // writing the temporary file fails
  assert.throws(() => writeAtomic(path, 'new'), { code: 'EISDIR' })
  assert.equal(readFileSync(path, 'utf8'), 'old')
})

test('a failed rename leaves the old file intact and removes the temporary file', (t) => {
  const dir = tempDir(t)
  const path = join(dir, 'entries.json')
  mkdirSync(path) // renaming a file over a directory fails
  writeFileSync(join(path, 'inside'), 'old')
  assert.throws(() => writeAtomic(path, 'new'), { code: /^(EISDIR|ENOTEMPTY|EEXIST|EPERM)$/ })
  assert.equal(readFileSync(join(path, 'inside'), 'utf8'), 'old')
  assert.deepEqual(readdirSync(dir), ['entries.json'])
})
