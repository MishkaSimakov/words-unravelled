// The header's Debug switch, under `npm run dev` only: it shows the edit tools and the role
// badges. Switched off, the site looks as visitors see it. A build never turns it on.

const KEY = 'wordhoard-debug'

function stored() {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export const debug = $state({ on: import.meta.env.DEV && stored() })

export function setDebug(on) {
  debug.on = on
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {}
}
