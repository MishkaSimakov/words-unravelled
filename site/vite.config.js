import { defineConfig } from 'vite'
import { copyFileSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// The site reads the pipeline output from ../data at runtime (fetch), so the data can be
// rebuilt without touching the code. In dev it is served from there; on build it is copied.
const DATA_DIR = fileURLToPath(new URL('../data/', import.meta.url))
const DATA_FILES = ['episodes.json', 'entries.json']

function siteData() {
  let base = '/'
  let outDir = 'dist'
  return {
    name: 'site-data',
    configResolved(config) {
      base = config.base
      outDir = config.build.outDir
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url || '').split('?')[0]
        const file = DATA_FILES.find((f) => path === `${base}data/${f}`)
        if (!file) return next()
        try {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store')
          res.end(readFileSync(DATA_DIR + file))
        } catch {
          res.statusCode = 404
          res.end(`Missing data/${file}: run merge.py first.`)
        }
      })
    },
    generateBundle() {
      for (const f of DATA_FILES) {
        this.emitFile({ type: 'asset', fileName: `data/${f}`, source: readFileSync(DATA_DIR + f) })
      }
    },
    writeBundle() {
      // GitHub Pages serves 404.html for unknown paths, which lets /entry/<slug> deep links
      // load the app; the router then reads the path.
      copyFileSync(`${outDir}/index.html`, `${outDir}/404.html`)
    },
  }
}

export default defineConfig({
  // For a GitHub Pages project site, build with BASE_PATH=/<repo-name>/
  base: process.env.BASE_PATH || '/',
  plugins: [siteData()],
})
