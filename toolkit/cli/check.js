#!/usr/bin/env node
// Checks the dataset and prints every problem, grouped by code, each line starting with its code
// in brackets. Warnings silenced in data/silenced.json are counted, not listed; silenced records
// that match no problem any more are listed. Exits with 1 if there are errors.
//   node cli/check.js [data-dir]     (default: the repository's data/)

import { fileURLToPath } from 'node:url'
import { CODES } from '../src/checks/codes.js'
import { problems } from '../src/checks/problems.js'
import { applySilenced } from '../src/checks/silenced.js'
import { loadData, loadSilenced } from '../src/io/files.js'
import { groupBy } from '../src/query/groups.js'

const dir = process.argv[2] ?? fileURLToPath(new URL('../../data/', import.meta.url))
const { active: found, silenced, stale } = applySilenced(problems(loadData(dir)), loadSilenced(dir))

const byCode = groupBy(found, (p) => p.code)
for (const [code, list] of byCode) {
  console.log(`\n${CODES[code].level === 'error' ? 'ERROR' : 'warning'} ${code} (${list.length}): ${CODES[code].about}`)
  // Each line starts with its code, so `npm run check | grep '\[note-context\]'` lists one kind.
  for (const p of list) console.log(`  [${code}] ${p.message}`)
}
if (stale.length) {
  console.log(`\nsilenced (${stale.length}) in silenced.json that match no problem any more:`)
  for (const r of stale) console.log(`  [silenced] ${JSON.stringify(r)}`)
}
const count = (level) => found.filter((p) => p.level === level).length
const [errors, warnings] = [count('error'), count('warning')]
console.log(`\n${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}, ${silenced.length} silenced.`)
for (const [code, list] of byCode) console.log(`  ${code}: ${list.length}`)
process.exitCode = errors ? 1 : 0
