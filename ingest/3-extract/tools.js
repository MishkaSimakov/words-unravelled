// The extraction agent's tools, as plain functions over the data in memory. server.js serves
// them over MCP; the tests call them directly.
//
// The episode is fixed when the tools are made: no tool takes an episode or a path. Every change
// to the data goes through the toolkit's edits, and only two of them: replaceEpisodeMentions()
// for this episode's mentions (the agent's list is turned into the episode's full list of items
// and replaced as a whole), and setGloss() for a gloss on an existing entry. So the agent can
// change nothing else, whatever it asks for.

import { pluralKey, variantKey } from '../../toolkit/src/checks/duplicates.js'
import { newProblems, problems } from '../../toolkit/src/checks/problems.js'
import { addEpisode } from '../../toolkit/src/edit/episodes.js'
import { ToolkitError } from '../../toolkit/src/edit/errors.js'
import { replaceEpisodeMentions } from '../../toolkit/src/edit/mentions.js'
import { setGloss } from '../../toolkit/src/edit/names.js'
import { parseNote, rewriteLinks } from '../../toolkit/src/model/links.js'
import { ENTRY_FIELDS, entryName } from '../../toolkit/src/model/schema.js'
import { entrySlug, slugify } from '../../toolkit/src/model/slugs.js'
import { transcriptTimes } from '../../toolkit/src/model/transcript.js'
import { addTo } from '../../toolkit/src/query/groups.js'
import { backlinks, buildIndex, episode as findEpisode, episodeCounts, episodeMentions, homographs } from '../../toolkit/src/query/index.js'
import { resolveLink } from '../../toolkit/src/query/links.js'
import { search } from '../../toolkit/src/query/search.js'
import { formatTimestamp, parseTimestamp } from '../lib/episode.js'

export const MAX_NOTE_WORDS = 30
export const SEARCH_LIMIT = { default: 20, max: 50 }
const MATCHES_PER_ENTRY = 6
const LIST_CAP = 30 // mentions and backlinks shown by entry()
const MAX_COMPLAINTS = 50
export const MAX_GLOSSES = 10 // set_gloss calls per run: each renames an existing entry
const MAX_COMPLAINT = 1000
const MAX_RETRO = 6000

const MENTION_INPUT = ['timestamp', 'role', 'note', 'confidence']

/** The words a note shows, links as their text. */
export const noteWords = (note) =>
  parseNote(note)
    .map((p) => (typeof p === 'string' ? p : p.text))
    .join('')
    .split(/\s+/)
    .filter(Boolean).length

const fail = (code, message) => ({ ok: false, errors: [{ code, message }] })
const brief = (p) => ({ code: p.code, message: p.message })

/**
 * The tools for adding `episode` ({ id, title, date, duration }) to `data`. `save(data)` is
 * called with the data after every change, `record(fields)` with what the run's record should
 * now say. Throws a ToolkitError if the episode can't be added (e.g. it is already there).
 */
