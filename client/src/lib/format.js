export const CATEGORY_LABELS = {
  hall: 'Halls',
  lab: 'Labs',
  sports: 'Sports',
  library: 'Library',
  equipment: 'Equipment',
  mentoring: 'Mentoring',
}

export const formatPrice = (p) =>
  p === 0
    ? 'Free'
    : `${new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(p)} / slot`

// ---- campus time helpers (campus runs on IST, UTC+5:30) ----
export const campusToday = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10)

export const addDaysStr = (dateStr, n) => {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export const dayParts = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00Z`)
  return {
    weekday: d.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' }),
    day: d.getUTCDate(),
    month: d.toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' }),
  }
}

export const formatTimeIST = (iso) =>
  new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  })

export const STATUS_LABELS = {
  pending_approval: 'Waiting for approval',
  awaiting_payment: 'Awaiting payment',
  confirmed: 'Confirmed',
  checked_in: 'Checked in',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  expired: 'Expired',
  no_show: 'No show',
}