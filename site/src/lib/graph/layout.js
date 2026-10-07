// Where each entry sits on the site's graph page: the link graph (graph.js) laid out like a galaxy.
//
// The graph's connected components are drawn one by one, then arranged around the largest one,
// which is the core, at the origin: the others are islands, bigger ones nearer the core, none
// overlapping. Each component is drawn by stress majorization: entries try to sit LINK units apart
// per link on the shortest path between them, which draws the mostly tree-shaped components as
// clean branching shapes. Everything is seeded, so the same graph gives the same layout.

export const LINK = 30 // the graph page's link distance, in graph units
const STRESS_ITERATIONS = 300
const MIN_GAP = 20 // closest two entries of a component may be (entries with the same links would coincide)
const PAD = 12 // empty space kept around each island
const CORE_GAP = 60 // extra space between the core's entries and the islands
const FILL = 0.45 // share of the island belt covered by islands
const SEED = 1

/** A seeded random number generator (mulberry32): () -> [0, 1). */
function random(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const gaussian = (rand) => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand())

/** Components as lists of node indices, largest first (ties by first member, so the order is stable). */
export function components(adj) {
  const seen = new Array(adj.length).fill(false)
  const comps = []
  for (let start = 0; start < adj.length; start++) {
    if (seen[start]) continue
    seen[start] = true
    const comp = []
    for (let queue = [start]; queue.length; ) {
      const v = queue.shift()
      comp.push(v)
      for (const w of adj[v]) if (!seen[w]) (seen[w] = true), queue.push(w)
    }
    comps.push(comp.sort((x, y) => x - y))
  }
  return comps.sort((x, y) => y.length - x.length || x[0] - y[0])
}

/** Shortest-path lengths in links between all members of a component, as an n x n array of rows. */
function hopDistances(adj, comp) {
  const local = new Map(comp.map((v, i) => [v, i]))
  return comp.map((source) => {
    const row = new Float64Array(comp.length)
    const seen = new Set([source])
    for (let frontier = [source], d = 1; frontier.length; d++) {
      const next = []
      for (const v of frontier) {
        for (const w of adj[v]) {
          if (seen.has(w)) continue
          seen.add(w)
          row[local.get(w)] = d
          next.push(w)
        }
      }
      frontier = next
    }
    return row
  })
}

/**
 * The two leading eigenvectors of a symmetric matrix, scaled by the square roots of their
 * eigenvalues (classical MDS), by power iteration with deflation.
 */
function topTwo(B, rand) {
  const n = B.length
  const X = Array.from({ length: n }, () => [0, 0])
  const found = []
  const w = new Float64Array(n)
  for (let k = 0; k < 2; k++) {
    let v = Float64Array.from({ length: n }, () => gaussian(rand))
    let value = 0
    for (let it = 0; it < 200; it++) {
      for (let i = 0; i < n; i++) {
        let s = 0
        for (let j = 0; j < n; j++) s += B[i][j] * v[j]
        w[i] = s
      }
      for (const [u, lambda] of found) {
        let dot = 0
        for (let j = 0; j < n; j++) dot += u[j] * v[j]
        for (let j = 0; j < n; j++) w[j] -= lambda * dot * u[j]
      }
      let norm = 0, rayleigh = 0
      for (let j = 0; j < n; j++) (norm += w[j] * w[j]), (rayleigh += w[j] * v[j])
      norm = Math.sqrt(norm) || 1
      let change = 0
      for (let j = 0; j < n; j++) {
        const next = w[j] / norm
        change += Math.abs(next - v[j])
        v[j] = next
      }
      const converged = Math.abs(rayleigh - value) <= 1e-9 * Math.abs(rayleigh) && change < 1e-9 * n
      value = rayleigh
      if (converged) break
    }
    found.push([v, value])
    for (let i = 0; i < n; i++) X[i][k] = v[i] * Math.sqrt(Math.max(value, 1e-9))
  }
  return X
}

