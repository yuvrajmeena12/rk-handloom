import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Field } from '@/components/admin/ui'
import { friendlyAuthError, useAuth } from '@/lib/auth'
import { Spinner } from '@/components/ui/states'

export default function LoginPage() {
  const { status, signIn, sendPasswordReset, signOut } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'forgot'>('signin')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  if (status === 'loading') return <Spinner label="Checking your sign-in" />
  if (status === 'admin') return <Navigate to={from && from.startsWith('/admin') ? from : '/admin'} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await sendPasswordReset(email)
        // Same message whether or not the address exists, so accounts cannot be probed.
        setNotice('If that email belongs to the owner account, a reset link is on its way. Check your inbox.')
      }
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="weave flex min-h-screen items-center justify-center px-4 py-12">
      <Seo title="Owner sign in" noindex />
      <div className="w-full max-w-md border border-sand bg-ivory">
        <div className="selvedge" aria-hidden />
        <div className="p-7 sm:p-9">
          <p className="font-serif text-xl text-earth">RK HANDLOOM</p>
          <h1 className="mt-1 text-4xl">{mode === 'signin' ? 'Owner sign in' : 'Reset your password'}</h1>

          {status === 'not_admin' && (
            <div role="alert" className="mt-5 border border-amber-700/40 bg-amber-50 p-3 text-sm text-amber-900">
              You are signed in with an account that is not the owner account.{' '}
              <button type="button" className="underline" onClick={() => void signOut()}>
                Sign out
              </button>
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <Field label="Email" htmlFor="login-email">
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            {mode === 'signin' && (
              <Field label="Password" htmlFor="login-password">
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
            )}
            {error && (
              <p role="alert" className="field-error">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="text-sm text-accent">
                {notice}
              </p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={busy || !email || (mode === 'signin' && !password)}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {mode === 'signin' ? 'Sign in' : 'Send reset link'}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <button
              type="button"
              className="link"
              onClick={() => {
                setMode(mode === 'signin' ? 'forgot' : 'signin')
                setError('')
                setNotice('')
              }}
            >
              {mode === 'signin' ? 'Forgot your password?' : 'Back to sign in'}
            </button>
            <Link to="/" className="text-earth hover:underline">
              Back to the site
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
