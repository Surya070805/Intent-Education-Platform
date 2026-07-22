import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './progress.css'

interface ProgressData {
  stats: {
    total_sessions: number
    completed_sessions: number
    total_watch_minutes: number
    total_recommendations: number
    completed_recommendations: number
    saved_recommendations: number
    current_streak: number
    longest_streak: number
  }
  skill_progress: any[]
  recent_activity: any[]
  weekly_events: any[]
  activity_heatmap: Record<string, number>
}

export default function Progress() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetch('/api/v1/progress/', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
    }
  }, [session])

  if (loading) {
    return (
      <div className="progress-page">
        <div className="page-nav"><Link to="/dashboard">← Back to Dashboard</Link></div>
        <div style={{ textAlign: 'center', padding: '80px', color: '#a0a0b8' }}>Loading stats...</div>
      </div>
    )
  }

  // Generate last 30 days for heatmap
  const today = new Date()
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(today.getDate() - (29 - i))
    return d.toISOString().split('T')[0]
  })

  return (
    <div className="progress-page">
      <nav className="page-nav">
        <Link to="/dashboard">← Back to Dashboard</Link>
      </nav>

      <div className="progress-header">
        <h2>📊 Your Learning Progress</h2>
        <p>Track your sessions, watch time, and skill mastery.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{data?.stats.current_streak || 0} 🔥</div>
          <div className="stat-label">Day Streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data?.stats.total_watch_minutes || 0}</div>
          <div className="stat-label">Minutes Learned</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data?.stats.completed_sessions || 0}</div>
          <div className="stat-label">Sessions Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data?.skill_progress.filter(s => s.mastery_level >= 0.8).length || 0}</div>
          <div className="stat-label">Skills Mastered</div>
        </div>
      </div>

      <div className="progress-sections">
        <div className="main-col">
          <div className="section-card" style={{ marginBottom: '32px' }}>
            <h3>📅 Learning Activity (Last 30 Days)</h3>
            <div className="heatmap-container">
              <div className="heatmap-grid">
                {last30Days.map(date => {
                  const count = data?.activity_heatmap[date] || 0
                  const level = count === 0 ? 0 : count < 2 ? 1 : count < 4 ? 2 : count < 6 ? 3 : 4
                  return (
                    <div 
                      key={date} 
                      className="heatmap-day" 
                      data-level={level}
                      title={`${date}: ${count} sessions`}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          <div className="section-card">
            <h3>⏱️ Recent Sessions</h3>
            {data?.recent_activity.length ? (
              <div className="activity-list">
                {data.recent_activity.map(activity => (
                  <div className="activity-item" key={activity.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/watch/${activity.recommendation_id || activity.resource?.youtube_id}`, { state: { youtubeId: activity.resource?.youtube_id } })}>
                    <img src={activity.resource?.thumbnail_url || `https://img.youtube.com/vi/${activity.resource?.youtube_id}/hqdefault.jpg`} alt="thumb" className="activity-thumb" />
                    <div className="activity-info">
                      <p className="activity-title">{activity.resource?.title}</p>
                      <div className="activity-meta">
                        <span>{new Date(activity.started_at).toLocaleDateString()}</span>
                        <span>{activity.status === 'completed' ? '✓ Completed' : '◑ In Progress'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#a0a0b8' }}>No recent sessions found.</p>
            )}
          </div>
        </div>

        <div className="side-col">
          <div className="section-card">
            <h3>📈 Top Skills in Progress</h3>
            {data?.skill_progress.length ? (
              <div className="skill-progress-list">
                {data.skill_progress
                  .sort((a, b) => b.mastery_level - a.mastery_level)
                  .slice(0, 8)
                  .map(skill => (
                  <div className="skill-progress-item" key={skill.skill_id}>
                    <div className="skill-header">
                      <span className="skill-name">{skill.skill?.name || 'Unknown Skill'}</span>
                      <span className="skill-pct">{Math.round(skill.mastery_level * 100)}%</span>
                    </div>
                    <div className="skill-bar">
                      <div className="skill-bar-fill" style={{ width: `${Math.round(skill.mastery_level * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#a0a0b8' }}>Complete sessions to build skill mastery.</p>
            )}
            <Link to="/roadmap" className="btn btn-ghost" style={{ display: 'block', textAlign: 'center', marginTop: '24px', textDecoration: 'none' }}>
              View Full Roadmap →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
