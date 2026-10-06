// The side effects of an edit: everything that differs between the data before and after it.
// They are computed from the two versions alone, not described per edit, so they can't drift
// from what an edit does. The review tool shows them before an edit is applied.

import { parseNote } from '../model/links.js'
import { ENTRY_FIELDS, MENTION_KEYS, entryName } from '../model/schema.js'
import { linkResolutions, sameButTargets } from './invariants.js'
import { newProblems, problems } from './problems.js'

const MENTION_FIELDS = MENTION_KEYS.filter((k) => k !== 'episode_id')

const at = (slug, episode_id) => `${slug}|${episode_id}`

/** Every mention as "slug|episode id" -> { slug, episode_id, mention }. */
function mentionsByPlace(data) {
  const out = new Map()
  for (const e of data.entries) for (const m of e.mentions) out.set(at(e.slug, m.episode_id), { slug: e.slug, episode_id: m.episode_id, mention: m })
  return out
}

/** The fields that differ, as { name: [old, new] }. */
function fieldChanges(a, b, names) {
  const out = {}
  for (const name of names) if (JSON.stringify(a[name] ?? null) !== JSON.stringify(b[name] ?? null)) out[name] = [a[name] ?? null, b[name] ?? null]
  return out
}

/** Whether `b` is mention `a`, perhaps with its link targets rewritten. */
const sameMention = (a, b) => a === b || (a.t === b.t && a.role === b.role && a.confidence === b.confidence && sameButTargets(a.note, b.note))

const linksOf = (note) => parseNote(note).filter((part) => typeof part !== 'string')

/**
 * What changed from `before` to `after`, beyond nothing:
 * - entries: added and removed ({ slug, name }; a removed entry whose moved mentions all went to
 *   one entry has `into`, which is a rename if that entry was added, else a merge), and changed
 *   fields ({ slug, name, fields: { field: [old, new] } });
 * - mentions: added and removed ({ slug, episode_id, mention }), moved to another entry
 *   ({ from, to }, both { slug, episode_id }), and changed fields ({ slug, episode_id, fields });
 *   a mention moved when it left one entry and another entry has it in the same episode, with
 *   the same t, role, confidence and note apart from link targets;
 * - notes: mentions whose link targets were rewritten ({ slug, episode_id, before, after }, at
 *   the mention's place after);
 * - links whose resolution changed ({ slug, episode_id, target, before, after, follows }):
 *   before and after are slugs or null, so a link may be orphaned, captured or sent to another
 *   entry. `follows` is true when it follows its entry's rename or merge. Links are matched
 *   through moved mentions; in a note whose text changed, by type and target (or by type alone
 *   for a link to an entry renamed or merged away);
 * - introduced: the problems (warnings too) that `after` has and `before` doesn't. `known`, the
 *   problems of `before`, saves finding them again.
 */
