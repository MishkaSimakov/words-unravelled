// The agent's log, runs/<id>/3-agent-log.md: claude's stream-json events as Markdown, written as
// they arrive. It has what the agent wrote (and its thinking, when claude includes it), every
// tool call with its arguments and every result. The transcript, the first message, is never
// in the stream, so the log holds no captions.

const PREFIX = /^mcp__[^_]+__/

const fence = (text, lang = '') => {
  const ticks = '`'.repeat(Math.max(3, ...[...String(text).matchAll(/`+/g)].map((m) => m[0].length + 1)))
  return `${ticks}${lang}\n${text}\n${ticks}\n`
}

const resultText = (content) =>
  typeof content === 'string' ? content : (content ?? []).map((c) => (c.type === 'text' ? c.text : `[${c.type}]`)).join('\n')

export class LogWriter {
  constructor(stream, { episode, model }) {
    this.stream = stream
    this.names = new Map() // tool_use_id -> tool name
    this.calls = 0
    this.write(`# Agent log: ${episode.title} (${episode.id})\n\nModel: ${model}. Started ${new Date().toISOString()}.\n\n`)
  }

  write(text) {
    this.stream.write(text)
  }

  raw(line) {
    if (line.trim()) this.write(fence(line))
  }

  event(event) {
    if (event.type === 'system' && event.subtype === 'init') {
      const servers = (event.mcp_servers ?? []).map((s) => `${s.name} (${s.status})`).join(', ') || 'none'
      this.write(`Session: model ${event.model}, MCP servers: ${servers}.\nTools offered: ${(event.tools ?? []).join(', ') || 'none'}.\n\n---\n\n`)
    } else if (event.type === 'assistant') {
      for (const block of event.message?.content ?? []) this.block(block)
    } else if (event.type === 'user') {
      for (const block of Array.isArray(event.message?.content) ? event.message.content : []) {
        if (block.type !== 'tool_result') continue
        const name = this.names.get(block.tool_use_id) ?? 'tool'
        this.write(`**← ${name}${block.is_error ? ' (error)' : ''}**\n\n${fence(resultText(block.content), 'json')}\n`)
      }
    } else if (event.type === 'result') {
      const cost = event.total_cost_usd == null ? 'unknown' : `$${event.total_cost_usd.toFixed(2)}`
      const minutes = event.duration_ms == null ? '?' : (event.duration_ms / 60_000).toFixed(1)
      this.write(`---\n\n## Result\n\n${event.subtype}${event.is_error ? ' (error)' : ''}: ${event.num_turns ?? '?'} turns, ${this.calls} tool calls, ${minutes} minutes, ${cost}.\n\n`)
      if (typeof event.result === 'string' && event.result.trim()) this.write(`${event.result.trim()}\n\n`)
    }
  }

  block(block) {
    if (block.type === 'text' && block.text?.trim()) this.write(`${block.text.trim()}\n\n`)
    else if (block.type === 'thinking' && block.thinking?.trim()) this.write(`${block.thinking.trim().replace(/^/gm, '> ')}\n\n`)
    else if (block.type === 'tool_use') {
      const name = block.name.replace(PREFIX, '')
      this.names.set(block.id, name)
      this.calls++
      this.write(`**→ ${name}** (call ${this.calls})\n\n${fence(JSON.stringify(block.input, null, 1), 'json')}\n`)
    }
  }

  /** Ends the log, with claude's last error output if there was any, once it is all written. */
  close(stderr = []) {
    if (stderr.length) this.write(`---\n\nclaude's error output (last lines):\n\n${fence(stderr.join('\n'))}`)
    return new Promise((resolve) => this.stream.end(resolve))
  }
}
