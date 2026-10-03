// The error edits throw when they refuse.

import { problem } from '../checks/codes.js'

/** An edit's refusal, with the error problems that caused it. The data it was given is unchanged. */
export class ToolkitError extends Error {
  constructor(problems) {
    super(problems.map((p) => p.message).join('\n'))
    this.name = 'ToolkitError'
    this.problems = problems
  }
}

/** Throws a ToolkitError with one refusal problem (see checks/codes.js). */
export function refuse(code, message, slugs = [], extra = {}) {
  throw new ToolkitError([problem(code, message, slugs, extra)])
}
