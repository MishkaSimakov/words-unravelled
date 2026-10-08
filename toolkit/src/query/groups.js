// Grouping into lists by key, the way the indexes and checks are built.

/** Adds `value` to the list under `key` in `map`. */
export function addTo(map, key, value) {
  if (!map.has(key)) map.set(key, [])
  map.get(key).push(value)
}

/** A Map from keyOf(item) to the items with that key, in their order. */
export function groupBy(items, keyOf) {
  const groups = new Map()
  for (const item of items) addTo(groups, keyOf(item), item)
  return groups
}
