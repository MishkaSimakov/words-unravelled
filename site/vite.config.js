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

function siteData() {
  return {
    name: 'site-data',
    configureServer(server) {
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
