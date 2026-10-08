#!/usr/bin/env node
// Stand-in for `claude -p` in the tests: starts the MCP server named in --mcp-config, as claude
// does, makes the tool calls a script lists, and prints stream-json events like claude's.
//
// $MOCK_SCRIPT is a JSON file, all keys optional:
//   { "calls": [{ "tool": "submit", "args": {...} }],  tool calls, in order
//     "tools": ["Bash"],                                 extra tools to claim in the init event
//     "result": { "is_error": true, ... },               fields of the result event
//     "exit": 1, "stderr": "text", "hang": true }        exit code, error output, never end
// $MOCK_LOG gets { args, stdin, calls: [{ tool, args, result }] }.

import { readFileSync, writeFileSync } from 'node:fs'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const args = process.argv.slice(2)
const script = process.env.MOCK_SCRIPT ? JSON.parse(readFileSync(process.env.MOCK_SCRIPT, 'utf8')) : {}
const stdin = readFileSync(0, 'utf8')
const log = { args, stdin, calls: [] }
const save = () => process.env.MOCK_LOG && writeFileSync(process.env.MOCK_LOG, JSON.stringify(log, null, 1))
const emit = (event) => process.stdout.write(JSON.stringify(event) + '\n')
save()

const config = JSON.parse(readFileSync(args[args.indexOf('--mcp-config') + 1], 'utf8'))
const [name, server] = Object.entries(config.mcpServers)[0]
const client = new Client({ name: 'mock-claude', version: '1.0.0' })
await client.connect(new StdioClientTransport({ command: server.command, args: server.args, stderr: 'inherit' }))
const tools = (await client.listTools()).tools.map((t) => `mcp__${name}__${t.name}`)
emit({ type: 'system', subtype: 'init', model: 'mock', tools: [...(script.tools ?? []), ...tools], mcp_servers: [{ name, status: 'connected' }] })

let n = 0
for (const call of script.calls ?? []) {
  const id = `toolu_${++n}`
  emit({ type: 'assistant', message: { content: [{ type: 'text', text: `Calling ${call.tool}.` }, { type: 'tool_use', id, name: `mcp__${name}__${call.tool}`, input: call.args ?? {} }] } })
  const result = await client.callTool({ name: call.tool, arguments: call.args ?? {} })
  log.calls.push({ tool: call.tool, args: call.args, result: JSON.parse(result.content[0].text.startsWith('{') ? result.content[0].text : JSON.stringify({ text: result.content[0].text })) })
  save()
  emit({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: id, content: result.content, is_error: Boolean(result.isError) }] } })
}
if (script.hang) await new Promise(() => {})
await client.close()
if (script.stderr) process.stderr.write(script.stderr + '\n')
emit({ type: 'result', subtype: 'success', is_error: false, num_turns: n + 1, total_cost_usd: 0.25, duration_ms: 60000, result: 'Done.', ...script.result })
process.exitCode = script.exit ?? 0
