import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/**
 * ResetPassword page
 *
 * Supabase sends the user here after clicking the reset link.
 * The URL will contain a hash fragment with the access_token:
 *   #access_token=...&type=recovery
 * OR an error:
 *   #error=access_denied&error_code=otp_expired&...
 *
 * Supabase's JS client automatically parses the hash and creates
 * a session via onAuthStateChange with event = 'PASSWORD_RECOVERY'.
 * We listen for that event and then allow the user to set a new password.
 */
export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    // Check for error in hash (e.g. otp_expired)
    const hash = window.location.hash
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.replace('#', '?'))
      const desc = params.get('error_description') || 'The reset link is invalid or has expired.'
      setErrorMsg(desc.replace(/\+/g, ' '))
      return
    }

    // Listen for Supabase PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })

    // Also check if a session already exists from the hash
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setErrorMsg('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setErrorMsg(error.message)
    } else {
      setSuccessMsg('Password updated! Redirecting to login...')
      await supabase.auth.signOut()
      setTimeout(() => navigate('/login'), 2000)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        background: 'var(--bg-card)', padding: '48px 40px', borderRadius: '20px',
        border: '1px solid var(--border-subtle)', width: '100%', maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '2.5em' }}>🔐</span>
          <h2 style={{ margin: '12px 0 8px', fontSize: '1.8em' }}>Set New Password</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>Choose a strong new password for your account.</p>
        </div>

        {/* Error state — link expired or invalid */}
        {errorMsg && !ready && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              padding: '16px', borderRadius: '12px', marginBottom: '24px',
              background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.9em',
            }}>
              ⚠️ {errorMsg}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85em', marginBottom: '24px' }}>
              Reset links expire after 1 hour. Please request a new one.
            </p>
            <a
              href="/Intent-Education-Platform/forgot-password"
              style={{
                display: 'block', padding: '14px', background: 'var(--accent-purple)',
                color: 'white', borderRadius: '12px', textDecoration: 'none',
                fontWeight: 700, textAlign: 'center',
              }}
            >
              Request New Reset Link
            </a>
          </div>
        )}

        {/* Success state */}
        {successMsg && (
          <div style={{
            padding: '16px', borderRadius: '12px',
            background: 'rgba(34,197,94,0.1)', color: '#22c55e',
            fontSize: '0.95em', textAlign: 'center',
          }}>
            ✅ {successMsg}
          </div>
        )}

        {/* Password form — shown when token is valid */}
        {ready && !successMsg && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {errorMsg && (
              <div style={{
                padding: '12px', borderRadius: '8px',
                background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.9em',
              }}>
                {errorMsg}
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.85em', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '10px',
                  border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', fontSize: '1em', boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85em', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your new password"
                required
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '10px',
                  border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', fontSize: '1em', boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '14px', borderRadius: '10px',
                background: loading ? 'var(--border-subtle)' : 'var(--accent-purple)',
                color: 'white', border: 'none', fontWeight: 700,
                fontSize: '1em', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Updating...' : '🔒 Update Password'}
            </button>
          </form>
        )}

        {/* Loading state — waiting for Supabase to parse token */}
        {!ready && !errorMsg && !successMsg && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
            ⏳ Verifying your reset link...
          </div>
        )}
      </div>
    </div>
  )
}
