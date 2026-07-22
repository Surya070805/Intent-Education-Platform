import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './profile.css'

export default function Profile() {
  const { session, user, signOut } = useAuth()
  const navigate = useNavigate()
  
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const [formData, setFormData] = useState({
    display_name: '',
    career_goal: '',
    experience: '',
    learning_style: '',
    daily_minutes: '',
    guard_mode_enabled: true
  })

  useEffect(() => {
    if (session) {
      fetch('/api/v1/profile/', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      .then(res => res.json())
      .then(data => {
        setProfile(data)
        setFormData({
          display_name: data.user?.display_name || '',
          career_goal: data.learning_profile?.career?.slug || '',
          experience: data.learning_profile?.experience || '',
          learning_style: data.learning_profile?.learning_style || '',
          daily_minutes: data.learning_profile?.daily_minutes?.toString() || '',
          guard_mode_enabled: data.learning_profile?.guard_mode_enabled ?? true
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
    }
  }, [session])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ text: '', type: '' })

    try {
      const res = await fetch('/api/v1/profile/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          ...formData,
          daily_minutes: parseInt(formData.daily_minutes) || null
        })
      })

      if (res.ok) {
        setMessage({ text: 'Profile updated successfully!', type: 'success' })
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (e: any) {
      setMessage({ text: e.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you absolutely sure? This will delete all your learning history and cannot be undone.')) {
      try {
        await fetch('/api/v1/profile/', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${session?.access_token}` }
        })
        signOut()
      } catch (e) {
        console.error(e)
      }
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-container" style={{ textAlign: 'center', paddingTop: '80px', color: '#a0a0b8' }}>
          Loading profile...
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <nav className="page-nav" style={{ padding: '16px 48px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/dashboard">← Back to Dashboard</Link>
      </nav>

      <div className="profile-container">
        <div className="profile-header">
          <h2>👤 Settings & Profile</h2>
          <p>Manage your learning preferences and account details.</p>
        </div>

        {message.text && (
          <div style={{ 
            padding: '12px 16px', 
            borderRadius: '8px', 
            marginBottom: '24px',
            background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'success' ? '#22c55e' : '#ef4444'
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="profile-section">
            <h3>Account Info</h3>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" className="form-control" value={user?.email || ''} disabled />
            </div>
            <div className="form-group">
              <label>Display Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.display_name}
                onChange={e => setFormData({...formData, display_name: e.target.value})}
                placeholder="What should we call you?"
              />
            </div>
          </div>

          <div className="profile-section">
            <h3>Learning Preferences</h3>
            <div className="form-group">
              <label>Career Goal</label>
              <select 
                className="form-control"
                value={formData.career_goal}
                onChange={e => setFormData({...formData, career_goal: e.target.value})}
              >
                <option value="full-stack-dev">Full-Stack Development</option>
                <option value="data-science-ai">Data Science & AI</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Experience Level</label>
              <select 
                className="form-control"
                value={formData.experience}
                onChange={e => setFormData({...formData, experience: e.target.value})}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="form-group">
              <label>Learning Style</label>
              <select 
                className="form-control"
                value={formData.learning_style}
                onChange={e => setFormData({...formData, learning_style: e.target.value})}
              >
                <option value="video">Video Tutorials</option>
                <option value="reading">Reading & Docs</option>
                <option value="projects">Building Projects</option>
              </select>
            </div>

            <div className="form-group">
              <label>Daily Commitment (minutes)</label>
              <select 
                className="form-control"
                value={formData.daily_minutes}
                onChange={e => setFormData({...formData, daily_minutes: e.target.value})}
              >
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2+ hours</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
              <input 
                type="checkbox" 
                id="guardMode"
                checked={formData.guard_mode_enabled}
                onChange={e => setFormData({...formData, guard_mode_enabled: e.target.checked})}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="guardMode" style={{ margin: 0, cursor: 'pointer' }}>
                Enable Guard Mode (Extension will block distracting videos)
              </label>
            </div>

            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>

        <div className="profile-section">
          <h3>AI Profile Summary</h3>
          <p style={{ color: '#a0a0b8', fontSize: '0.9em', marginBottom: '16px' }}>
            This is how Bloom's AI currently understands your knowledge state.
          </p>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85em', color: '#a0a0b8', marginBottom: '8px' }}>Focus Areas</label>
            <div className="tag-list">
              {profile?.learning_profile?.focus_areas?.map((t: string) => <span key={t} className="tag">{t}</span>) || <span className="tag">None yet</span>}
            </div>
          </div>
        </div>

        <div className="profile-section danger-zone">
          <h3>Danger Zone</h3>
          <p>Once you delete your account, there is no going back. Please be certain.</p>
          <button 
            type="button" 
            className="btn btn-danger" 
            style={{ padding: '10px 20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', cursor: 'pointer' }}
            onClick={handleDeleteAccount}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}
