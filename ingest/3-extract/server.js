#!/usr/bin/env node
// The extraction agent's MCP server (stdio): the tools of tools.js, for one episode. run.js
// starts it through `claude --mcp-config`; the agent has no other tools.
//
//   node server.js --data <data dir> --transcript <file> --record <3-record.json>
//
// The episode comes from the record, which run.js writes before starting claude. Every change
// is saved to the data files at once; the record says what the agent did.

import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { loadData, saveData } from '../../toolkit/src/io/files.js'
import { CATEGORIES, CONFIDENCES, ROLES } from '../../toolkit/src/model/schema.js'
import { readRecord, updateRecord } from '../lib/record.js'
import { SEARCH_LIMIT, createTools } from './tools.js'

const { values: args } = parseArgs({ options: { data: { type: 'string' }, transcript: { type: 'string' }, record: { type: 'string' } } })
for (const key of ['data', 'transcript', 'record']) if (!args[key]) throw new Error(`server.js needs --${key}`)

const tools = createTools({
  data: loadData(args.data),
  episode: readRecord(args.record).episode,
  transcript: readFileSync(args.transcript, 'utf8'),
  save: (data) => saveData(args.data, data),
  record: (fields) => updateRecord(args.record, fields),
})

// The fields of a mention, as the agent gives them.
const mentionFields = {
  timestamp: z.string().describe('HH:MM:SS, copied from the transcript line where the discussion begins'),
  role: z.enum(ROLES),
  note: z.string().describe('One sentence, at most 30 words, that makes sense on its own; may contain [[type:target]] links'),
  confidence: z.enum(CONFIDENCES),
}
const entryFields = {
  term: z.string(),
  gloss: z.string().nullable().optional().describe('Only for a word that shares its spelling with another, different word'),
  original: z.string().nullable(),
  translation: z.string().nullable(),
  language: z.string().nullable(),
  category: z.enum(CATEGORIES),
}
const item = z
  .object({
    slug: z.string().optional().describe('An existing entry: its slug'),
    entry: z.object(entryFields).strict().optional().describe('A new entry: its fields'),
    ...mentionFields,
  })
  .strict()
  .refine((x) => Boolean(x.slug) !== Boolean(x.entry), { message: 'Give either "slug" (an existing entry) or "entry" (a new one), not both.' })

const server = new McpServer({ name: 'wordhoard', version: '1.0.0' })

const register = (name, description, inputSchema, run) =>
  server.registerTool(name, { description, inputSchema }, async (input) => {
    const result = run(input)
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 1) }], isError: result.ok === false }
  })

register(
  'search',
  `Searches the existing entries by term, gloss, original form and translation, as the website does (fuzzy, accents ignored, exact and prefix matches first). Takes several queries at once. Each result says how many entries matched in total; page with offset. At most ${SEARCH_LIMIT.max} results per query.`,
  {
    queries: z.array(z.string().min(1)).min(1).max(50),
    limit: z.number().int().min(1).max(SEARCH_LIMIT.max).optional().describe(`Results per query (default ${SEARCH_LIMIT.default})`),
    offset: z.number().int().min(0).optional(),
  },
  (input) => tools.search(input),
)

register(
  'entry',
  'One entry by slug: its fields, its homographs (other entries spelt the same), its mentions in every episode with their notes, and the entries whose notes link to it.',
  { slug: z.string() },
  (input) => tools.entry(input),
)

register('list', "This episode's mentions as they are now, in time order.", {}, () => tools.list())

register(
  'submit',
  "Replaces all of this episode's mentions with this list. Each item is a mention of an existing entry (slug) or of a new entry (entry). Errors reject the whole list. On success, returns the warnings this episode introduces and, for each new entry, existing entries it may duplicate.",
  { entries: z.array(item).min(1) },
  (input) => tools.submit(input),
)

register(
  'add',
  "Adds mentions to this episode, in the same format as submit. Errors reject them all. Returns this episode's warnings and possible matches of the new entries.",
  { entries: z.array(item).min(1) },
  (input) => tools.add(input),
)

register(
  'edit',
  "Changes this episode's mention of an entry (timestamp, role, note, confidence) and, for an entry new in this episode, its fields too (term, gloss, original, translation, language, category). Renaming a new entry updates this episode's links to it. Returns this episode's warnings.",
  {
    slug: z.string(),
    fields: z
      .object({ ...Object.fromEntries(Object.entries(mentionFields).map(([k, v]) => [k, v.optional()])), ...Object.fromEntries(Object.entries(entryFields).map(([k, v]) => [k, v.optional()])) })
      .strict(),
  },
  (input) => tools.edit(input),
)

register('remove', "Removes this episode's mention of an entry (and the entry, if it is new). Returns this episode's warnings.", { slug: z.string() }, (input) => tools.remove(input))

register(
  'merge',
  "Turns a new entry of this episode into a mention of another, existing entry: the mention moves to it and this episode's links follow. Use it when a new entry turns out to exist already under another name.",
  { slug: z.string().describe('The new entry'), into: z.string().describe('The existing entry') },
  (input) => tools.merge(input),
)

register(
  'set_gloss',
  'Gives an existing entry that has no gloss a gloss, when this episode brings a different word with the same spelling. Its slug changes and every link to it is updated. Glosses of existing entries can only be added, never changed.',
  { slug: z.string(), gloss: z.string() },
  (input) => tools.set_gloss(input),
)

register(
  'complain',
  'Reports a problem with an existing entry (from another episode) for the maintainer: a wrong language, category, gloss, note, link… Existing entries are read-only to you; this is how to flag them.',
  { slug: z.string(), text: z.string() },
  (input) => tools.complain(input),
)

register(
  'finish',
  "Ends the run, once this episode's mentions are complete and every warning has been looked at. retro is your retrospective for the maintainer: what made this episode hard, and what in the instructions, tools, categories or data could be better.",
  { retro: z.string() },
  (input) => tools.finish(input),
)

await server.connect(new StdioServerTransport())
