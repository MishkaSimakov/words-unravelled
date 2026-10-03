"""Tests for data/layout.py (skipped when numpy isn't installed).

    python3 -m unittest discover data/test
"""
import sys
import unittest
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(DATA))

try:
    import numpy as np
    import layout
except ImportError:  # numpy missing: pip install -r data/requirements.txt
    layout = None


def entry(slug, *targets):
    links = [{"type": "see", "uncertain": False, "target": t, "slug": t, "start": 0, "end": 1}
             for t in targets]
    return {"slug": slug, "term": slug, "mentions": [{"note": "x", "links": links}]}


@unittest.skipUnless(layout, "needs numpy")
class LayoutTest(unittest.TestCase):
    def test_graph_ignores_self_unknown_and_repeated_links(self):
        slugs, adj = layout.build_graph([entry("a", "b", "b", "a", "nowhere"), entry("b", "a")])
        self.assertEqual(slugs, ["a", "b"])
        self.assertEqual(adj, [{1}, {0}])

    def test_components_largest_first(self):
        entries = [entry("a"), entry("b", "c"), entry("c", "d"), entry("d"), entry("e", "a")]
        _, adj = layout.build_graph(entries)
        self.assertEqual(layout.components(adj), [[1, 2, 3], [0, 4]])

    def test_path_is_drawn_with_link_length_steps(self):
        _, adj = layout.build_graph([entry("a", "b"), entry("b", "c"), entry("c", "d"), entry("d")])
        X = layout.stress_layout(adj, [0, 1, 2, 3], np.random.default_rng(0))
        steps = np.linalg.norm(np.diff(X, axis=0), axis=1)
        np.testing.assert_allclose(steps, layout.LINK, rtol=0.05)
        self.assertAlmostEqual(np.linalg.norm(X[3] - X[0]), 3 * layout.LINK, delta=layout.LINK * 0.15)

    def test_every_entry_placed_and_islands_clear_of_core_and_each_other(self):
        # A core (a star of 12) and twenty islands: pairs, triangles and single entries.
        entries = [entry("hub", *[f"leaf{i}" for i in range(12)])]
        entries += [entry(f"leaf{i}") for i in range(12)]
        for k in range(8):
            entries += [entry(f"p{k}a", f"p{k}b"), entry(f"p{k}b")]
        for k in range(6):
            entries += [entry(f"t{k}a", f"t{k}b"), entry(f"t{k}b", f"t{k}c"), entry(f"t{k}c", f"t{k}a")]
        entries += [entry(f"single{k}") for k in range(6)]
        positions, comps = layout.galaxy_layout(entries)
        self.assertEqual(set(positions), {e["slug"] for e in entries})
        slugs = [e["slug"] for e in entries]
        P = np.array([positions[s] for s in slugs], float)
        core = P[comps[0]]
        circles = [(P[c].mean(0), np.linalg.norm(P[c] - P[c].mean(0), axis=1).max()) for c in comps[1:]]
        for k, (c, r) in enumerate(circles):
            self.assertGreater(np.linalg.norm(core - c, axis=1).min(), r)
            for c2, r2 in circles[k + 1:]:
                self.assertGreater(np.linalg.norm(c - c2), r + r2)

    def test_same_entries_same_layout(self):
        entries = [entry("a", "b"), entry("b", "c"), entry("c"), entry("d", "e"), entry("e"), entry("f")]
        self.assertEqual(layout.galaxy_layout(entries)[0], layout.galaxy_layout(entries)[0])


if __name__ == "__main__":
    unittest.main()
