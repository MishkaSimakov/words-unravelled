// The invariants every edit test checks, built on the toolkit's own checks.
import assert from 'node:assert/strict'
import { dataChanges, linkResolutions } from '../src/checks/invariants.js'
import { errors, problems } from '../src/checks/problems.js'
import { ToolkitError } from '../src/edit/errors.js'

/** Freezes `value` and everything in it, so that an edit that mutates its input throws. */
export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const v of Object.values(value)) deepFreeze(v)
  }
  return value
}

const errorCodes = (data) => errors(problems(data, { warnings: false })).map((p) => p.code)

/** Asserts the data is in file order: entries by slug, mentions by episode date and time, episodes newest first. */
export function assertOrdered(data) {
  const slugs = data.entries.map((e) => e.slug)
  assert.deepEqual(slugs, [...slugs].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)), 'entries in slug order')
  const dates = data.episodes.map((ep) => ep.date)
  assert.deepEqual(dates, [...dates].sort().reverse(), 'episodes newest first')
  const date = new Map(data.episodes.map((ep) => [ep.id, ep.date]))
  for (const e of data.entries) {
    const keys = e.mentions.map((m) => `${date.get(m.episode_id)} ${String(m.t).padStart(6, '0')}`)
    assert.deepEqual(keys, [...keys].sort(), `mentions of ${e.slug} in order`)
  }
}

/**
 * Runs edit(data, ...args) on frozen data and checks what every edit keeps:
 * - data without errors has none after;
 * - the result is in file order;
 * - only the entries in `touched` (old or new slugs) are added, removed or changed; with
 *   `retargets`, other entries may differ in link targets only, and those that don't differ at
 *   all are the very same objects.
 * Returns { after, changes }.
 */
export function assertEdit(edit, data, args, { touched = [], retargets = false } = {}) {
  deepFreeze(data)
  const hadErrors = errorCodes(data).length > 0
  const after = edit(data, ...args)
  if (!hadErrors) assert.deepEqual(errorCodes(after), [], 'valid data stays valid')
  assertOrdered(after)

  const changes = dataChanges(data, after)
  const inside = (slug) => touched.includes(slug)
  for (const kind of ['added', 'removed']) {
    assert.deepEqual(changes.entries[kind].filter((s) => !inside(s)), [], `no entries ${kind} outside ${touched}`)
  }
  for (const kind of ['added', 'removed', 'changed']) {
    assert.deepEqual(changes.mentions[kind].filter((m) => !inside(m.slug)), [], `no mentions ${kind} outside ${touched}`)
  }
  const retargeted = new Set(changes.mentions.retargeted.filter((m) => !inside(m.slug)).map((m) => m.slug))
  if (!retargets) assert.deepEqual([...retargeted], [], 'no links rewritten')
  const before = new Map(data.entries.map((e) => [e.slug, e]))
  for (const e of after.entries) {
    if (inside(e.slug)) continue
    if (retargeted.has(e.slug)) {
      assert.deepEqual({ ...e, mentions: null }, { ...before.get(e.slug), mentions: null }, `${e.slug} changed only in links`)
    } else {
      assert.equal(e, before.get(e.slug), `${e.slug} is the same object`)
    }
  }
  return { after, changes }
}

/** Asserts fn(data) refuses with a ToolkitError that has a problem of `code`, and leaves the data as it was. */
export function assertRefused(fn, data, code) {
  const snapshot = structuredClone(data)
  deepFreeze(data)
  assert.throws(
    () => fn(data),
    (error) => {
      assert.ok(error instanceof ToolkitError, `a ToolkitError, not ${error}`)
      assert.ok(error.problems.some((p) => p.code === code), `${code} among ${error.problems.map((p) => p.code)}`)
      return true
    },
  )
  assert.deepEqual(data, snapshot)
}

/**
 * Asserts every link resolves to the same entry as before, read through `renamed` (old slug ->
 * new slug) for both the entry a note belongs to and the entry a link resolves to. A link that
 * now belongs to the entry it resolves to (after a merge) resolves to nothing.
 */
export function assertLinksFollow(before, after, renamed = {}) {
  const now = linkResolutions(after)
  const expected = new Map()
  for (const [key, slug] of linkResolutions(before)) {
    const [owner, episode, n] = key.split('|')
    const newOwner = renamed[owner] ?? owner
    const newSlug = slug && (renamed[slug] ?? slug)
    expected.set(`${newOwner}|${episode}|${n}`, newSlug === newOwner ? null : newSlug)
  }
  assert.deepEqual(Object.fromEntries(now), Object.fromEntries(expected))
}