export function createTools({ data, episode, transcript, save = () => {}, record = () => {} }) {
  const id = episode.id
  const times = transcriptTimes(transcript)
  // `base` is the data without this episode's mentions, with the glosses set_gloss added: the
  // warnings the agent sees are those `current` has and `base` doesn't.
  let base = addEpisode(data, episode)
  let current = base
  let baseIndex = buildIndex(base)
  let baseProblems = problems(base)
  let baseKeys = keyIndex(base.entries)
  let index = baseIndex
  let finished = false
  const complaints = []
  const glosses = []

  const isNew = (slug) => index.links.bySlug.has(slug) && !baseIndex.links.bySlug.has(slug)
  const own = () => episodeMentions(index, id)
  const ownOf = (slug) => own().find((x) => x.entry.slug === slug)

  const describe = (entry, idx = index) => {
    const out = { slug: entry.slug, name: entryName(entry), language: entry.language, category: entry.category }
    if (entry.original) out.original = entry.original
    if (entry.translation) out.translation = entry.translation
    out.episodes = episodeCounts(idx, entry).all
    if (entry.mentions.some((m) => m.episode_id === id)) out.this_episode = true
    return out
  }

  // This episode's mentions as toolkit items: new entries declared, existing ones by slug.
  const items = () =>
    own().map(({ entry, mention }) => {
      const { t, role, note, confidence } = mention
      if (!isNew(entry.slug)) return { slug: entry.slug, t, role, note, confidence }
      return { entry: Object.fromEntries(ENTRY_FIELDS.filter((k) => entry[k] != null).map((k) => [k, entry[k]])), t, role, note, confidence }
    })

  // An agent's item ({ slug | entry, timestamp, role, note, confidence }) as a toolkit item.
  const toItem = (input, n) => {
    const { timestamp, ...rest } = input
    const t = parseTimestamp(timestamp)
    if (t === null) return { error: { code: 'timestamp-format', message: `Item ${n}: timestamp "${timestamp}" is not HH:MM:SS.` } }
    if (rest.entry) rest.entry = Object.fromEntries(Object.entries(rest.entry).filter(([k, v]) => !(k === 'gloss' && !v)))
    return { item: { ...rest, t } }
  }

  // The rules that hold only for extraction, for this episode's mentions in `after`.
  const extractionErrors = (after) => {
    const found = []
    for (const { entry, mention } of mentionsIn(after, id)) {
      const name = entryName(entry)
      const words = noteWords(mention.note)
      if (!mention.note.trim()) found.push({ code: 'note-empty', message: `${name}: the note is empty.` })
      if (words > MAX_NOTE_WORDS) found.push({ code: 'note-too-long', message: `${name}: the note has ${words} words; at most ${MAX_NOTE_WORDS}.` })
      if (!times.has(mention.t)) {
        found.push({ code: 'timestamp-not-in-transcript', message: `${name}: no transcript line starts at ${formatTimestamp(mention.t)}.` })
      }
    }
    return found
  }

  // Warnings of the extraction: a new glossed entry whose homograph has no gloss.
  const extractionWarnings = () => {
    const found = []
    for (const { entry } of own()) {
      if (!isNew(entry.slug) || !entry.gloss) continue
      for (const other of homographs(baseIndex, entry.term)) {
        if (!other.gloss) {
          found.push({
            code: 'homograph-unglossed',
            message: `${entryName(entry)} is new, and its homograph ${other.term} (${other.slug}) has no gloss. If they are different words, give ${other.slug} a gloss with set_gloss.`,
            slugs: [entry.slug, other.slug],
          })
        }
      }
    }
    return found
  }

  const warnings = () => [...newProblems(baseProblems, problems(current)), ...extractionWarnings()]

  // Existing entries a new entry may duplicate: same term or original, the same name up to an
  // article, spacing, hyphens or a plural ending, and the best search results.
  const matches = (slugs) => {
    const out = {}
    for (const slug of slugs) {
      const entry = index.links.bySlug.get(slug)
      if (!entry || !isNew(slug)) continue
      const found = new Set()
      for (const e of homographs(baseIndex, entry.term)) found.add(e)
      for (const key of new Set([variantKey(slug), pluralKey(slugify(entry.term))])) for (const e of baseKeys.byKey.get(key) ?? []) found.add(e)
      for (const form of [entry.term, entry.original].filter(Boolean)) {
        for (const e of baseKeys.byOriginal.get(slugify(form)) ?? []) found.add(e)
        const term = baseIndex.links.byTerm.get(slugify(form))
        for (const e of term ?? []) found.add(e)
        for (const e of search(baseIndex, form).slice(0, 3)) found.add(e)
      }
      const list = [...found].slice(0, MATCHES_PER_ENTRY).map((e) => describe(e, baseIndex))
      if (list.length) out[slug] = list
    }
    return out
  }

  const summary = () => {
    const mentions = own()
    return { mentions: mentions.length, new_entries: mentions.filter((x) => isNew(x.entry.slug)).length }
  }

  const changed = (fields = {}) => {
    const found = warnings()
    save(current)
    record({ warnings: found.map((p) => ({ code: p.code, message: p.message, slugs: p.slugs })), glosses: [...glosses], ...summary(), ...fields })
    return found.map(brief)
  }

  // Replaces this episode's mentions with `next` (toolkit items), if that gives no errors.
  const apply = (next, touched) => {
    if (finished) return fail('finished', 'The run is finished; nothing can change any more.')
    let after
    try {
      after = replaceEpisodeMentions(current, id, next)
    } catch (error) {
      if (error instanceof ToolkitError) return { ok: false, errors: error.problems.map(brief) }
      throw error
    }
    const found = extractionErrors(after)
    if (found.length) return { ok: false, errors: found }
    current = after
    index = buildIndex(current)
    const result = { ok: true, ...summary(), warnings: changed() }
    const possible = matches(touched === 'all' ? own().map((x) => x.entry.slug) : touched)
    if (Object.keys(possible).length) result.possible_matches = possible
    return result
  }

  // Agent items as toolkit items, or the errors in them.
  const convert = (inputs) => {
    if (!Array.isArray(inputs) || !inputs.length) return { errors: [{ code: 'no-items', message: 'Give at least one item.' }] }
    const converted = inputs.map((input, n) => toItem(input, n + 1))
    const errors = converted.filter((c) => c.error).map((c) => c.error)
    converted.forEach((c, n) => {
      const slug = c.item?.entry && entrySlug(c.item.entry.term, c.item.entry.gloss)
      const existing = slug && baseIndex.links.bySlug.get(slug)
      if (existing) {
        errors.push({
          code: 'entry-exists',
          message: `Item ${n + 1}: ${entryName(existing)} already exists. Give "slug": "${slug}" to add a mention of it, or a gloss if this is a different word.`,
        })
      }
    })
    return errors.length ? { errors } : { items: converted.map((c) => c.item) }
  }

  // The slugs items name or declare.
  const slugsOf = (list) => list.map((item) => item.slug ?? entrySlug(item.entry?.term, item.entry?.gloss))

  // Notes of this episode's items with links that resolve to `from` renamed to name `to`.
  const retargetOwn = (list, from, to) => {
    const owners = own().map((x) => x.entry.slug)
    return list.map((item, n) => ({
      ...item,
      note: rewriteLinks(item.note, (link) => (resolveLink(index.links, link.target, owners[n]) === from ? to : null)),
    }))
  }

  return {
    episode,

    search({ queries, limit = SEARCH_LIMIT.default, offset = 0 }) {
      const size = Math.min(Math.max(1, limit), SEARCH_LIMIT.max)
      return {
        ok: true,
        results: queries.map((query) => {
          const found = search(index, query)
          return { query, total: found.length, offset, results: found.slice(offset, offset + size).map((e) => describe(e)) }
        }),
      }
    },

    entry({ slug }) {
      const entry = index.links.bySlug.get(slug)
      if (!entry) {
        const near = search(index, slug.replace(/-/g, ' ')).slice(0, 5).map((e) => e.slug)
        return fail('unknown-entry', `There is no entry ${slug}.${near.length ? ` Close: ${near.join(', ')}.` : ''}`)
      }
      const mentions = entry.mentions.map((m) => {
        const ep = findEpisode(index, m.episode_id)
        return { episode_id: m.episode_id, episode: ep?.title, date: ep?.date, timestamp: formatTimestamp(m.t), role: m.role, note: m.note, confidence: m.confidence }
      })
      const links = backlinks(index, slug)
      return {
        ok: true,
        ...describe(entry),
        new: isNew(slug),
        homographs: homographs(index, entry.term).filter((e) => e !== entry).map((e) => describe(e)),
        mentions_total: mentions.length,
        mentions: mentions.slice(-LIST_CAP),
        backlinks_total: links.length,
        backlinks: links.slice(0, LIST_CAP).map((e) => ({ slug: e.slug, name: entryName(e) })),
      }
    },

    list() {
      return {
        ok: true,
        episode,
        ...summary(),
        mentions: own().map(({ entry, mention }) => ({
          slug: entry.slug,
          name: entryName(entry),
          new: isNew(entry.slug),
          ...(isNew(entry.slug) ? { entry: Object.fromEntries(ENTRY_FIELDS.map((k) => [k, entry[k] ?? null])) } : {}),
          timestamp: formatTimestamp(mention.t),
          role: mention.role,
          note: mention.note,
          confidence: mention.confidence,
        })),
      }
    },

    submit({ entries }) {
      const { items: next, errors } = convert(entries)
      if (errors) return { ok: false, errors }
      return apply(next, 'all')
    },

    add({ entries }) {
      const { items: added, errors } = convert(entries)
      if (errors) return { ok: false, errors }
      return apply([...items(), ...added], slugsOf(added))
    },

    edit({ slug, fields }) {
      const at = own().findIndex((x) => x.entry.slug === slug)
      if (at < 0) return fail('not-in-episode', `${slug} has no mention in this episode. Use list to see them.`)
      const entryFields = Object.keys(fields).filter((k) => !MENTION_INPUT.includes(k))
      if (entryFields.length && !isNew(slug)) {
        return fail('entry-read-only', `${slug} is an existing entry: only its mention here (${MENTION_INPUT.join(', ')}) can change. To report a problem with the entry, use complain.`)
      }
      let list = items()
      const item = { ...list[at] }
      if ('timestamp' in fields) {
        const t = parseTimestamp(fields.timestamp)
        if (t === null) return fail('timestamp-format', `timestamp "${fields.timestamp}" is not HH:MM:SS.`)
        item.t = t
      }
      for (const k of ['role', 'note', 'confidence']) if (k in fields) item[k] = fields[k]
      let rename = null
      if (entryFields.length) {
        item.entry = { ...item.entry }
        for (const k of entryFields) {
          if (k === 'gloss' && !fields.gloss) delete item.entry.gloss
          else item.entry[k] = fields[k]
        }
        const name = entryName(item.entry)
        if (slugify(name) !== slug) rename = name
      }
      list[at] = item
      if (rename) list = retargetOwn(list, slug, rename)
      return apply(list, [rename ? slugify(rename) : slug])
    },

    remove({ slug }) {
      const at = own().findIndex((x) => x.entry.slug === slug)
      if (at < 0) return fail('not-in-episode', `${slug} has no mention in this episode. Use list to see them.`)
      return apply(items().filter((_, i) => i !== at), [])
    },

    merge({ slug, into }) {
      const at = own().findIndex((x) => x.entry.slug === slug)
      if (at < 0) return fail('not-in-episode', `${slug} has no mention in this episode. Use list to see them.`)
      if (!isNew(slug)) return fail('entry-read-only', `${slug} is an existing entry; only entries new in this episode can be merged. Use edit or remove for its mention.`)
      const target = index.links.bySlug.get(into)
      if (!target || into === slug) return fail('unknown-entry', `There is no other entry ${into}.`)
      if (ownOf(into)) return fail('mention-twice', `${into} already has a mention in this episode. Edit or remove one of the two first.`)
      const list = items()
      const { t, role, note, confidence } = list[at]
      list[at] = { slug: into, t, role, note, confidence }
      return apply(retargetOwn(list, slug, entryName(target)), [])
    },

    set_gloss({ slug, gloss }) {
      if (finished) return fail('finished', 'The run is finished; nothing can change any more.')
      const entry = baseIndex.links.bySlug.get(slug)
      if (!entry) return fail('unknown-entry', isNew(slug) ? `${slug} is new in this episode: give it a gloss with edit.` : `There is no entry ${slug}.`)
      if (entry.gloss) return fail('gloss-exists', `${entryName(entry)} already has a gloss; glosses of existing entries can't change. Use complain if it is wrong.`)
      if (typeof gloss !== 'string' || !gloss.trim()) return fail('gloss-empty', 'The gloss must be a short label, like "flour" or "German".')
      if (glosses.length >= MAX_GLOSSES) return fail('glosses-full', `At most ${MAX_GLOSSES} glosses per episode; use complain for the rest.`)
      let after, afterBase
      try {
        after = setGloss(current, slug, gloss.trim())
        afterBase = setGloss(base, slug, gloss.trim())
      } catch (error) {
        if (error instanceof ToolkitError) return { ok: false, errors: error.problems.map(brief) }
        throw error
      }
      const renamed = after.entries.find((e) => !index.links.bySlug.has(e.slug) && e.term === entry.term && e.gloss === gloss.trim())
      ;[current, base] = [after, afterBase]
      ;[index, baseIndex] = [buildIndex(current), buildIndex(base)]
      baseProblems = problems(base)
      baseKeys = keyIndex(base.entries)
      glosses.push({ from: slug, to: renamed.slug })
      return { ok: true, slug: renamed.slug, name: entryName(renamed), warnings: changed() }
    },

    complain({ slug, text }) {
      if (!baseIndex.links.bySlug.has(slug)) return fail('unknown-entry', `There is no existing entry ${slug}; complaints are about entries from other episodes.`)
      if (typeof text !== 'string' || !text.trim()) return fail('complaint-empty', 'Say what is wrong.')
      if (text.length > MAX_COMPLAINT) return fail('complaint-too-long', `At most ${MAX_COMPLAINT} characters.`)
      if (complaints.length >= MAX_COMPLAINTS) return fail('complaints-full', `At most ${MAX_COMPLAINTS} complaints.`)
      complaints.push({ slug, name: entryName(baseIndex.links.bySlug.get(slug)), text: text.trim() })
      record({ complaints: [...complaints] })
      return { ok: true, complaints: complaints.length }
    },

    finish({ retro }) {
      if (finished) return fail('finished', 'The run is already finished.')
      if (!own().length) return fail('no-mentions', 'This episode has no mentions yet: submit them first.')
      if (typeof retro !== 'string' || !retro.trim()) return fail('retro-empty', 'Write the retrospective.')
      if (retro.length > MAX_RETRO) return fail('retro-too-long', `At most ${MAX_RETRO} characters.`)
      finished = true
      record({ finished: true, retro: retro.trim() })
      return { ok: true, ...summary() }
    },
  }
}

/** The mentions of episode `id` in `data`, as [{ entry, mention }]. */
const mentionsIn = (data, id) => data.entries.flatMap((entry) => entry.mentions.filter((m) => m.episode_id === id).map((mention) => ({ entry, mention })))

/** Entries by the name keys of the duplicate checks, and by the slug of their original form. */
function keyIndex(entries) {
  const byKey = new Map()
  const byOriginal = new Map()
  for (const e of entries) {
    const term = slugify(e.term)
    for (const key of new Set([variantKey(e.slug), variantKey(term), pluralKey(term)])) addTo(byKey, key, e)
    if (e.original) addTo(byOriginal, slugify(e.original), e)
  }
  return { byKey, byOriginal }
}
