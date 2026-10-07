// The graph page's canvas: the link graph drawn Obsidian-style with force-graph. Nodes start at
// their galaxy layout positions (toolkit query/layout.js) and a spring holds each one there, so
// the simulation only adjusts them locally and after a drag. GraphView.svelte drives it: filters,
// selection, search matches and settings go in through the returned object.
import ForceGraph from 'force-graph'

// Categories that get their own colour; the rest (mostly words) stay the neutral node colour.
const COLORED_CATEGORIES = ['expression', 'name', 'about-language']

export const DEFAULTS = {
  colorByCategory: true,
  textFade: 2.2, // zoom level at which labels start to fade in
  nodeSize: 1,
  linkWidth: 1,
  anchor: 0.3,
  repel: 10,
  linkForce: 1,
  linkDistance: 30,
}
const FORCE_KEYS = ['anchor', 'repel', 'linkForce', 'linkDistance']

// "Unrelated" links (a resemblance that isn't a connection) are red dashes, also when highlighted.
const isUnrelated = (link) => link.types.size === 1 && link.types.has('unrelated')
const UNRELATED_DASH = [4, 3] // in graph units, so the dashes scale with the zoom like the links

const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x))
const lerp = (a, b, t) => a + (b - a) * t
const smooth = (t) => t * t * (3 - 2 * t)

/** Pulls every node towards its anchor, which keeps the layout in place. */
function anchorForce() {
  let nodes = []
  let strength = DEFAULTS.anchor
  const force = (alpha) => {
    for (const n of nodes) {
      n.vx += (n.anchor[0] - n.x) * strength * alpha
      n.vy += (n.anchor[1] - n.y) * strength * alpha
    }
  }
  force.initialize = (ns) => (nodes = ns)
  force.strength = (s) => ((strength = s), force)
  return force
}

/**
 * Nodes and links for force-graph from a link graph (toolkit query/graph.js) and its layout.
 * `name(entry)` is the label.
 */
export function graphNodes(graph, layout, name) {
  const nodes = graph.entries.map((entry) => {
    const [x, y] = layout.get(entry.slug)
    return { id: entry.slug, entry, term: name(entry), category: entry.category, anchor: [x, y], x, y,
      neighbors: new Set(), shownNeighbors: new Set() }
  })
  const byEntry = new Map(nodes.map((n) => [n.entry, n]))
  const links = graph.edges.map(({ a, b, types }) => {
    const [source, target] = [byEntry.get(a), byEntry.get(b)]
    source.neighbors.add(target)
    target.neighbors.add(source)
    return { source, target, types }
  })
  for (const n of nodes) n.deg = n.neighbors.size
  return { nodes, links, byId: new Map(nodes.map((n) => [n.id, n])) }
}

/**
 * Draws `data` (graphNodes()) in `el`, with colours from the CSS custom properties on `theme`.
 * Calls onClick(node, event) for a node click and onBackground() for a click elsewhere.
 */
