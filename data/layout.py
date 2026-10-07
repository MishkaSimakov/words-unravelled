#!/usr/bin/env python3
"""Compute where each entry sits on the site's graph page.

Reads:
    data/entries.json        built by data/build.py
Writes:
    data/graph-layout.json   {slug: [x, y]} for every entry in the graph, in graph units (a link
                             is about 30)

The graph has an edge between two entries when a mention note of one links to the other, except
for "see" links: they are most of the links but the loosest, and would tie most entries into one
tangle. Entries without other links are left out, as on the graph page. The connected components
are laid out one by one, then arranged like a galaxy: the largest component is the core, at the
origin, and the others are islands around it, bigger ones nearer the core, none overlapping.

Each component is drawn by stress majorization: entries try to sit LINK units apart per link on
the shortest path between them, which draws the mostly tree-shaped components as clean branching
shapes without the long taut chains a force simulation leaves. Everything is seeded, so the same
entries give the same layout.

The site loads the positions and anchors each node to its own position, so re-run this after
data/build.py when entries or links change (entries without a position go to the edge of the
graph until then).

Needs numpy: pip install -r data/requirements.txt
"""
import json
import sys
import time
from collections import deque
from pathlib import Path

import numpy as np

DATA = Path(__file__).resolve().parent
LINK = 30.0  # the page's link distance
STRESS_ITERATIONS = 300
MIN_GAP = 20.0  # closest two entries of a component may be (entries with the same links would coincide)
PAD = 12.0  # empty space kept around each island
CORE_GAP = 60.0  # extra space between the core's entries and the islands
FILL = 0.45  # share of the island belt covered by islands
SEED = 1
IGNORED_LINK_TYPES = {"see"}


def build_graph(entries):
    """Slugs and undirected adjacency sets, from the resolved links in mention notes."""
    slugs = [e["slug"] for e in entries]
    index = {s: i for i, s in enumerate(slugs)}
    adj = [set() for _ in slugs]
    for i, e in enumerate(entries):
        for m in e["mentions"]:
            for link in m.get("links") or []:
                j = index.get(link.get("slug"))
                if j is not None and j != i and link["type"] not in IGNORED_LINK_TYPES:
                    adj[i].add(j)
                    adj[j].add(i)
    return slugs, adj


def components(adj):
    """Connected components, largest first (ties by first member, so the order is stable)."""
    seen = [False] * len(adj)
    comps = []
    for start in range(len(adj)):
        if seen[start]:
            continue
        seen[start] = True
        comp, queue = [], deque([start])
        while queue:
            v = queue.popleft()
            comp.append(v)
            for w in adj[v]:
                if not seen[w]:
                    seen[w] = True
                    queue.append(w)
        comps.append(sorted(comp))
    return sorted(comps, key=lambda c: (-len(c), c[0]))


def hop_distances(adj, comp):
    """Shortest-path lengths (in links) between all members of a component."""
    local = {v: i for i, v in enumerate(comp)}
    n = len(comp)
    dist = np.zeros((n, n))
    for i, source in enumerate(comp):
        row = dist[i]
        seen = {source}
        frontier, d = [source], 0
        while frontier:
            d += 1
            nxt = []
            for v in frontier:
                for w in adj[v]:
                    if w not in seen:
                        seen.add(w)
                        row[local[w]] = d
                        nxt.append(w)
            frontier = nxt
    return dist


def stress_layout(adj, comp, rng):
    """Positions for one component, centred on the origin."""
    n = len(comp)
    if n == 1:
        return np.zeros((1, 2))
    if n == 2:
        return np.array([[-LINK / 2, 0.0], [LINK / 2, 0.0]])
    D = hop_distances(adj, comp) * LINK
    # Start from classical MDS (deterministic, and already close), nudged so no two coincide.
    J = np.eye(n) - 1 / n
    B = -0.5 * J @ (D ** 2) @ J
    values, vectors = np.linalg.eigh(B)
    X = vectors[:, -2:] * np.sqrt(np.maximum(values[-2:], 1e-9))
    X += rng.normal(scale=LINK * 0.05, size=X.shape)
    # Stress majorization, weights 1/d^2, each entry moving to where its distances fit best:
    # x_i = sum_j w_ij (x_j + d_ij (x_i - x_j) / |x_i - x_j|) / sum_j w_ij
    W = np.zeros_like(D)
    W[D > 0] = D[D > 0] ** -2.0
    wsum = W.sum(1)[:, None]
    WD = W * D
    for _ in range(STRESS_ITERATIONS):
        sq = (X ** 2).sum(1)
        dist = np.sqrt(np.maximum(sq[:, None] + sq[None, :] - 2 * X @ X.T, 1e-6))
        A = WD / dist  # sum_j A_ij (x_i - x_j) = x_i * sum_j A_ij - (A @ X)_i
        X = (W @ X + X * A.sum(1)[:, None] - A @ X) / wsum
    return separate(X - X.mean(0))


