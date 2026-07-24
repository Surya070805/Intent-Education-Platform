import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const userName = user?.email?.split('@')[0] || ''

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', gap: '16px',
      padding: '0 24px', height: '64px',
      background: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border-subtle)',
      backdropFilter: 'blur(12px)',
    }}>

      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{ fontSize: '1.6em' }}>🌸</span>
        <span style={{ fontWeight: '800', fontSize: '1.1em', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Bloom</span>
      </Link>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
          borderRadius: '24px', padding: '8px 18px',
          transition: 'border-color 0.2s',
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search for skills, topics, courses..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: '0.9em',
            }}
          />
          {searchQuery && (
            <button type="submit" style={{
              background: 'var(--accent-purple)', color: 'white', border: 'none',
              borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8em'
            }}>→</button>
          )}
        </div>
      </form>

      {/* Right Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        {user ? (
          <>
            {/* Notification Bell */}
            <Link to="/progress" style={{ textDecoration: 'none', position: 'relative', cursor: 'pointer' }}>
              <span style={{ fontSize: '1.3em' }}>🔔</span>
              <span style={{ position: 'absolute', top: 0, right: 0, width: '7px', height: '7px', background: 'var(--accent-red)', borderRadius: '50%', border: '1.5px solid var(--bg-primary)' }} />
            </Link>

            {/* User Avatar Dropdown */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                  borderRadius: '24px', padding: '6px 14px 6px 6px', cursor: 'pointer',
                  color: 'var(--text-primary)', fontSize: '0.85em', fontWeight: 600,
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'var(--gradient-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85em'
                }}>🧑‍💻</div>
                {userName}
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8em' }}>▾</span>
              </button>

              {showUserMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: '12px', padding: '8px', minWidth: '180px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 200,
                }}>
                  {[
                    { icon: '🏠', label: 'Dashboard', to: '/dashboard' },
                    { icon: '👤', label: 'Profile', to: '/profile' },
                    { icon: '🗺️', label: 'Roadmap', to: '/roadmap' },
                    { icon: '📊', label: 'Progress', to: '/progress' },
                  ].map(item => (
                    <Link key={item.to} to={item.to} onClick={() => setShowUserMenu(false)} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', borderRadius: '8px', textDecoration: 'none',
                      color: 'var(--text-primary)', fontSize: '0.9em',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {item.icon} {item.label}
                    </Link>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '8px 0' }} />
                  <button
                    onClick={() => { setShowUserMenu(false); signOut() }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                      padding: '10px 12px', borderRadius: '8px', border: 'none',
                      background: 'transparent', color: 'var(--accent-red)',
                      fontSize: '0.9em', cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" style={{
              padding: '8px 18px', borderRadius: '8px', textDecoration: 'none',
              color: 'var(--text-secondary)', fontSize: '0.9em', fontWeight: 500,
              border: '1px solid var(--border-subtle)', transition: 'all 0.2s',
            }}>Log In</Link>
            <Link to="/register" style={{
              padding: '8px 20px', borderRadius: '8px', textDecoration: 'none',
              background: 'var(--accent-purple)', color: 'white',
              fontSize: '0.9em', fontWeight: 600, transition: 'opacity 0.2s',
            }}>Get Started</Link>
          </>
        )}
      </div>
    </nav>
  )
}
