import { useCallback, useEffect, useMemo, useState } from 'react'
import Modal from '../Modal.jsx'
import ServiceImage from '../ServiceImage.jsx'
import Input from '../ui/Input.jsx'
import { api } from '../../lib/api.js'
import { CATEGORY_LABELS, formatPrice } from '../../lib/format.js'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SLOT_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240]
const ROLES_ALLOWED = [
  ['student', 'Students'],
  ['faculty', 'Faculty'],
]

const fieldClass =
  'w-full rounded-xl border border-line bg-surface px-4 text-[15px] text-ink outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/15'

function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-sm text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-sm text-muted">{hint}</span>
      ) : null}
    </label>
  )
}

function Pill({ on, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm whitespace-nowrap transition-colors ${
        on ? 'border-primary bg-primary text-on-primary' : 'border-line text-muted hover:border-accent/60 hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

const toForm = (s) => ({
  name: s?.name ?? '',
  category: s?.category ?? 'hall',
  location: s?.location ?? '',
  description: s?.description ?? '',
  price: String(s?.price ?? 0),
  capacity: String(s?.capacity ?? 1),
  slotMinutes: String(s?.slotMinutes ?? 60),
  openTime: s?.openTime ?? '09:00',
  closeTime: s?.closeTime ?? '17:00',
  openDays: s?.openDays ?? [1, 2, 3, 4, 5, 6],
  advanceDays: String(s?.advanceDays ?? 14),
  requiresApproval: s?.requiresApproval ?? true,
  bookableBy: s?.bookableBy ?? ['student', 'faculty'],
  manager: s?.manager?._id ?? s?.manager ?? '',
  image: s?.images?.[0] ?? '',
})

const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function ServiceForm({ service, managers, onSaved, onCancel }) {
  const editing = !!service
  const [f, setF] = useState(() => toForm(service))
  const [errors, setErrors] = useState({})
  const [banner, setBanner] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (key, value) => setF((prev) => ({ ...prev, [key]: value }))
  const toggleIn = (key, value) =>
    setF((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((x) => x !== value) : [...prev[key], value],
    }))

  const slotOptions = useMemo(
    () => [...new Set([...SLOT_OPTIONS, Number(f.slotMinutes)])].filter(Boolean).sort((a, b) => a - b),
    [f.slotMinutes]
  )

  const currentManager = service?.manager && typeof service.manager === 'object' ? service.manager : null
  const managerMissing = currentManager && !managers.some((m) => m._id === currentManager._id)

  const validate = () => {
    const e = {}
    if (f.name.trim().length < 3) e.name = 'Name must be at least 3 characters'
    if (f.location.trim().length < 2) e.location = 'Location is required'

    const price = Number(f.price)
    if (f.price === '' || !Number.isFinite(price) || price < 0 || price > 100000) {
      e.price = 'Enter a price from 0 to 100000'
    }
    const capacity = Number(f.capacity)
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500) e.capacity = 'Enter a whole number from 1 to 500'
    const advance = Number(f.advanceDays)
    if (!Number.isInteger(advance) || advance < 1 || advance > 90) e.advanceDays = 'Enter a whole number from 1 to 90'

    if (!f.openTime || !f.closeTime) {
      e.closeTime = 'Set opening and closing times'
    } else {
      const span = toMinutes(f.closeTime) - toMinutes(f.openTime)
      if (span <= 0) e.closeTime = 'Closing time must be after opening time'
      else if (span < Number(f.slotMinutes)) e.slotMinutes = 'Slot length is longer than the opening hours'
    }

    if (f.openDays.length === 0) e.openDays = 'Pick at least one open day'
    if (f.bookableBy.length === 0) e.bookableBy = 'Pick at least one group'

    if (f.image.trim()) {
      try {
        const u = new URL(f.image.trim())
        if (!['http:', 'https:'].includes(u.protocol)) throw new Error()
      } catch {
        e.image = 'Enter a full image link starting with https://'
      }
    }
    return e
  }

  const submit = async (ev) => {
    ev.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) return

    const payload = {
      name: f.name.trim(),
      category: f.category,
      location: f.location.trim(),
      description: f.description.trim(),
      price: Number(f.price),
      capacity: Number(f.capacity),
      slotMinutes: Number(f.slotMinutes),
      openTime: f.openTime,
      closeTime: f.closeTime,
      openDays: [...f.openDays].sort((a, b) => a - b),
      advanceDays: Number(f.advanceDays),
      requiresApproval: f.requiresApproval,
      bookableBy: f.bookableBy,
      images: f.image.trim() ? [f.image.trim()] : [],
    }
    if (f.manager) payload.manager = f.manager

    setSaving(true)
    setBanner('')
    try {
      const res = editing
        ? await api.patch(`/services/${service._id}`, payload)
        : await api.post('/services', payload)
      onSaved(res.data.service)
    } catch (err) {
      setBanner(err.userMessage)
      setErrors({ ...err.fieldErrors, image: err.fieldErrors['images.0'] || err.fieldErrors.images })
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Input
        label="Name"
        value={f.name}
        onChange={(e) => set('name', e.target.value)}
        error={errors.name}
        placeholder="e.g. Badminton Court"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" error={errors.category}>
          <select value={f.category} onChange={(e) => set('category', e.target.value)} className={`${fieldClass} h-12`}>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Input
          label="Location"
          value={f.location}
          onChange={(e) => set('location', e.target.value)}
          error={errors.location}
          placeholder="e.g. Sports Complex"
        />
      </div>

      <Field label="Description" error={errors.description} hint="Shown on the service page. Optional.">
        <textarea
          value={f.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          maxLength={1000}
          className={`${fieldClass} resize-none py-3`}
        />
      </Field>

      <Input
        label="Photo link (optional)"
        value={f.image}
        onChange={(e) => set('image', e.target.value)}
        error={errors.image}
        hint="Leave empty to use the built-in photo for this category."
        placeholder="https://…"
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <Input
          label="Price per slot (₹)"
          type="number"
          min="0"
          inputMode="numeric"
          value={f.price}
          onChange={(e) => set('price', e.target.value)}
          error={errors.price}
          hint="0 means free"
        />
        <Input
          label="Capacity"
          type="number"
          min="1"
          inputMode="numeric"
          value={f.capacity}
          onChange={(e) => set('capacity', e.target.value)}
          error={errors.capacity}
          hint="People per slot"
        />
        <Field label="Slot length" error={errors.slotMinutes}>
          <select value={f.slotMinutes} onChange={(e) => set('slotMinutes', e.target.value)} className={`${fieldClass} h-12`}>
            {slotOptions.map((m) => (
              <option key={m} value={m}>
                {m} minutes
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Input
          label="Opens"
          type="time"
          value={f.openTime}
          onChange={(e) => set('openTime', e.target.value)}
        />
        <Input
          label="Closes"
          type="time"
          value={f.closeTime}
          onChange={(e) => set('closeTime', e.target.value)}
          error={errors.closeTime}
        />
        <Input
          label="Book up to (days ahead)"
          type="number"
          min="1"
          max="90"
          inputMode="numeric"
          value={f.advanceDays}
          onChange={(e) => set('advanceDays', e.target.value)}
          error={errors.advanceDays}
        />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-ink">Open days</p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d, i) => (
            <Pill key={d} on={f.openDays.includes(i)} onClick={() => toggleIn('openDays', i)}>
              {d}
            </Pill>
          ))}
        </div>
        {errors.openDays && <p className="mt-1.5 text-sm text-danger">{errors.openDays}</p>}
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-ink">Who can book</p>
        <div className="flex flex-wrap gap-2">
          {ROLES_ALLOWED.map(([key, label]) => (
            <Pill key={key} on={f.bookableBy.includes(key)} onClick={() => toggleIn('bookableBy', key)}>
              {label}
            </Pill>
          ))}
        </div>
        {errors.bookableBy && <p className="mt-1.5 text-sm text-danger">{errors.bookableBy}</p>}
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-ink">Booking style</p>
        <div className="flex flex-wrap gap-2">
          <Pill on={!f.requiresApproval} onClick={() => set('requiresApproval', false)}>
            Instant booking
          </Pill>
          <Pill on={f.requiresApproval} onClick={() => set('requiresApproval', true)}>
            Needs manager approval
          </Pill>
        </div>
      </div>

      <Field
        label="Manager"
        error={errors.manager}
        hint="The manager approves requests and checks people in for this service."
      >
        <select value={f.manager} onChange={(e) => set('manager', e.target.value)} className={`${fieldClass} h-12`}>
          <option value="">No manager assigned</option>
          {managerMissing && (
            <option value={currentManager._id}>{currentManager.name} (inactive)</option>
          )}
          {managers.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name} · {m.email}
            </option>
          ))}
        </select>
      </Field>

      {banner && (
        <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          {banner}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-full border border-line px-6 py-2.5 text-sm text-ink hover:bg-surface-2 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-primary px-7 py-2.5 text-sm font-medium text-on-primary disabled:opacity-50"
        >
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create service'}
        </button>
      </div>
    </form>
  )
}

export default function AdminServices() {
  const [services, setServices] = useState(null)
  const [total, setTotal] = useState(0)
  const [managers, setManagers] = useState([])
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [form, setForm] = useState(null) // null, or { service } (service is undefined when creating)
  const [confirmId, setConfirmId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [notice, setNotice] = useState('')

  const closeForm = useCallback(() => setForm(null), [])

  const load = useCallback(async () => {
    try {
      const [s, m] = await Promise.all([
        api.get('/services/manage/list', { params: { limit: 50 } }),
        api.get('/users', { params: { role: 'manager', limit: 50 } }),
      ])
      setServices(s.data.services)
      setTotal(s.data.pagination.total)
      setManagers(m.data.users.filter((u) => u.isActive))
      setError('')
    } catch (err) {
      setError(err.userMessage || 'Could not load services')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const flash = (text) => {
    setNotice(text)
    setTimeout(() => setNotice(''), 3500)
  }

  const onSaved = (saved) => {
    setForm(null)
    flash(`“${saved.name}” saved`)
    load()
  }

  const toggleActive = async (s) => {
    setBusyId(s._id)
    setError('')
    try {
      if (s.isActive) await api.delete(`/services/${s._id}`)
      else await api.patch(`/services/${s._id}`, { isActive: true })
      flash(s.isActive ? `“${s.name}” deactivated` : `“${s.name}” is live again`)
      setConfirmId(null)
      await load()
    } catch (err) {
      setError(err.userMessage || 'Could not update the service')
    } finally {
      setBusyId(null)
    }
  }

  const shown = (services ?? []).filter((s) => {
    if (filter === 'active' && !s.isActive) return false
    if (filter === 'inactive' && s.isActive) return false
    const text = q.trim().toLowerCase()
    return !text || `${s.name} ${s.location}`.toLowerCase().includes(text)
  })

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            ['all', 'All'],
            ['active', 'Active'],
            ['inactive', 'Inactive'],
          ].map(([key, label]) => (
            <Pill key={key} on={filter === key} onClick={() => setFilter(key)}>
              {label}
            </Pill>
          ))}
        </div>
        <button
          onClick={() => setForm({})}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium whitespace-nowrap text-on-primary"
        >
          Add service
        </button>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or location"
        aria-label="Search services"
        className={`${fieldClass} mt-4 h-11`}
      />

      {notice && (
        <p role="status" className="mt-4 rounded-xl border border-success/40 bg-success/10 p-3 text-sm text-success">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </p>
      )}

      {services === null && !error ? (
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-line p-10 text-center text-muted">
          No services match.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {shown.map((s) => (
            <li
              key={s._id}
              className={`flex gap-4 rounded-2xl border border-line bg-surface p-4 ${s.isActive ? '' : 'opacity-70'}`}
            >
              <div className="group relative size-20 shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:size-24">
                <ServiceImage category={s.category} name={s.name} image={s.images?.[0]} className="h-full w-full" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-2xl leading-tight text-ink">{s.name}</p>
                  {!s.isActive && (
                    <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted">Inactive</span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs ${
                      s.requiresApproval ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'
                    }`}
                  >
                    {s.requiresApproval ? 'Needs approval' : 'Instant'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {CATEGORY_LABELS[s.category]} · {s.location} · {formatPrice(s.price)} · capacity {s.capacity} ·{' '}
                  {s.openTime}–{s.closeTime}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Manager: <span className="text-ink">{s.manager?.name || 'not assigned'}</span>
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setForm({ service: s })}
                    className="rounded-full border border-line px-4 py-1.5 text-sm text-ink transition-colors hover:border-accent/60"
                  >
                    Edit
                  </button>

                  {!s.isActive ? (
                    <button
                      onClick={() => toggleActive(s)}
                      disabled={busyId === s._id}
                      className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-on-primary disabled:opacity-50"
                    >
                      {busyId === s._id ? 'Working…' : 'Reactivate'}
                    </button>
                  ) : confirmId === s._id ? (
                    <>
                      <span className="text-sm text-muted">Hide it from students?</span>
                      <button
                        onClick={() => toggleActive(s)}
                        disabled={busyId === s._id}
                        className="rounded-full bg-danger px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                      >
                        {busyId === s._id ? 'Working…' : 'Yes, deactivate'}
                      </button>
                      <button onClick={() => setConfirmId(null)} className="text-sm text-muted hover:text-ink">
                        Keep it
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmId(s._id)}
                      className="rounded-full border border-line px-4 py-1.5 text-sm text-ink transition-colors hover:border-danger/60 hover:text-danger"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {total > 50 && (
        <p className="mt-4 text-sm text-muted">Showing the 50 newest of {total} services.</p>
      )}
      <p className="mt-6 text-sm text-muted">
        Deactivating hides a service from students but keeps every past booking. Existing bookings are not cancelled.
      </p>

      {form && (
        <Modal title={form.service ? 'Edit service' : 'Add a service'} onClose={closeForm} wide>
          <ServiceForm service={form.service} managers={managers} onSaved={onSaved} onCancel={closeForm} />
        </Modal>
      )}
    </section>
  )
}