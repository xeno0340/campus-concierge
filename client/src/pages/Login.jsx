import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import AuthShell from '../components/AuthShell.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { landingFor } from '../lib/roles.js'

export default function Login() {
  const { user, login } = useAuth()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

    // once signed in: back to where they came from, otherwise their home page
  if (user) return <Navigate to={landingFor(user, location.state?.from)} replace />

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    setFormError('')
    try {
      await login(form.email, form.password)
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setFormError(Object.keys(err.fieldErrors || {}).length ? '' : err.userMessage)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to book services and track your requests."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-accent-strong underline-offset-4 hover:underline">
            Create an account
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
        <Input label="Email" type="email" autoComplete="email" placeholder="you@college.edu" value={form.email} onChange={set('email')} error={errors.email} required />
        <Input label="Password" type="password" autoComplete="current-password" placeholder="Your password" value={form.password} onChange={set('password')} error={errors.password} required />
        <Button type="submit" size="lg" loading={busy} className="w-full">
          Sign in
        </Button>
      </form>
    </AuthShell>
  )
}