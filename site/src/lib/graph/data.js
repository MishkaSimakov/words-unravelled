// The link graph and its galaxy layout, built once per loaded dataset (the index changes when the
// data is reloaded after an edit).
import { linkGraph } from './graph.js'
import { galaxyLayout } from './layout.js'
import { db } from '../db.js'

const graphs = new WeakMap() // index -> link graph
const layouts = new WeakMap() // index -> layout

/** The link graph of the loaded data (graph.js). */
export function currentGraph() {
  if (!graphs.has(db.index)) graphs.set(db.index, linkGraph(db.index))
  return graphs.get(db.index)
}

/** The galaxy layout of the loaded data's link graph (layout.js). */
export function currentLayout() {
  if (!layouts.has(db.index)) layouts.set(db.index, galaxyLayout(currentGraph()))
  return layouts.get(db.index)
}

/** Whether the graph page shows this entry. */
export const inGraph = (entry) => currentGraph().neighbors.has(entry)
