// Counts the times the data was loaded, so that pages showing it can follow a reload (after an
// edit in debug mode) without being rendered afresh.
export const dataVersion = $state({ n: 0 })
