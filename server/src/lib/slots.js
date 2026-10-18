const OFFSET_MIN = Number(process.env.CAMPUS_TZ_OFFSET_MIN ?? 330) // IST = UTC+5:30

export const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export const fromMinutes = (n) =>
  `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`

const parts = (dateStr) => dateStr.split('-').map(Number)

export function isValidDateStr(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const [y, m, d] = parts(s)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

// "2026-10-20" + 600 minutes (10:00 campus time) -> real UTC Date
export function localToUtc(dateStr, minutes) {
  const [y, m, d] = parts(dateStr)
  return new Date(Date.UTC(y, m - 1, d, 0, minutes) - OFFSET_MIN * 60000)
}

export const todayLocal = () =>
  new Date(Date.now() + OFFSET_MIN * 60000).toISOString().slice(0, 10)

export const weekdayOf = (dateStr) => {
  const [y, m, d] = parts(dateStr)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0 = Sunday
}

export const addDays = (dateStr, n) => {
  const [y, m, d] = parts(dateStr)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

export function generateSlots(service, dateStr) {
  const open = toMinutes(service.openTime)
  const close = toMinutes(service.closeTime)
  const len = service.slotMinutes
  const slots = []
  for (let t = open; t + len <= close; t += len) {
    slots.push({
      label: fromMinutes(t),
      start: localToUtc(dateStr, t),
      end: localToUtc(dateStr, t + len),
    })
  }
  return slots
}

// Returns an error message, or null if the date can be booked
export function checkBookableDate(service, dateStr) {
  if (!isValidDateStr(dateStr)) return 'Date must be a real date in YYYY-MM-DD format'
  const today = todayLocal()
  if (dateStr < today) return 'You cannot book a date in the past'
  if (dateStr > addDays(today, service.advanceDays)) {
    return `Bookings open only ${service.advanceDays} days ahead`
  }
  if (!service.openDays.includes(weekdayOf(dateStr))) return 'This service is closed on that day'
  return null
}