export function sideEffects(before, after, { known } = {}) {
  const was = mentionsByPlace(before)
  const now = mentionsByPlace(after)
  // Mentions no longer, or not yet, at their place in the other version.
  const left = [...was].filter(([place, x]) => !now.has(place) || !sameMention(x.mention, now.get(place).mention))
  const arrived = [...now].filter(([place, y]) => !was.has(place) || !sameMention(was.get(place).mention, y.mention))

  // Moves: a mention that left one entry and arrived in another, in the same episode.
  const moves = new Map() // place before -> place after
  const taken = new Set()
  for (const [from, x] of left) {
    const match = arrived.find(([to, y]) => !taken.has(to) && y.episode_id === x.episode_id && y.slug !== x.slug && sameMention(x.mention, y.mention))
    if (!match) continue
    moves.set(from, match[0])
    taken.add(match[0])
  }
  const stayed = new Set(left.filter(([place]) => !moves.has(place)).map(([place]) => place))
  const came = new Set(arrived.filter(([place]) => !taken.has(place)).map(([place]) => place))

  const mentions = { added: [], removed: [], moved: [], changed: [] }
  for (const [from, to] of moves) mentions.moved.push({ from: pick(was.get(from)), to: pick(now.get(to)) })
  for (const place of stayed) {
    const x = was.get(place)
    if (came.has(place)) mentions.changed.push({ ...pick(x), fields: fieldChanges(x.mention, now.get(place).mention, MENTION_FIELDS) })
    else mentions.removed.push({ ...pick(x), mention: x.mention })
  }
  for (const place of came) if (!stayed.has(place)) mentions.added.push({ ...pick(now.get(place)), mention: now.get(place).mention })
  const removedPlaces = new Set([...stayed].filter((place) => !came.has(place)))

  // Where each mention of `before` is now, or null if it was removed.
  const placeNow = (place) => moves.get(place) ?? (removedPlaces.has(place) ? null : place)

  const notes = []
  for (const [place, x] of was) {
    const to = placeNow(place)
    const y = to && now.get(to)
    if (y && y.mention !== x.mention && y.mention.note !== x.mention.note && sameButTargets(x.mention.note, y.mention.note)) {
      notes.push({ ...pick(y), before: x.mention.note, after: y.mention.note })
    }
  }

  const entries = entryChanges(before, after, (slug) => {
    // Where a removed entry went: the one entry its moved mentions are in.
    const e = before.entries.find((x) => x.slug === slug)
    const targets = new Set(e.mentions.map((m) => moves.get(at(slug, m.episode_id))).filter(Boolean).map((place) => now.get(place).slug))
    return targets.size === 1 ? [...targets][0] : null
  })
  const intoOf = new Map(entries.removed.filter((e) => e.into).map((e) => [e.slug, e.into]))

  const links = []
  const [resolvedBefore, resolvedAfter] = [linkResolutions(before), linkResolutions(after)]
  for (const [place, x] of was) {
    const to = placeNow(place)
    if (!to) continue
    const y = now.get(to)
    // The same note apart from targets: links pair up by position; else by type and target.
    const pairs =
      y.mention === x.mention || sameButTargets(x.mention.note, y.mention.note)
        ? Array.from({ length: countFrom(resolvedBefore, place) }, (_, n) => [n, n])
        : pairByTarget(linksOf(x.mention.note), linksOf(y.mention.note), (i) => intoOf.has(resolvedBefore.get(`${place}|${i}`)))
    for (const [i, j] of pairs) {
      const old = resolvedBefore.get(`${place}|${i}`)
      const is = resolvedAfter.get(`${to}|${j}`)
      if (old === is) continue
      const target = linksOf(y.mention.note)[j].target
      links.push({ ...pick(y), target, before: old, after: is, follows: Boolean(old && intoOf.get(old) === is) })
    }
  }

  const introduced = newProblems(known ?? problems(before), problems(after))
  return { entries, mentions, notes, links, introduced }
}

const pick = ({ slug, episode_id }) => ({ slug, episode_id })

/** How many links linkResolutions() found in the note at `place`. */
function countFrom(resolved, place) {
  let n = 0
  while (resolved.has(`${place}|${n}`)) n++
  return n
}

/**
 * Links of two notes paired as [[i, j]] for a[i] and b[j], in b's order: by type and target,
 * then, for links of `a` that `retargeted(i)` (their entry was renamed or merged away, so an edit
 * in the same list rewrote them), by type in order.
 */
function pairByTarget(a, b, retargeted) {
  const pairs = new Map() // j -> i
  const used = new Set()
  const passes = [(x, y) => x.type === y.type && x.target === y.target, (x, y, i) => x.type === y.type && retargeted(i)]
  for (const same of passes) {
    b.forEach((link, j) => {
      if (pairs.has(j)) return
      const i = a.findIndex((other, i) => !used.has(i) && same(other, link, i))
      if (i < 0) return
      used.add(i)
      pairs.set(j, i)
    })
  }
  return [...pairs].sort(([x], [y]) => x - y).map(([j, i]) => [i, j])
}

/** Entries added, removed (with into(slug), where it went) and changed in their own fields. */
function entryChanges(before, after, into) {
  const [a, b] = [new Map(before.entries.map((e) => [e.slug, e])), new Map(after.entries.map((e) => [e.slug, e]))]
  const named = (e) => ({ slug: e.slug, name: entryName(e) })
  const out = { added: [], removed: [], changed: [] }
  for (const [slug, e] of b) if (!a.has(slug)) out.added.push(named(e))
  for (const [slug, e] of a) {
    const other = b.get(slug)
    if (!other) {
      const target = into(slug)
      out.removed.push(target ? { ...named(e), into: target } : named(e))
    } else if (other !== e) {
      const fields = fieldChanges(e, other, ENTRY_FIELDS)
      if (Object.keys(fields).length) out.changed.push({ ...named(other), fields })
    }
  }
  return out
}
