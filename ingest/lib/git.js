// The git operations of the pipeline: the state of the working tree, HEAD's data, and putting
// data/ back as it was.

import { execFileSync } from 'node:child_process'
import { ROOT } from './paths.js'

export const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'pipe'] })

/** The paths that differ from HEAD, untracked files included (ignored ones not). */
export function changedPaths() {
  const tokens = git('status', '--porcelain=v1', '-z', '--untracked-files=all').split('\0').filter(Boolean)
  const paths = []
  for (let i = 0; i < tokens.length; i++) {
    paths.push(tokens[i].slice(3))
    if (/^[RC]/.test(tokens[i])) paths.push(tokens[++i]) // a rename or copy: the old path follows
  }
  return paths
}

/** A file's text at HEAD. */
export const headFile = (path) => git('show', `HEAD:${path}`)

/** Puts data/ back as it is at HEAD: changed files restored, new files removed. */
export function restoreData() {
  git('checkout', 'HEAD', '--', 'data')
  git('clean', '-fdq', '--', 'data')
}