def separate(X, sweeps=50):
    """Push apart entries closer than MIN_GAP, a little at a time so the shape keeps."""
    for _ in range(sweeps):
        diff = X[:, None, :] - X[None, :, :]
        dist = np.sqrt((diff ** 2).sum(-1))
        np.fill_diagonal(dist, np.inf)
        overlap = np.maximum(MIN_GAP - dist, 0)
        if not overlap.any():
            break
        dist = np.maximum(dist, 1e-6)
        X = X + 0.25 * ((overlap / dist)[:, :, None] * diff).sum(1)
    return X - X.mean(0)


def place_islands(core, radii, rng, sweeps=300):
    """Centres for island circles around the core's entries (`core`, fixed points around the
    origin): bigger islands (listed first) nearer the core, spread so that islands cover about
    FILL of their belt, none overlapping each other or coming within CORE_GAP of the core."""
    radii = np.asarray(radii, float)
    n = len(radii)
    if not n:
        return np.zeros((0, 2))
    # Target distance from the centre: the island's place in the cumulative area, as rings,
    # starting where most of the core ends (its outermost branches reach further).
    areas = np.pi * radii ** 2
    inner = np.percentile(np.sqrt((core ** 2).sum(1)), 90) + CORE_GAP
    target_r = np.sqrt(inner ** 2 + (np.cumsum(areas) - areas / 2) / (np.pi * FILL))
    angle = rng.uniform(0, 2 * np.pi, n)
    target = np.c_[target_r * np.cos(angle), target_r * np.sin(angle)]
    # Core entries are fixed circles the islands must keep clear of.
    C = np.vstack([target, core])
    R = np.r_[radii, np.full(len(core), CORE_GAP)]
    moves = np.r_[np.ones(n), np.zeros(len(core))]
    pairs = None
    for sweep in range(sweeps):
        if sweep % 20 == 0:
            i, j = close_pairs(C, R)
            keep = (i < n) | (j < n)  # core entries never push each other
            pairs = i[keep], j[keep]
        C[:n] += 0.05 * (target - C[:n])  # a weak pull back towards the target
        i, j = pairs
        diff = C[i] - C[j]
        dist = np.maximum(np.sqrt((diff ** 2).sum(1)), 1e-6)
        overlap = np.maximum(R[i] + R[j] - dist, 0)
        # Two islands share the push; an island against a core entry takes all of it.
        share_i = moves[i] / np.maximum(moves[i] + moves[j], 1)
        push = (overlap / dist)[:, None] * diff
        np.add.at(C, i, push * share_i[:, None])
        np.add.at(C, j, -push * (1 - share_i)[:, None] * moves[j][:, None])
    return C[:n]


def close_pairs(C, radii, slack=80.0):
    """Index pairs of circles that are near each other (they may collide in the next sweeps)."""
    out_i, out_j = [], []
    for start in range(0, len(C), 512):
        block = C[start:start + 512]
        dist = np.sqrt(((block[:, None, :] - C[None, :, :]) ** 2).sum(-1))
        reach = radii[start:start + 512, None] + radii[None, :] + slack
        i, j = np.nonzero(dist < reach)
        i += start
        keep = i < j
        out_i.append(i[keep])
        out_j.append(j[keep])
    return np.concatenate(out_i), np.concatenate(out_j)


def galaxy_layout(entries):
    """{slug: [x, y]} for every entry with a link, and the components they form."""
    rng = np.random.default_rng(SEED)
    slugs, adj = build_graph(entries)
    comps = [c for c in components(adj) if len(c) > 1]
    shapes = []
    for comp in comps:
        X = stress_layout(adj, comp, rng)
        a = rng.uniform(0, 2 * np.pi)  # islands face random ways
        R = np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]])
        shapes.append(X @ R.T)
    radius = lambda X: float(np.sqrt((X ** 2).sum(1)).max())
    centres = place_islands(shapes[0], [radius(X) + PAD for X in shapes[1:]], rng)
    layout = {}
    for comp, X, c in zip(comps, shapes, [np.zeros(2), *centres]):
        for v, (x, y) in zip(comp, X + c):
            layout[slugs[v]] = [round(float(x)), round(float(y))]
    return dict(sorted(layout.items())), comps


def main():
    t0 = time.time()
    entries = json.loads((DATA / "entries.json").read_text(encoding="utf-8"))
    layout, comps = galaxy_layout(entries)
    out = DATA / "graph-layout.json"
    out.write_text(json.dumps(layout, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{len(layout)} linked entries: a core of {len(comps[0])} and {len(comps) - 1} islands "
          f"-> {out.relative_to(DATA.parent)} ({time.time() - t0:.0f} s)", file=sys.stderr)


if __name__ == "__main__":
    main()