export function graphCanvas(el, theme, data, { onClick, onBackground }) {
  const settings = { ...DEFAULTS }
  let hidden = new Set() // hidden categories
  let hovered = null
  let selected = null
  let matches = null // Set of nodes matching the search, or null when not searching
  let userMoved = false // stop auto-fitting once the reader has zoomed or panned themselves

  // ---- colours (read from CSS, so the graph follows the site's light/dark theme) --------------

  let colors = {}
  const readColors = () => {
    const css = getComputedStyle(theme)
    const v = (name) => css.getPropertyValue(name).trim()
    colors = {
      bg: v('--graph-bg'),
      node: v('--graph-node'),
      link: v('--graph-link'),
      linkHi: v('--graph-link-hi'),
      accent: v('--graph-accent'),
      text: v('--graph-text'),
      unrelated: v('--graph-unrelated'),
      categories: Object.fromEntries(COLORED_CATEGORIES.map((c) => [c, v(`--graph-cat-${c}`)])),
    }
  }
  const nodeColor = (node) => (settings.colorByCategory && colors.categories[node.category]) || colors.node

  // ---- what is shown and highlighted ------------------------------------------------------------

  const visibleData = () => {
    const filtered = new Set(data.nodes.filter((n) => !hidden.has(n.category)))
    const links = data.links.filter((l) => filtered.has(l.source) && filtered.has(l.target))
    for (const n of data.nodes) n.shownNeighbors.clear()
    for (const l of links) {
      l.source.shownNeighbors.add(l.target)
      l.target.shownNeighbors.add(l.source)
    }
    // Entries whose links all lead to hidden categories go too, rather than float alone.
    return { nodes: [...filtered].filter((n) => n.shownNeighbors.size), links }
  }

  const focus = () => hovered ?? selected
  /** 1 for highlighted nodes, a faint value for the rest while something is focused. */
  const emphasis = (node) => {
    const f = focus()
    if (f) return node === f || f.shownNeighbors.has(node) ? 1 : 0.12
    if (matches) return matches.has(node) ? 1 : 0.12
    return 1
  }
  const isHighlighted = (node) => {
    const f = focus()
    if (f) return node === f || f.shownNeighbors.has(node)
    return !!matches && matches.size <= 60 && matches.has(node)
  }
  const baseRadius = (node) => settings.nodeSize * (2 + Math.sqrt(node.deg) * 1.3)
  // The focused node swells a little, as in Obsidian.
  const radius = (node) => baseRadius(node) * (1 + 0.2 * (node.anim?.accent ?? 0))
  const FONT = getComputedStyle(document.body).fontFamily
  const LABEL_SIZE = 3.6

  // ---- animation ------------------------------------------------------------------------------

  // Hover, selection and search change targets; every frame each node and link eases its
  // displayed values towards them, so highlights fade in and out instead of switching.
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  const EASE_MS = 70 // time constant: ~95% of the way there after 3x this
  let lastFrame = performance.now()

  const nodeTargets = (node) => {
    const f = focus()
    return {
      emphasis: emphasis(node),
      highlight: isHighlighted(node) ? 1 : 0,
      accent: node === f || (!f && matches?.has(node)) ? 1 : 0,
      ring: node === selected ? 1 : 0,
    }
  }
  const linkTargets = (link) => {
    const f = focus()
    const hi = !!f && (link.source === f || link.target === f)
    return { alpha: f ? (hi ? 1 : 0.08) : matches ? 0.25 : 1, highlight: hi ? 1 : 0 }
  }
  const approach = (obj, targets, k) => {
    if (!obj.anim) return (obj.anim = targets) // new on screen: start where it should be
    for (const key in targets) {
      const d = targets[key] - obj.anim[key]
      obj.anim[key] = Math.abs(d) < 0.002 ? targets[key] : obj.anim[key] + d * k
    }
  }
  function animate() {
    const now = performance.now()
    const dt = Math.min(100, now - lastFrame)
    lastFrame = now
    const k = reducedMotion.matches ? 1 : 1 - Math.exp(-dt / EASE_MS)
    const { nodes, links } = fg.graphData()
    for (const n of nodes) approach(n, nodeTargets(n), k)
    for (const l of links) approach(l, linkTargets(l), k)
  }

  // ---- drawing --------------------------------------------------------------------------------

  /** `strong` (0..1) grows the label from its zoom-dependent size to a readable highlight. */
  function drawLabel(node, ctx, scale, alpha, strong) {
    const size = lerp(LABEL_SIZE, Math.max(LABEL_SIZE, 11 / scale), smooth(strong))
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
    const { emphasis: a, highlight, accent, ring } = node.anim ?? nodeTargets(node)
    const r = radius(node)
    ctx.globalAlpha = a
    ctx.beginPath()
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
    ctx.fillStyle = nodeColor(node)
    ctx.fill()
    if (accent > 0) {
      // Cross-fade to the accent colour by painting it over the base colour.
      ctx.globalAlpha = a * accent
      ctx.fillStyle = colors.accent
      ctx.fill()
    }
    if (ring > 0) {
      ctx.globalAlpha = ring
      ctx.lineWidth = 1.5 / scale
      ctx.strokeStyle = colors.accent
      ctx.beginPath()
      ctx.arc(node.x, node.y, r + lerp(0, 2.5 / scale + 1, smooth(ring)), 0, 2 * Math.PI)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    // Labels fade in as you zoom, like Obsidian's "text fade threshold". Highlighted labels are
    // drawn later, on top of everything (see onRenderFramePost), and cross-fade with these.
    const t = settings.textFade
    const fade = clamp((scale - t) / (t * 0.5)) * a * (1 - highlight)
    if (fade > 0.01) drawLabel(node, ctx, scale, fade, 0)
  }

  function drawLink(link, ctx, scale) {
    const { alpha, highlight } = link.anim ?? linkTargets(link)
    // About 1px on screen, thickening only gently as you zoom in.
    const width = settings.linkWidth * (1 / scale + 0.12)
    const unrelated = isUnrelated(link)
    const line = (color, a, w) => {
      ctx.globalAlpha = a
      ctx.strokeStyle = color
      ctx.lineWidth = w
      ctx.setLineDash(unrelated ? UNRELATED_DASH : [])
      ctx.beginPath()
      ctx.moveTo(link.source.x, link.source.y)
      ctx.lineTo(link.target.x, link.target.y)
      ctx.stroke()
    }
    if (highlight < 1) line(unrelated ? colors.unrelated : colors.link, alpha * (1 - highlight), unrelated ? width * 1.3 : width)
    if (highlight > 0) line(colors.linkHi, alpha * highlight, width * lerp(1, 1.6, highlight))
    ctx.setLineDash([])
    ctx.globalAlpha = 1
  }

  // ---- the graph ------------------------------------------------------------------------------

  readColors()
  const fg = new ForceGraph(el)
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
    .onRenderFramePre(animate)
    .onRenderFramePost((ctx, scale) => {
      for (const node of fg.graphData().nodes) {
        const h = node.anim?.highlight ?? 0
        if (h > 0.01) drawLabel(node, ctx, scale, h, h)
      }
    })
    .onNodeHover((node) => {
      hovered = node
      el.style.cursor = node ? 'pointer' : ''
    })
    .onNodeClick((node, ev) => {
      nodeClicked = true
      onClick(node, ev)
    })
    .onNodeDragEnd((node) => {
      // Let the node settle back into the layout, as in Obsidian (fx/fy would pin it).
      node.fx = node.fy = undefined
    })

  const anchor = anchorForce()
  fg.d3Force('center', null) // the anchors keep the layout in place
  fg.d3Force('anchor', anchor)
  const applyForces = () => {
    anchor.strength(settings.anchor)
    // Short-range only: the layout already spreads things out, repulsion just keeps neighbours apart.
    fg.d3Force('charge').strength(-settings.repel * 6).distanceMax(40)
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
  const moved = () => (userMoved = true)
  el.addEventListener('wheel', moved, { passive: true })

  // Background clicks are detected here: given a background click handler, force-graph drops
  // any click, also on a node, during which the mouse moved at all. Node clicks still come from
  // force-graph, which allows a few pixels of movement for them.
  const CLICK_TOLERANCE = 5 // px
  let down = null // where the pointer went down
  let nodeClicked = false
  const onPointerDown = (ev) => {
    moved()
    down = ev.button === 0 ? [ev.clientX, ev.clientY] : null
    nodeClicked = false
  }
  const onPointerUp = (ev) => {
    if (!down || Math.hypot(ev.clientX - down[0], ev.clientY - down[1]) > CLICK_TOLERANCE) return
    down = null
    // force-graph reports node clicks on the next frame, before this callback runs.
    requestAnimationFrame(() => !nodeClicked && onBackground())
  }
  el.addEventListener('pointerdown', onPointerDown)
  el.addEventListener('pointerup', onPointerUp)

  const resize = new ResizeObserver(([e]) => fg.width(e.contentRect.width).height(e.contentRect.height))
  resize.observe(el)

  const scheme = matchMedia('(prefers-color-scheme: dark)')
  const onScheme = () => {
    readColors()
    fg.backgroundColor(colors.bg)
  }
  scheme.addEventListener('change', onScheme)

  return {
    /** The nodes currently drawn. */
    shown: () => fg.graphData().nodes,
    /** Hides the nodes of these categories (and those left without links). */
    setHidden(categories) {
      hidden = new Set(categories)
      fg.graphData(visibleData())
    },
    setMatches(set) {
      matches = set
    },
    /** Changes settings (keys of DEFAULTS); forces take effect at once. */
    setSettings(changes) {
      Object.assign(settings, changes)
      if (FORCE_KEYS.some((k) => k in changes)) applyForces()
    },
    /**
     * Selects a node (or none). With `center`, zooms to it, keeping it above a bottom sheet of
     * height `sheet` pixels.
     */
    select(node, { center = false, sheet = 0 } = {}) {
      selected = node
      if (!node || !center) return
      userMoved = true
      const zoom = Math.max(fg.zoom(), 2)
      fg.zoom(zoom, 600)
      fg.centerAt(node.x, node.y + sheet / 2 / zoom, 600)
    },
    zoomBy(factor) {
      userMoved = true
      fg.zoom(fg.zoom() * factor, 250)
    },
    fit() {
      userMoved = true
      fit()
    },
    destroy() {
      resize.disconnect()
      scheme.removeEventListener('change', onScheme)
      el.removeEventListener('wheel', moved)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointerup', onPointerUp)
      fg._destructor()
    },
  }
}
