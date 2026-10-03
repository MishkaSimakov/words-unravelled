#!/usr/bin/env node
// Checks the dataset and prints every problem, grouped by code, each line starting with its code
// in brackets. Exits with 1 if there are errors.
//   node cli/check.js [data-dir]     (default: the repository's data/)

import { fileURLToPath } from 'node:url'
import { CODES } from '../src/checks/codes.js'
import { problems } from '../src/checks/problems.js'
import { loadData } from '../src/io/files.js'

const dir = process.argv[2] ?? fileURLToPath(new URL('../../data/', import.meta.url))
const found = problems(loadData(dir))

const byCode = new Map()
for (const p of found) {
  if (!byCode.has(p.code)) byCode.set(p.code, [])
  byCode.get(p.code).push(p)
}
for (const [code, list] of byCode) {
  console.log(`\n${CODES[code].level === 'error' ? 'ERROR' : 'warning'} ${code} (${list.length}): ${CODES[code].about}`)
  // Each line starts with its code, so `npm run check | grep '\[note-context\]'` lists one kind.
  for (const p of list) console.log(`  [${code}] ${p.message}`)
}
const count = (level) => found.filter((p) => p.level === level).length
const [errors, warnings] = [count('error'), count('warning')]
console.log(`\n${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}.`)
for (const [code, list] of byCode) console.log(`  ${code}: ${list.length}`)
process.exitCode = errors ? 1 : 0
