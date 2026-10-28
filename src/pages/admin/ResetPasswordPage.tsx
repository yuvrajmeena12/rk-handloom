import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Seo } from '@/components/Seo'
import { Field } from '@/components/admin/ui'
import { Spinner } from '@/components/ui/states'
import { friendlyAuthError, useAuth } from '@/lib/auth'

const MIN_LENGTH = 10

export default function ResetPasswordPage() {
  const { status, session, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (status === 'loading') return <Spinner label="Checking your reset link" />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < MIN_LENGTH) return setError(`Use at least ${MIN_LENGTH} characters.`)
    if (password !== confirm) return setError('The two passwords do not match.')
    setBusy(true)
    try {
      await updatePassword(password)
      toast.success('Password updated')
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="weave flex min-h-screen items-center justify-center px-4 py-12">
      <Seo title="Choose a new password" noindex />
      <div className="w-full max-w-md border border-sand bg-ivory p-7 sm:p-9">
        <h1 className="text-4xl">Choose a new password</h1>
        {!session ? (
          <>
            <p className="mt-4 text-[15px] text-charcoal/85">
              This reset link is missing or has expired. Request a new one from the sign-in page.
            </p>
            <Link to="/admin/login" className="btn-primary mt-6">
              Go to sign in
            </Link>
          </>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <Field label="New password" htmlFor="new-password" hint={`At least ${MIN_LENGTH} characters.`}>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            <Field label="Confirm new password" htmlFor="confirm-password">
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                className="input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </Field>
            {error && (
              <p role="alert" className="field-error">
                {error}
              </p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Update password
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
