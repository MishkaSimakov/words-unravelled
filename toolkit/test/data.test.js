// Checks on the real dataset in data/.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { problems } from '../src/checks/problems.js'
import { loadData } from '../src/io/files.js'

const data = loadData(fileURLToPath(new URL('../../data/', import.meta.url)))

test('the real data has no errors', () => {
  assert.deepEqual(problems(data, { warnings: false }).map((p) => p.message), [])
})
