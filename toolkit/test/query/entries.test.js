import { test } from 'node:test'
import assert from 'node:assert/strict'
import { episodeCounts } from '../../src/query/entries.js'
import { entry, mention } from '../fixtures/data.js'

test('episodeCounts counts episodes, not mentions, and leaves pointers out of discussed', () => {
  const e = entry('cartouche', {}, mention('ep-a', 1, ''), mention('ep-b', 2, '', 'aside'), mention('ep-c', 3, '', 'mention'))
  assert.deepEqual(episodeCounts(e), { discussed: 2, all: 3 })
  assert.deepEqual(episodeCounts(entry('bat', {}, mention('ep-c', 3, '', 'mention'))), { discussed: 0, all: 1 })
})
