// Graph view (prototype): every entry as a node, [[links]] in mention notes as edges, drawn
// Obsidian-style with force-graph. Loaded on demand from main.js, so the rest of the site
// doesn't pay for the library.
import ForceGraph from 'force-graph'

// Types that get their own colour; everything else (mostly words) stays the neutral node colour.
const COLORED_TYPES = ['idiom', 'phrase', 'name']

const DEFAULTS = {
  orphans: false,
  colorByType: true,
  textFade: 2.2, // zoom level at which labels start to fade in
  nodeSize: 1,
  linkWidth: 1,
  center: 0.5,
  repel: 10,
  linkForce: 1,
  linkDistance: 30,
}

/** Nodes and undirected, de-duplicated links from the [[wiki links]] in mention notes. */
function buildGraph({ db, slugify, WIKILINK }) {
  const nodes = db.entries.map((entry) => ({
    id: entry.slug,
    entry,
    term: entry.term,
    type: entry.type,
    neighbors: new Set(),
    links: [],
  }))
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const links = []
  const seen = new Set()
  for (const node of nodes) {
    for (const mention of node.entry.mentions) {
      for (const m of (mention.note ?? '').matchAll(WIKILINK)) {
        const other = byId.get(slugify(m[1].trim()))
        if (!other || other === node) continue
        const key = [node.id, other.id].sort().join('\n')
        if (seen.has(key)) continue
        seen.add(key)
        const link = { source: node, target: other }
        links.push(link)
        node.neighbors.add(other)
        other.neighbors.add(node)
        node.links.push(link)
        other.links.push(link)
      }
    }
  }
  for (const n of nodes) n.deg = n.neighbors.size
  return { nodes, links, byId }
}

/** Pulls every node towards the origin, so disconnected clusters and orphans don't drift away. */
function gravity() {
  let nodes = []
  let strength = 0.05
  const force = (alpha) => {
    for (const n of nodes) {
      n.vx -= n.x * strength * alpha
      n.vy -= n.y * strength * alpha
    }
  }
  force.initialize = (ns) => (nodes = ns)
  force.strength = (s) => ((strength = s), force)
  return force
}

const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x))

