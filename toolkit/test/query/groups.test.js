import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addTo, groupBy } from '../../src/query/groups.js'

test('groupBy keeps the items of each key in order, and keys in first-seen order', () => {
  const groups = groupBy(['bat', 'cat', 'bath', 'ant', 'cow'], (w) => w[0])
  assert.deepEqual([...groups], [['b', ['bat', 'bath']], ['c', ['cat', 'cow']], ['a', ['ant']]])
  assert.deepEqual(groupBy([], (x) => x), new Map())
})

test('addTo starts a list for a new key and appends to an existing one', () => {
  const map = new Map()
  addTo(map, 'k', 1)
  addTo(map, 'k', 2)
  assert.deepEqual(map.get('k'), [1, 2])
})
