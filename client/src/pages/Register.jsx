import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { homeFor } from '../lib/roles.js'

export default function Register() {
  const { user, register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

    if (user) return <Navigate to={homeFor(user)} replace />

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    setFormError('')
    try {
      const payload = { ...form }
      if (!payload.department.trim()) delete payload.department
      await register(payload)
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setFormError(Object.keys(err.fieldErrors || {}).length ? '' : err.userMessage)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join your campus network and start booking in minutes."
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-medium text-accent-strong underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {formError && (
          <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {formError}
          </p>
        )}
        <Input label="Full name" autoComplete="name" placeholder="Your name" value={form.name} onChange={set('name')} error={errors.name} required />
        <Input label="Email" type="email" autoComplete="email" placeholder="you@college.edu" value={form.email} onChange={set('email')} error={errors.email} required />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          hint="At least 8 characters, with a letter and a number."
          required
        />
        <Input label="Department (optional)" placeholder="e.g. CSE" value={form.department} onChange={set('department')} error={errors.department} />
        <Button type="submit" size="lg" loading={busy} className="w-full">
          Create account
        </Button>
      </form>
    </AuthShell>
  )
}