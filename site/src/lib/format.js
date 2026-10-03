export const fmtNumber = (n) => n.toLocaleString('en-US')
export const plural = (n, one, many = one + 's') => `${fmtNumber(n)} ${n === 1 ? one : many}`

export function fmtTime(t) {
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = String(t % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

export function fmtDate(date) {
  if (!date) return ''
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}
