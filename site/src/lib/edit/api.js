// The dev server's edit endpoint (vite.config.js). Every answer is an object: the result, or
// { problems } (a refused edit), { conflict } (the files changed) or { error }.
import { asset } from '$app/paths'

async function call(method, name, body) {
  try {
    const res = await fetch(asset(`__edit/${name}`), {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    })
    return await res.json()
  } catch (error) {
    return { error: `The dev server didn't answer (${error.message}).` }
  }
}

export const fetchProblems = () => call('GET', 'problems')
export const silence = (problems) => call('POST', 'silence', { problems })
export const unsilence = (problem) => call('POST', 'unsilence', { problem })
export const preview = (ops) => call('POST', 'preview', { ops })
export const apply = (ops, version) => call('POST', 'apply', { ops, version })
export const undo = () => call('POST', 'undo')
