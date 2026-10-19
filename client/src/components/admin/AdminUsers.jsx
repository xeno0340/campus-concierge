import { useCallback, useEffect, useState } from 'react'
import Modal from '../Modal.jsx'
import Input from '../ui/Input.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { api } from '../../lib/api.js'

const ROLES = ['student', 'faculty', 'manager', 'admin']

const fieldClass =
  'w-full rounded-xl border border-line bg-surface px-4 text-[15px] text-ink outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/15'

const joined = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

function Pill({ on, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm whitespace-nowrap capitalize transition-colors ${
        on ? 'border-primary bg-primary text-on-primary' : 'border-line text-muted hover:border-accent/60 hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function AddUserForm({ onSaved, onCancel }) {
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'student', department: '', phone: '' })
  const [errors, setErrors] = useState({})
  const [banner, setBanner] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  const submit = async (ev) => {
    ev.preventDefault()
    const e = {}
    if (f.name.trim().length < 2) e.name = 'Name must be at least 2 characters'
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email address'
    if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) {
      e.password = 'At least 8 characters, with a letter and a number'
    }
    setErrors(e)
    if (Object.keys(e).length) return

    const payload = { name: f.name.trim(), email: f.email.trim(), password: f.password, role: f.role }
    if (f.department.trim()) payload.department = f.department.trim()
    if (f.phone.trim()) payload.phone = f.phone.trim()

    setSaving(true)
    setBanner('')
    try {
      const res = await api.post('/users', payload)
      onSaved(res.data.user)
    } catch (err) {
      setBanner(err.userMessage)
      setErrors(err.fieldErrors || {})
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Input label="Full name" value={f.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
      <Input
        label="Email"
        type="email"
        autoComplete="off"
        value={f.email}
        onChange={(e) => set('email', e.target.value)}
        error={errors.email}
      />
      <Input
        label="Temporary password"
        type="password"
        autoComplete="new-password"
        value={f.password}
        onChange={(e) => set('password', e.target.value)}
        error={errors.password}
        hint="Share it with the person securely. They can sign in with it straight away."
      />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Role</span>
        <select value={f.role} onChange={(e) => set('role', e.target.value)} className={`${fieldClass} h-12 capitalize`}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {errors.role && <span className="mt-1.5 block text-sm text-danger">{errors.role}</span>}
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Department (optional)"
          value={f.department}
          onChange={(e) => set('department', e.target.value)}
          error={errors.department}
        />
        <Input
          label="Phone (optional)"
          inputMode="tel"
          value={f.phone}
          onChange={(e) => set('phone', e.target.value)}
          error={errors.phone}
        />
      </div>

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
          {saving ? 'Creating…' : 'Create user'}
        </button>
      </div>
    </form>
  )
}

function UserRow({ person, isMe, onChanged }) {
  const [pendingRole, setPendingRole] = useState(null)
  const [confirmOff, setConfirmOff] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async (path, body) => {
    setBusy(true)
    setError('')
    try {
      await api.patch(`/users/${person._id}/${path}`, body)
      setPendingRole(null)
      setConfirmOff(false)
      onChanged()
    } catch (err) {
      setError(err.userMessage || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className={`rounded-2xl border border-line bg-surface p-4 sm:p-5 ${person.isActive ? '' : 'opacity-70'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-display text-2xl leading-tight text-ink">{person.name}</span>
            {isMe && <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs text-accent-strong">You</span>}
            {!person.isActive && (
              <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted">Deactivated</span>
            )}
          </p>
          <p className="mt-1 text-sm break-all text-muted">{person.email}</p>
          <p className="mt-1 text-sm text-muted">
            {person.department ? `${person.department} · ` : ''}Joined {joined(person.createdAt)}
          </p>
        </div>

        <label className="block">
          <span className="sr-only">Role for {person.name}</span>
          <select
            value={pendingRole ?? person.role}
            disabled={isMe || busy}
            onChange={(e) => setPendingRole(e.target.value === person.role ? null : e.target.value)}
            className={`${fieldClass} h-10 w-auto min-w-32 capitalize disabled:opacity-60`}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {pendingRole && (
          <>
            <span className="text-sm text-muted">
              Change role to <span className="font-medium text-ink capitalize">{pendingRole}</span>?
            </span>
            <button
              onClick={() => run('role', { role: pendingRole })}
              disabled={busy}
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-on-primary disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Confirm'}
            </button>
            <button onClick={() => setPendingRole(null)} className="text-sm text-muted hover:text-ink">
              Cancel
            </button>
          </>
        )}

        {!pendingRole && !isMe && !person.isActive && (
          <button
            onClick={() => run('status', { isActive: true })}
            disabled={busy}
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-on-primary disabled:opacity-50"
          >
            {busy ? 'Working…' : 'Reactivate'}
          </button>
        )}

        {!pendingRole && !isMe && person.isActive &&
          (confirmOff ? (
            <>
              <span className="text-sm text-muted">They will be signed out and unable to log in.</span>
              <button
                onClick={() => run('status', { isActive: false })}
                disabled={busy}
                className="rounded-full bg-danger px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {busy ? 'Working…' : 'Yes, deactivate'}
              </button>
              <button onClick={() => setConfirmOff(false)} className="text-sm text-muted hover:text-ink">
                Keep active
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmOff(true)}
              className="rounded-full border border-line px-4 py-1.5 text-sm text-ink transition-colors hover:border-danger/60 hover:text-danger"
            >
              Deactivate
            </button>
          ))}
      </div>
    </li>
  )
}

export default function AdminUsers() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [role, setRole] = useState('')
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [notice, setNotice] = useState('')

  const closeAdd = useCallback(() => setAdding(false), [])
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  // wait until typing pauses before searching
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let off = false
    api
      .get('/users', { params: { page, limit: 10, role: role || undefined, q: q || undefined } })
      .then((res) => {
        if (off) return
        setUsers(res.data.users)
        setPagination(res.data.pagination)
        setError('')
      })
      .catch((err) => {
        if (!off) setError(err.userMessage || 'Could not load users')
      })
    return () => {
      off = true
    }
  }, [page, role, q, reloadKey])

  const onCreated = (u) => {
    setAdding(false)
    setNotice(`${u.name} was added as ${u.role}`)
    setTimeout(() => setNotice(''), 3500)
    reload()
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Pill
            on={role === ''}
            onClick={() => {
              setRole('')
              setPage(1)
            }}
          >
            All
          </Pill>
          {ROLES.map((r) => (
            <Pill
              key={r}
              on={role === r}
              onClick={() => {
                setRole(r)
                setPage(1)
              }}
            >
              {r}
            </Pill>
          ))}
        </div>
        <button
          onClick={() => setAdding(true)}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium whitespace-nowrap text-on-primary"
        >
          Add user
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email"
        aria-label="Search users"
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

      {users === null && !error ? (
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      ) : users?.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-line p-10 text-center text-muted">
          No users match.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {users?.map((u) => (
            <UserRow key={u._id} person={u} isMe={u._id === me?._id} onChanged={reload} />
          ))}
        </ul>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-muted">
          <span>
            Page {pagination.page} of {pagination.pages} · {pagination.total} users
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="rounded-full border border-line px-4 py-1.5 text-ink hover:bg-surface-2 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, pagination.pages))}
              disabled={page >= pagination.pages}
              className="rounded-full border border-line px-4 py-1.5 text-ink hover:bg-surface-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {adding && (
        <Modal title="Add a user" onClose={closeAdd}>
          <AddUserForm onSaved={onCreated} onCancel={closeAdd} />
        </Modal>
      )}
    </section>
  )
}