/** Positions [[x, y]] for one component, centred on the origin. */
export function stressLayout(adj, comp, rand) {
  const n = comp.length
  if (n === 1) return [[0, 0]]
  if (n === 2) return [[-LINK / 2, 0], [LINK / 2, 0]]
  const D = hopDistances(adj, comp).map((row) => row.map((d) => d * LINK))
  // Start from classical MDS (deterministic, and already close), nudged so no two coincide.
  const sq = D.map((row) => row.map((d) => d * d))
  const rowMean = sq.map((row) => row.reduce((s, x) => s + x, 0) / n)
  const mean = rowMean.reduce((s, x) => s + x, 0) / n
  const B = sq.map((row, i) => row.map((x, j) => -0.5 * (x - rowMean[i] - rowMean[j] + mean)))
  const start = topTwo(B, rand)
  let xs = Float64Array.from(start, ([x]) => x + gaussian(rand) * LINK * 0.05)
  let ys = Float64Array.from(start, ([, y]) => y + gaussian(rand) * LINK * 0.05)
  // Stress majorization, weights 1/d^2, each entry moving to where its distances fit best:
  // x_i = sum_j w_ij (x_j + d_ij (x_i - x_j) / |x_i - x_j|) / sum_j w_ij
  let nx = new Float64Array(n), ny = new Float64Array(n)
  for (let it = 0; it < STRESS_ITERATIONS; it++) {
    let moved = 0
    for (let i = 0; i < n; i++) {
      let sx = 0, sy = 0, sw = 0
      const Di = D[i], xi = xs[i], yi = ys[i]
      for (let j = 0; j < n; j++) {
        if (j === i) continue
        const d = Di[j], w = 1 / (d * d)
        const dx = xi - xs[j], dy = yi - ys[j]
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1e-3)
        sx += w * (xs[j] + (d * dx) / dist)
        sy += w * (ys[j] + (d * dy) / dist)
        sw += w
      }
      nx[i] = sx / sw
      ny[i] = sy / sw
      moved = Math.max(moved, Math.abs(nx[i] - xi), Math.abs(ny[i] - yi))
    }
    ;[xs, nx] = [nx, xs]
    ;[ys, ny] = [ny, ys]
    if (moved < 0.01) break // settled
  }
  return centred(separate(Array.from(xs, (x, i) => [x, ys[i]])))
}

/** Pushes apart entries closer than MIN_GAP, a little at a time so the shape keeps. */
function separate(X) {
  for (let sweep = 0; sweep < 50; sweep++) {
    let moved = false
    const push = X.map(() => [0, 0])
    for (let i = 0; i < X.length; i++) {
      for (let j = i + 1; j < X.length; j++) {
        const dx = X[i][0] - X[j][0], dy = X[i][1] - X[j][1]
        const dist = Math.hypot(dx, dy)
        if (dist >= MIN_GAP - 0.5) continue // the push only ever halves the overlap
        moved = true
        const f = (0.25 * (MIN_GAP - dist)) / Math.max(dist, 1e-6)
        push[i][0] += f * dx, push[i][1] += f * dy
        push[j][0] -= f * dx, push[j][1] -= f * dy
      }
    }
    if (!moved) break
    X = X.map(([x, y], i) => [x + push[i][0], y + push[i][1]])
  }
  return X
}

function centred(X) {
  const cx = X.reduce((s, p) => s + p[0], 0) / X.length
  const cy = X.reduce((s, p) => s + p[1], 0) / X.length
  return X.map(([x, y]) => [x - cx, y - cy])
}

/**
 * Index pairs [i, j], i < j, of circles near each other (they may collide in the next sweeps),
 * found on a grid with cells at least as wide as the widest reach, so only neighbouring cells meet.
 */
function closePairs(C, R, slack = 80) {
  const cell = 2 * Math.max(...R) + slack
  const grid = new Map()
  C.forEach(([x, y], i) => {
    const key = `${Math.floor(x / cell)},${Math.floor(y / cell)}`
    if (!grid.has(key)) grid.set(key, [])
    grid.get(key).push(i)
  })
  const pairs = []
  C.forEach(([x, y], i) => {
    const cx = Math.floor(x / cell), cy = Math.floor(y / cell)
    for (let gx = cx - 1; gx <= cx + 1; gx++) {
      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        for (const j of grid.get(`${gx},${gy}`) ?? []) {
          if (j > i && Math.hypot(x - C[j][0], y - C[j][1]) < R[i] + R[j] + slack) pairs.push([i, j])
        }
      }
    }
  })
  return pairs
}