export function mountGraph(root, h) {
  const { db, esc, href, fold, noteHtml, forms, typeLabel, typePlural, plural } = h
  const graph = buildGraph(h)
  const settings = { ...DEFAULTS }
  const typeCounts = new Map()
  for (const n of graph.nodes) typeCounts.set(n.type, (typeCounts.get(n.type) ?? 0) + 1)
  const types = [...typeCounts.keys()].sort((a, b) => typeCounts.get(b) - typeCounts.get(a))
  const hiddenTypes = new Set()
  const linkedCount = graph.nodes.filter((n) => n.deg).length

  root.innerHTML = `
    <div class="graph-canvas" role="img" aria-label="Graph of entries and the links between them"></div>

    <div class="graph-toolbar">
      <label class="graph-search">
        <span class="visually-hidden">Find an entry in the graph</span>
        <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>
        <input id="q" type="search" placeholder="Find an entry…" spellcheck="false" autocomplete="off" />
      </label>
      <span class="graph-search-status" aria-live="polite"></span>
    </div>

    <button type="button" class="graph-settings-toggle" aria-expanded="false" aria-controls="graph-settings" aria-label="Graph settings">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>
    </button>
    <aside class="graph-settings" id="graph-settings" hidden>
      <details open>
        <summary>Filters</summary>
        <div class="graph-types">
          ${types
            .map(
              (t) => `<label class="graph-type">
                <input type="checkbox" data-type="${esc(t)}" checked />
                <span class="swatch" data-swatch="${esc(t)}"></span>
                ${esc(typePlural(t))} <span class="chip-count">${typeCounts.get(t)}</span>
              </label>`,
            )
            .join('')}
        </div>
        <label class="graph-switch"><input type="checkbox" data-setting="orphans" /> Orphans
          <span class="chip-count">${graph.nodes.length - linkedCount}</span></label>
      </details>
      <details open>
        <summary>Display</summary>
        <label class="graph-switch"><input type="checkbox" data-setting="colorByType" checked /> Colour by type</label>
        ${slider('textFade', 'Text fade threshold', 0.6, 6, 0.1)}
        ${slider('nodeSize', 'Node size', 0.4, 3, 0.1)}
        ${slider('linkWidth', 'Link thickness', 0.3, 4, 0.1)}
      </details>
      <details>
        <summary>Forces</summary>
        ${slider('center', 'Center force', 0, 1, 0.01)}
        ${slider('repel', 'Repel force', 0, 20, 0.5)}
        ${slider('linkForce', 'Link force', 0, 2, 0.05)}
        ${slider('linkDistance', 'Link distance', 5, 150, 1)}
      </details>
      <p class="graph-stats">${plural(linkedCount, 'linked entry', 'linked entries')},
        ${plural(graph.links.length, 'link')}</p>
      <button type="button" class="link-button" data-reset>Reset settings</button>
    </aside>

    <div class="graph-zoom" role="group" aria-label="Zoom">
      <button type="button" data-zoom="in" aria-label="Zoom in">+</button>
      <button type="button" data-zoom="out" aria-label="Zoom out">−</button>
      <button type="button" data-zoom="fit" aria-label="Fit graph to screen">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>
      </button>
    </div>

    <aside class="graph-card" hidden aria-live="polite"></aside>`

  function slider(key, label, min, max, step) {
    return `<label class="graph-slider">
      <span>${label}</span>
      <input type="range" data-setting="${key}" min="${min}" max="${max}" step="${step}" value="${settings[key]}" />
    </label>`
  }

  const canvasEl = root.querySelector('.graph-canvas')
  const input = root.querySelector('#q')
  const searchStatus = root.querySelector('.graph-search-status')
  const panel = root.querySelector('.graph-settings')
  const panelToggle = root.querySelector('.graph-settings-toggle')
  const card = root.querySelector('.graph-card')

  // ---- colours (read from CSS, so the graph follows the site's light/dark theme) ------------

  let colors = {}
  const readColors = () => {
    const css = getComputedStyle(root)
    const v = (name) => css.getPropertyValue(name).trim()
    colors = {
      bg: v('--graph-bg'),
      node: v('--graph-node'),
      link: v('--graph-link'),
      linkHi: v('--graph-link-hi'),
      accent: v('--graph-accent'),
      text: v('--graph-text'),
      types: Object.fromEntries(COLORED_TYPES.map((t) => [t, v(`--graph-type-${t}`)])),
    }
    root.querySelectorAll('[data-swatch]').forEach((el) => {
      el.style.background = nodeColor({ type: el.dataset.swatch }, true)
    })
  }
  const nodeColor = (node, forceType = false) =>
    ((settings.colorByType || forceType) && colors.types[node.type]) || colors.node

  // ---- state ------------------------------------------------------------------------------

  let hovered = null
  let selected = null
  let matches = null // Set of nodes matching the search, or null when not searching
  let userMoved = false // stop auto-fitting once the reader has zoomed or panned themselves

  const focus = () => hovered ?? selected
  /** 1 for highlighted nodes, a faint value for the rest while something is focused. */
  const emphasis = (node) => {
    const f = focus()
    if (f) return node === f || f.neighbors.has(node) ? 1 : 0.12
    if (matches) return matches.has(node) ? 1 : 0.12
    return 1
  }
  const isHighlighted = (node) => {
    const f = focus()
    if (f) return node === f || f.neighbors.has(node)
    return !!matches && matches.size <= 60 && matches.has(node)
  }
  const radius = (node) => settings.nodeSize * (2 + Math.sqrt(node.deg) * 1.3)
  const FONT = getComputedStyle(document.body).fontFamily
  const LABEL_SIZE = 3.6

  const visibleData = () => {
    const nodes = graph.nodes.filter((n) => !hiddenTypes.has(n.type) && (settings.orphans || n.deg))
    const ids = new Set(nodes)
    return { nodes, links: graph.links.filter((l) => ids.has(l.source) && ids.has(l.target)) }
  }

  // ---- drawing ------------------------------------------------------------------------------

  function drawLabel(node, ctx, scale, alpha, strong) {
    const size = strong ? Math.max(LABEL_SIZE, 11 / scale) : LABEL_SIZE
    ctx.globalAlpha = alpha
    ctx.font = `${strong ? 600 : 400} ${size}px ${FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = colors.text
    if (strong) {
      // A halo in the background colour keeps the label readable over links and nodes.
      ctx.lineWidth = size * 0.3
      ctx.strokeStyle = colors.bg
      ctx.lineJoin = 'round'
      ctx.strokeText(node.term, node.x, node.y + radius(node) + size * 0.35)
    }
    ctx.fillText(node.term, node.x, node.y + radius(node) + size * 0.35)
    ctx.globalAlpha = 1
  }

  function drawNode(node, ctx, scale) {
    const a = emphasis(node)
    const f = focus()
    ctx.globalAlpha = a
    ctx.beginPath()
    ctx.arc(node.x, node.y, radius(node), 0, 2 * Math.PI)
    ctx.fillStyle = node === f || (matches?.has(node) && !f) ? colors.accent : nodeColor(node)
    ctx.fill()
    if (node === selected) {
      ctx.lineWidth = 1.5 / scale
      ctx.strokeStyle = colors.accent
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius(node) + 2.5 / scale + 1, 0, 2 * Math.PI)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    // Labels fade in as you zoom, like Obsidian's "text fade threshold". Highlighted labels are
    // drawn later, on top of everything (see onRenderFramePost).
    if (isHighlighted(node)) return
    const t = settings.textFade
    const fade = clamp((scale - t) / (t * 0.5))
    if (fade > 0.01) drawLabel(node, ctx, scale, fade * a, false)
  }

  function drawLink(link, ctx, scale) {
    const f = focus()
    const hi = f && (link.source === f || link.target === f)
    const a = f ? (hi ? 1 : 0.08) : matches ? 0.25 : 1
    ctx.globalAlpha = a
    ctx.strokeStyle = hi ? colors.linkHi : colors.link
    // About 1px on screen, thickening only gently as you zoom in.
    ctx.lineWidth = settings.linkWidth * (1 / scale + 0.12) * (hi ? 1.6 : 1)
    ctx.beginPath()
    ctx.moveTo(link.source.x, link.source.y)
    ctx.lineTo(link.target.x, link.target.y)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  // ---- the graph ----------------------------------------------------------------------------

  readColors()
  const fg = new ForceGraph(canvasEl)
    .backgroundColor(colors.bg)
    .graphData(visibleData())
    .nodeId('id')
    .nodeLabel(() => '') // labels are drawn on the canvas
    .nodeCanvasObject(drawNode)
    .nodePointerAreaPaint((node, color, ctx, scale) => {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius(node) + 4 / scale, 0, 2 * Math.PI)
      ctx.fill()
    })
    .linkCanvasObject(drawLink)
    .linkCanvasObjectMode(() => 'replace')
    .autoPauseRedraw(false) // hover fades and settings changes need a redraw even when the layout is still
    .minZoom(0.1)
    .maxZoom(8)
    .warmupTicks(40)
    .cooldownTime(20000)
    .onRenderFramePost((ctx, scale) => {
      for (const node of fg.graphData().nodes) if (isHighlighted(node)) drawLabel(node, ctx, scale, 1, true)
    })
    .onNodeHover((node) => {
      hovered = node
      canvasEl.style.cursor = node ? 'pointer' : ''
    })
    .onNodeClick((node, ev) => {
      if (ev.metaKey || ev.ctrlKey) return window.open(href(`entry/${encodeURIComponent(node.id)}`), '_blank')
      select(node, { center: true })
    })
    .onBackgroundClick(() => select(null))
    .onNodeDragEnd((node) => {
      // Let the node settle back into the layout, as in Obsidian (fx/fy would pin it).
      node.fx = node.fy = undefined
    })

  const grav = gravity()
  fg.d3Force('gravity', grav)
  const applyForces = () => {
    grav.strength(settings.center * 0.1)
    fg.d3Force('charge').strength(-settings.repel * 6).distanceMax(500)
    fg.d3Force('link')
      .distance(settings.linkDistance)
      .strength((l) => settings.linkForce / Math.max(1, Math.min(l.source.deg, l.target.deg)))
    fg.d3ReheatSimulation()
  }
  applyForces()

  const fit = (ms = 600) => fg.zoomToFit(ms, 40, (n) => !matches || matches.has(n))
  let fitted = false
  fg.onEngineStop(() => {
    if (!fitted && !userMoved && !selected) fit()
    fitted = true
  })
  setTimeout(() => !userMoved && !selected && fit(0), 50)
  canvasEl.addEventListener('wheel', () => (userMoved = true), { passive: true })
  canvasEl.addEventListener('pointerdown', () => (userMoved = true))

  const resize = new ResizeObserver(([e]) => {
    fg.width(e.contentRect.width).height(e.contentRect.height)
  })
  resize.observe(canvasEl)

  const scheme = matchMedia('(prefers-color-scheme: dark)')
  const onScheme = () => {
    readColors()
    fg.backgroundColor(colors.bg)
  }
  scheme.addEventListener('change', onScheme)

  // ---- selection card -----------------------------------------------------------------------

  function select(node, { center = false } = {}) {
    selected = node
    const url = new URL(location.href)
    if (node) url.searchParams.set('focus', node.id)
    else url.searchParams.delete('focus')
    history.replaceState(history.state, '', url)
    if (!node) {
      card.hidden = true
      return
    }
    // A node hidden by the filters is brought back, so a selection always shows up.
    if (!fg.graphData().nodes.includes(node)) {
      hiddenTypes.delete(node.type)
      root.querySelector(`[data-type="${CSS.escape(node.type)}"]`).checked = true
      if (!node.deg) {
        settings.orphans = true
        root.querySelector('[data-setting="orphans"]').checked = true
      }
      fg.graphData(visibleData())
    }
    const { entry } = node
    const { original, translation } = forms(entry)
    const note = entry.mentions.find((m) => m.note)?.note
    const neighbors = [...node.neighbors].sort((a, b) => a.term.localeCompare(b.term))
    card.innerHTML = `
      <button type="button" class="graph-card-close" data-close aria-label="Close">×</button>
      <h2 class="graph-card-term">${esc(entry.term)}</h2>
      <p class="entry-class">
        <span class="swatch" style="background:${nodeColor(node, true)}"></span>
        <span class="pos">${esc(typeLabel(entry.type))}</span>
        ${entry.language ? `<span class="lang">${esc(entry.language)}</span>` : ''}
        · <span class="meta">${plural(entry.episodeCount, 'episode')}</span>
      </p>
      ${original || translation
        ? `<p class="gloss">${[original && `<i>${esc(original)}</i>`, translation && `‘${esc(translation)}’`].filter(Boolean).join(' · ')}</p>`
        : ''}
      ${note ? `<p class="note">${noteHtml(note, { self: entry })}</p>` : ''}
      ${neighbors.length
        ? `<p class="graph-card-label">Linked entries</p>
           <ul class="graph-card-links">${neighbors
             .map((n) => `<li><button type="button" class="link-button" data-node="${esc(n.id)}">${esc(n.term)}</button></li>`)
             .join('')}</ul>`
        : '<p class="meta">No links to other entries yet.</p>'}
      <a class="graph-card-open" href="${href(`entry/${encodeURIComponent(entry.slug)}`)}">Open entry →</a>`
    card.hidden = false
    if (center) {
      userMoved = true
      const zoom = Math.max(fg.zoom(), 2)
      fg.zoom(zoom, 600)
      // On phones the card is a bottom sheet: centre the node in the space above it.
      const sheet = matchMedia('(max-width: 700px)').matches ? card.offsetHeight : 0
      // If the node is still flying in (just unhidden), wait for it to get a position.
      setTimeout(() => fg.centerAt(node.x, node.y + sheet / 2 / zoom, 600), node.x === undefined ? 300 : 0)
    }
  }

  card.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-close]')) return select(null)
    const btn = ev.target.closest('[data-node]')
    if (btn) select(graph.byId.get(btn.dataset.node), { center: true })
  })

  // ---- search -------------------------------------------------------------------------------

  const runSearch = () => {
    const q = fold(input.value.trim())
    if (!q) {
      matches = null
      searchStatus.textContent = ''
      return
    }
    matches = new Set(fg.graphData().nodes.filter((n) => fold(n.term).includes(q)))
    searchStatus.textContent = matches.size ? plural(matches.size, 'match', 'matches') : 'No matches'
  }
  input.addEventListener('input', () => {
    runSearch()
    if (selected && matches && !matches.has(selected)) select(null)
  })
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      input.value = ''
      runSearch()
    }
    if (ev.key !== 'Enter' || !matches?.size) return
    const q = fold(input.value.trim())
    // Best match: exact, then prefix, then the best-connected.
    const rank = (n) => (fold(n.term) === q ? 0 : fold(n.term).startsWith(q) ? 1 : 2)
    const best = [...matches].sort((a, b) => rank(a) - rank(b) || b.deg - a.deg)[0]
    select(best, { center: true })
  })

  // ---- settings -----------------------------------------------------------------------------

  const setPanel = (open) => {
    panel.hidden = !open
    panelToggle.setAttribute('aria-expanded', String(open))
  }
  panelToggle.addEventListener('click', () => setPanel(panel.hidden))
  // Open by default where there's room for it.
  setPanel(matchMedia('(min-width: 900px)').matches)

  const FORCE_KEYS = ['center', 'repel', 'linkForce', 'linkDistance']
  panel.addEventListener('input', (ev) => {
    const el = ev.target
    if (el.dataset.type) {
      el.checked ? hiddenTypes.delete(el.dataset.type) : hiddenTypes.add(el.dataset.type)
      if (selected && hiddenTypes.has(selected.type)) select(null)
      fg.graphData(visibleData())
      runSearch()
      return
    }
    const key = el.dataset.setting
    if (!key) return
    settings[key] = el.type === 'checkbox' ? el.checked : Number(el.value)
    if (key === 'orphans') {
      if (selected && !selected.deg && !settings.orphans) select(null)
      fg.graphData(visibleData())
      runSearch()
    }
    if (key === 'colorByType') readColors()
    if (FORCE_KEYS.includes(key)) applyForces()
  })
  panel.querySelector('[data-reset]').addEventListener('click', () => {
    Object.assign(settings, DEFAULTS)
    hiddenTypes.clear()
    panel.querySelectorAll('input').forEach((el) => {
      if (el.dataset.type) el.checked = true
      else if (el.type === 'checkbox') el.checked = settings[el.dataset.setting]
      else el.value = settings[el.dataset.setting]
    })
    readColors()
    fg.graphData(visibleData())
    applyForces()
    runSearch()
  })

  // ---- zoom buttons -------------------------------------------------------------------------

  root.querySelector('.graph-zoom').addEventListener('click', (ev) => {
    const which = ev.target.closest('[data-zoom]')?.dataset.zoom
    if (!which) return
    userMoved = true
    if (which === 'fit') fit()
    else fg.zoom(fg.zoom() * (which === 'in' ? 1.5 : 1 / 1.5), 250)
  })

  const onKey = (ev) => {
    if (ev.key === 'Escape' && document.activeElement !== input) {
      if (selected) select(null)
      else setPanel(false)
    }
  }
  document.addEventListener('keydown', onKey)

  const initial = graph.byId.get(new URLSearchParams(location.search).get('focus'))
  if (initial) setTimeout(() => select(initial, { center: true }), 60)

  // Teardown when the router leaves the page.
  return () => {
    resize.disconnect()
    scheme.removeEventListener('change', onScheme)
    document.removeEventListener('keydown', onKey)
    fg._destructor()
  }
}
