import { sveltekit } from '@sveltejs/kit/vite'
import adapter from '@sveltejs/adapter-static'
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// For a GitHub Pages project site, build with BASE_PATH=/<repo-name>/ (SvelteKit wants it
// without the trailing slash).
const BASE = (process.env.BASE_PATH || '').replace(/\/+$/, '')

// The site reads the dataset from ../data at runtime (fetch), so the data can be edited without
// touching the code. In dev it is served from there, so an edit shows up on reload; on build it
// is copied.
const DATA_DIR = fileURLToPath(new URL('../data/', import.meta.url))
const DATA_FILES = ['episodes.json', 'entries.json']

// The review tool's endpoint, dev server only: edits run on the server through the toolkit's
// edit session, which reads and writes ../data. A build has no server, so it can't edit.
const SESSION = new URL('../toolkit/src/io/session.js', import.meta.url).href
const EDIT_ROUTES = {
  'GET problems': (session) => session.problems(),
  'POST silence': (session, { problem }) => session.silence(problem),
  'POST unsilence': (session, { problem }) => session.unsilence(problem),
  'POST preview': (session, { ops }) => session.preview(ops),
  'POST apply': (session, { ops, version }) => session.apply(ops, version),
  'POST undo': (session) => session.undo(),
}

async function readJson(req) {
  let body = ''
  for await (const chunk of req) body += chunk
  return body ? JSON.parse(body) : {}
}

function editEndpoint() {
  let session = null
  return async (req, res, next) => {
    const path = (req.url || '').split('?')[0]
    const prefix = `${BASE}/__edit/`
    if (!path.startsWith(prefix)) return next()
    const route = EDIT_ROUTES[`${req.method} ${path.slice(prefix.length)}`]
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    if (!route) {
      res.statusCode = 404
      return res.end(JSON.stringify({ error: `No edit endpoint ${req.method} ${path}.` }))
    }
    try {
      session ??= (await import(SESSION)).editSession(DATA_DIR)
      res.end(JSON.stringify(route(session, await readJson(req))))
    } catch (error) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: String(error?.stack ?? error) }))
    }
  }
}

function siteData() {
  return {
    name: 'site-data',
    configureServer(server) {
      server.middlewares.use(editEndpoint())
      server.middlewares.use((req, res, next) => {
        const path = (req.url || '').split('?')[0]
        const file = DATA_FILES.find((f) => path === `${BASE}/data/${f}`)
        if (!file) return next()
        try {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store')
          res.end(readFileSync(DATA_DIR + file))
        } catch {
          res.statusCode = 404
          res.end(`Missing data/${file}.`)
        }
      })
    },
    generateBundle() {
      if (this.environment.name !== 'client') return
      for (const f of DATA_FILES) {
        this.emitFile({ type: 'asset', fileName: `data/${f}`, source: readFileSync(DATA_DIR + f) })
      }
    },
  }
}

export default defineConfig({
  plugins: [
    sveltekit({
      // A single-page app: GitHub Pages serves 404.html for unknown paths, which lets
      // /entry/<slug> deep links load the app; the router then reads the path.
      adapter: adapter({ pages: 'dist', fallback: '404.html' }),
      paths: { base: BASE },
    }),
    siteData(),
  ],
})
