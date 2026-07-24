import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `https://surya070805.github.io/Intent-Education-Platform/reset-password`,
      })

      if (error) throw error
      
      setMessage({ 
        text: 'Password reset link sent! Check your email.', 
        type: 'success' 
      })
      setEmail('')
    } catch (e: any) {
      setMessage({ text: e.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', color: '#f0f0f5', fontFamily: 'Inter' }}>
      <div style={{ background: '#141420', padding: '40px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ fontSize: '1.8em', marginBottom: '8px', textAlign: 'center' }}>Reset Password</h2>
        <p style={{ color: '#a0a0b8', textAlign: 'center', marginBottom: '24px', fontSize: '0.9em' }}>
          Enter your email and we'll send you a link to reset your password.
        </p>

        {message.text && (
          <div style={{ 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'success' ? '#22c55e' : '#ef4444',
            fontSize: '0.9em',
            textAlign: 'center'
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="email" 
            placeholder="Your email address" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ 
              padding: '12px 16px', 
              borderRadius: '8px', 
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)',
              color: 'white',
              fontSize: '1em'
            }}
          />
          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              padding: '14px', 
              borderRadius: '8px', 
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              color: 'white',
              border: 'none',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link to="/login" style={{ color: '#a5b4fc', textDecoration: 'none', fontSize: '0.9em' }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
