const BASE = 'http://localhost:5000/api'
const N = 10

async function api(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data, setCookie: res.headers.getSetCookie?.() ?? [] }
}

const campusDate = (daysAhead) =>
  new Date(Date.now() + daysAhead * 86400000 + 330 * 60000).toISOString().slice(0, 10)

const list = await api('/services?q=badminton')
const service = list.data.services[0]
const date = campusDate(2)
const startTime = '11:00' // change this if you re-run and the slot is already taken

console.log(`${N} users racing for "${service.name}" on ${date} at ${startTime} (capacity ${service.capacity})`)

const stamp = Date.now()
const cookies = []
for (let i = 1; i <= N; i++) {
  const r = await api('/auth/register', {
    method: 'POST',
    body: { name: `Racer ${i}`, email: `racer${i}_${stamp}@campus.test`, password: 'Racer12345' },
  })
  if (!r.setCookie[0]) throw new Error(`Registration failed: ${JSON.stringify(r.data)}`)
  cookies.push(r.setCookie[0].split(';')[0])
}

// Fire all requests at the same moment
const results = await Promise.all(
  cookies.map((cookie) =>
    api('/bookings', { method: 'POST', cookie, body: { serviceId: service._id, date, startTime } })
  )
)

const won = results.filter((r) => r.status === 201).length
const lost = results.filter((r) => r.status === 409).length
console.log(`Booked: ${won} | Turned away (409): ${lost} | Other: ${N - won - lost}`)
console.log(won === service.capacity ? 'PASS: no overbooking' : 'FAIL: capacity was exceeded')