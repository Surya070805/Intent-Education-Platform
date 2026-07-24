import React from 'react'
import { Link, useLocation } from 'react-router-dom'

interface SidebarProps {
  userName: string
  dailyGoalCompleted?: number
  dailyGoalTarget?: number
}

export default function Sidebar({ userName, dailyGoalCompleted = 0, dailyGoalTarget = 3 }: SidebarProps) {
  const location = useLocation()
  
  const navItems = [
    { label: 'Home', path: '/', icon: '🏠' },
    { label: 'Roadmap', path: '/roadmap', icon: '🗺️' },
    { label: 'Search', path: '/search', icon: '🔍' },
    { label: 'Progress', path: '/progress', icon: '📊' },
    { label: 'Profile', path: '/profile', icon: '👤' },
  ]

  return (
    <div className="sidebar-pane pane">
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="brand">
          <span className="brand-icon">🌸</span>
          <div>
            <h1>Bloom</h1>
            <span className="brand-subtitle">Your AI Learning Companion</span>
          </div>
        </div>
      </Link>

      <div className="nav-menu">
        {navItems.map(item => {
          const isActive = location.pathname === item.path
          return (
            <Link 
              key={item.label} 
              to={item.path} 
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <span style={{ fontSize: '1.2em', opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </Link>
          )
        })}
      </div>

      <div className="daily-goal-widget" style={{ marginTop: '32px' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: '0.9em', color: 'var(--text-primary)' }}>Daily Goal</h4>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '1.4em', color: 'var(--accent-blue)', fontWeight: '700' }}>{dailyGoalCompleted}</span>
          <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>/ {dailyGoalTarget} sessions</span>
        </div>
        <div className="progress-bar-bg" style={{ marginBottom: '12px', background: '#f1f5f9' }}>
          <div className="progress-bar-fill" style={{ width: `${Math.min(100, Math.round((dailyGoalCompleted / dailyGoalTarget) * 100))}%`, background: 'var(--accent-blue)' }} />
        </div>
        <p style={{ margin: 0, fontSize: '0.75em', color: 'var(--text-secondary)' }}>
          {dailyGoalCompleted >= dailyGoalTarget ? "Goal reached! 🎉" : "Keep going!\nYou're doing great. 🚀"}
        </p>
      </div>

      <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="user-profile-widget">
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '50%', 
            background: 'var(--gradient-accent)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', fontSize: '1.2em' 
          }}>
            🧑‍💻
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85em', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {userName || 'Learner'}
            </div>
            <div style={{ fontSize: '0.7em', color: 'var(--text-muted)' }}>Pro Learner</div>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>⌄</span>
        </div>
      </Link>
    </div>
  )
}
