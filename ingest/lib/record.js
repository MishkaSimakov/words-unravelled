// The run's record, runs/<id>/3-record.json: what step 3 did, read by steps 4 and 5. run.js
// creates it, the MCP server adds the agent's work as it goes, and run.js adds the outcome.

import { readFileSync } from 'node:fs'
import { formatJson, writeAtomic } from '../../toolkit/src/io/files.js'

export const readRecord = (path) => JSON.parse(readFileSync(path, 'utf8'))
export const writeRecord = (path, record) => writeAtomic(path, formatJson(record))
export const updateRecord = (path, fields) => writeRecord(path, { ...readRecord(path), ...fields })
