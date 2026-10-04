import { asset, resolve } from '$app/paths'

// A path within the site, under the base path ('/' locally, '/<repo>/' on GitHub Pages).
export const href = (path = '') => resolve(path)
export const entryHref = (entry) => href(`entry/${encodeURIComponent(entry.slug)}`)
export const episodeHref = (id) => href(`episode/${id}`)
export const dataUrl = (name) => asset(`data/${name}.json`)