/**
 * Centres for island circles of the given radii (biggest first) around the core's entries (fixed
 * points around the origin): bigger islands nearer the core, spread so that islands cover about
 * FILL of their belt, none overlapping each other or coming within CORE_GAP of the core.
 */
export function placeIslands(core, radii, rand, sweeps = 300) {
  const n = radii.length
  if (!n) return []
  // Target distance from the centre: the island's place in the cumulative area, as rings,
  // starting where most of the core ends (its outermost branches reach further).
  const coreR = core.map(([x, y]) => Math.hypot(x, y)).sort((a, b) => a - b)
  const inner = coreR[Math.floor(0.9 * (coreR.length - 1))] + CORE_GAP
  let area = 0
  const target = radii.map((r) => {
    const a = Math.PI * r * r
    area += a
    const dist = Math.sqrt(inner * inner + (area - a / 2) / (Math.PI * FILL))
    const angle = rand() * 2 * Math.PI
    return [dist * Math.cos(angle), dist * Math.sin(angle)]
  })
  // Core entries are fixed circles the islands must keep clear of.
  const C = [...target.map((p) => [...p]), ...core.map((p) => [...p])]
  const R = [...radii, ...core.map(() => CORE_GAP)]
  const xs = Float64Array.from(C, (p) => p[0]), ys = Float64Array.from(C, (p) => p[1])
  const px = new Float64Array(n), py = new Float64Array(n)
  let pi = [], pj = []
  for (let sweep = 0; sweep < sweeps; sweep++) {
    if (sweep % 20 === 0) {
      const pairs = closePairs(Array.from(xs, (x, i) => [x, ys[i]]), R).filter(([i, j]) => i < n || j < n)
      pi = Int32Array.from(pairs, (p) => p[0])
      pj = Int32Array.from(pairs, (p) => p[1])
    }
    px.fill(0)
    py.fill(0)
    for (let i = 0; i < n; i++) {
      xs[i] += 0.05 * (target[i][0] - xs[i]) // a weak pull back towards the target
      ys[i] += 0.05 * (target[i][1] - ys[i])
    }
    for (let k = 0; k < pi.length; k++) {
      const i = pi[k], j = pj[k]
      const dx = xs[i] - xs[j], dy = ys[i] - ys[j]
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1e-6)
      const overlap = R[i] + R[j] - dist
      if (overlap <= 0) continue
      // Two islands share the push; an island against a core entry (j >= n) takes all of it.
      const f = (overlap / dist) * (j < n ? 0.5 : 1)
      px[i] += f * dx, py[i] += f * dy
      if (j < n) px[j] -= f * dx, py[j] -= f * dy
    }
    for (let i = 0; i < n; i++) xs[i] += px[i], ys[i] += py[i]
  }
  return Array.from({ length: n }, (_, i) => [xs[i], ys[i]])
}

/**
 * The galaxy layout of a link graph (graph.js): Map of slug -> [x, y] for every entry in it, in
 * graph units, rounded.
 */
export function galaxyLayout(graph) {
  const rand = random(SEED)
  const index = new Map(graph.entries.map((e, i) => [e, i]))
  const adj = graph.entries.map((e) => [...graph.neighbors.get(e)].map((o) => index.get(o)).sort((x, y) => x - y))
  const comps = components(adj)
  const shapes = comps.map((comp) => {
    const a = rand() * 2 * Math.PI // islands face random ways
    const [c, s] = [Math.cos(a), Math.sin(a)]
    return stressLayout(adj, comp, rand).map(([x, y]) => [x * c - y * s, x * s + y * c])
  })
  const radius = (X) => Math.max(...X.map(([x, y]) => Math.hypot(x, y)))
  const centres = [[0, 0], ...placeIslands(shapes[0] ?? [], shapes.slice(1).map((X) => radius(X) + PAD), rand)]
  const layout = new Map()
  comps.forEach((comp, k) => {
    comp.forEach((v, i) => {
      const [x, y] = shapes[k][i]
      layout.set(graph.entries[v].slug, [Math.round(x + centres[k][0]), Math.round(y + centres[k][1])])
    })
  })
  return layout
}
