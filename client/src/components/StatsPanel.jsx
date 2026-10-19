import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../lib/api.js'

const RANGES = [7, 30, 90]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const GRID = 'var(--color-line, #d9d3c7)'
const TICK = { fontSize: 12, fill: 'var(--color-muted, #6b7280)' }

const rupees = (n) => `₹${new Intl.NumberFormat('en-IN').format(n)}`
const shortDate = (s) => {
  const [, m, d] = s.split('-')
  return `${Number(d)} ${MONTHS[Number(m) - 1]}`
}

function Tip({ active, payload, label, format }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-soft">
      <p className="text-muted">{label}</p>
      <p className="font-medium text-ink">{format(payload[0].value)}</p>
    </div>
  )
}

function Tile({ label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-display text-4xl text-ink">{value}</p>
    </div>
  )
}

function ChartCard({ title, note, children }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      {note && <p className="mt-1 text-sm text-muted">{note}</p>}
      <div className="mt-4 h-56 text-accent-strong">{children}</div>
    </section>
  )
}

export default function StatsPanel() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let off = false
    api
      .get('/stats/overview', { params: { days } })
      .then((res) => {
        if (off) return
        setData(res.data)
        setError('')
      })
      .catch((err) => {
        if (!off) setError(err.userMessage || 'Could not load analytics')
      })
    return () => {
      off = true
    }
  }, [days])

  const rows = data?.perDay.map((d) => ({ ...d, label: shortDate(d.date) })) ?? []

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl text-ink">Analytics</h2>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={`rounded-full border px-4 py-1.5 text-sm whitespace-nowrap transition-colors ${
                days === r
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-line text-muted hover:text-ink'
              }`}
            >
              {r} days
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-danger">{error}</p>}

      {!data && !error ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      ) : (
        data && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Tile label={`Bookings (${days} days)`} value={data.totals.bookings} />
              <Tile label="Revenue" value={rupees(data.totals.revenue)} />
              <Tile label="Awaiting approval" value={data.totals.pending} />
              <Tile label="Cancelled or rejected" value={`${data.totals.lostRate}%`} />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <ChartCard title="Bookings per day" note="New booking requests by the day they were made">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rows} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis tick={TICK} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: 'currentColor', fillOpacity: 0.08 }}
                      content={<Tip format={(v) => `${v} booking${v === 1 ? '' : 's'}`} />}
                    />
                    <Bar dataKey="bookings" fill="currentColor" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Revenue per day" note="Paid bookings, by the day payment was received">
                {data.totals.revenue === 0 ? (
                  <p className="grid h-full place-items-center text-sm text-muted">No payments in this period.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={rows} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke={GRID} />
                      <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={false} minTickGap={24} />
                      <YAxis tick={TICK} tickLine={false} axisLine={false} />
                      <Tooltip
                        cursor={{ stroke: GRID }}
                        content={<Tip format={rupees} />}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="currentColor"
                        strokeWidth={2}
                        fill="currentColor"
                        fillOpacity={0.12}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>

            <div className="mt-4">
              <ChartCard title="Most booked services" note="Active and completed bookings in this period">
                {data.topServices.length === 0 ? (
                  <p className="grid h-full place-items-center text-sm text-muted">No bookings in this period.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topServices} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid horizontal={false} stroke={GRID} />
                      <XAxis type="number" tick={TICK} tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={140}
                        tick={TICK}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(n) => (n.length > 20 ? `${n.slice(0, 19)}…` : n)}
                      />
                      <Tooltip
                        cursor={{ fill: 'currentColor', fillOpacity: 0.08 }}
                        content={<Tip format={(v) => `${v} booking${v === 1 ? '' : 's'}`} />}
                      />
                      <Bar dataKey="count" fill="currentColor" radius={[0, 4, 4, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>

            <details className="mt-4 rounded-2xl border border-line bg-surface p-5">
              <summary className="cursor-pointer text-sm text-muted">View the numbers as a table</summary>
              <div className="mt-3 max-h-64 overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-muted">
                    <tr>
                      <th className="py-1 pr-4 font-normal">Day</th>
                      <th className="py-1 pr-4 font-normal">Bookings</th>
                      <th className="py-1 font-normal">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.date} className="border-t border-line text-ink">
                        <td className="py-1 pr-4">{r.label}</td>
                        <td className="py-1 pr-4">{r.bookings}</td>
                        <td className="py-1">{rupees(r.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )
      )}
    </section>
  )
}