import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import VideoCard, { Resource } from '../components/VideoCard'
import RightSidebar from '../components/RightSidebar'
import ContinueLearningCard from '../components/ContinueLearningCard'
import './dashboard.css'

interface Recommendation {
  id: string
  score: number
  explanation: string
  status: string
  resource: Resource
}

interface BrowseSection {
  level: string
  label: string
  resources: Resource[]
}

interface ActiveSession {
  id: string
  recommendation_id?: string
  resource: Resource
}

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function HomeFeed() {
  const { user, session, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Guest data
  const [browseSections, setBrowseSections] = useState<BrowseSection[]>([])
  const [browseLoading, setBrowseLoading] = useState(true)

  // Authenticated user data
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [streak, setStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [dailyGoalCompleted, setDailyGoalCompleted] = useState(0)
  const [careerGoal, setCareerGoal] = useState('')
  const [skillProgress, setSkillProgress] = useState<any[]>([])
  const [activityHeatmap, setActivityHeatmap] = useState<Record<string, number>>({})
  const [roadmapData, setRoadmapData] = useState<any>(null)
  const [generatingRecs, setGeneratingRecs] = useState(false)

  const recsScrollRef = useRef<HTMLDivElement>(null)
  const browseSectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Always fetch public browse data
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/recommendations/browse`)
      .then(r => r.json())
      .then(data => setBrowseSections(data.sections || []))
      .catch(() => {})
      .finally(() => setBrowseLoading(false))
  }, [])

  // Fetch personalized data when logged in
  useEffect(() => {
    if (!session) return

    const headers = { 'Authorization': `Bearer ${session.access_token}` }
    Promise.all([
      fetch(`${API_BASE}/api/v1/recommendations/`, { headers }),
      fetch(`${API_BASE}/api/v1/sessions/active`, { headers }),
      fetch(`${API_BASE}/api/v1/progress/`, { headers }),
      fetch(`${API_BASE}/api/v1/profile/`, { headers }),
      fetch(`${API_BASE}/api/v1/roadmap/`, { headers }),
    ]).then(async ([recsRes, sessionsRes, progressRes, profileRes, roadmapRes]) => {
      if (recsRes.ok) {
        const data = await recsRes.json()
        setRecommendations(data.filter((r: Recommendation) => r.status === 'pending' || r.status === 'saved'))
      }
      if (sessionsRes.ok) setActiveSessions((await sessionsRes.json()) || [])
      if (progressRes.ok) {
        const data = await progressRes.json()
        setStreak(data.stats?.current_streak || 0)
        setLongestStreak(data.stats?.longest_streak || 0)
        const todayStr = new Date().toISOString().split('T')[0]
        setDailyGoalCompleted(data.activity_heatmap?.[todayStr] || 0)
        setActivityHeatmap(data.activity_heatmap || {})
        setSkillProgress(data.skill_progress || [])
      }
      if (profileRes.ok) {
        const data = await profileRes.json()
        setCareerGoal(data.learning_profile?.career?.name || '')
      }
      if (roadmapRes.ok) setRoadmapData(await roadmapRes.json())
    }).catch(console.error)
  }, [session])

  const scrollRow = (ref: HTMLDivElement | null, direction: 'left' | 'right') => {
    if (!ref) return
    ref.scrollBy({ left: direction === 'right' ? ref.clientWidth * 0.75 : -ref.clientWidth * 0.75, behavior: 'smooth' })
  }

  const handleGenerateRecs = async () => {
    if (!session) { navigate('/login'); return }
    setGeneratingRecs(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/recommendations/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (res.ok) {
        const newRecs = await res.json()
        setRecommendations(prev => [...prev, ...newRecs])
      }
    } catch (e) { console.error(e) }
    finally { setGeneratingRecs(false) }
  }

  const handleStatusUpdate = (id: string, status: string) => {
    if (status === 'dismissed') setRecommendations(prev => prev.filter(r => r.id !== id))
  }

  const userName = user?.email?.split('@')[0] || ''

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      <div className="dashboard" style={{ paddingTop: 0 }}>

        {/* Left Sidebar — only for logged-in users */}
        {user && (
          <div className="sidebar-pane pane">
            <div className="nav-menu" style={{ marginTop: '24px' }}>
              {[
                { label: 'Home', path: '/', icon: '🏠' },
                { label: 'Roadmap', path: '/roadmap', icon: '🗺️' },
                { label: 'Progress', path: '/progress', icon: '📊' },
                { label: 'Search', path: '/search', icon: '🔍' },
                { label: 'Profile', path: '/profile', icon: '👤' },
              ].map(item => (
                <Link key={item.path} to={item.path} className="nav-item" style={{ textDecoration: 'none' }}>
                  <span style={{ fontSize: '1.2em' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="daily-goal-widget" style={{ marginTop: '32px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.9em', color: 'var(--text-primary)' }}>Daily Goal</h4>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.4em', color: 'var(--accent-blue)', fontWeight: '700' }}>{dailyGoalCompleted}</span>
                <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>/ 3 sessions</span>
              </div>
              <div className="progress-bar-bg" style={{ marginBottom: '12px' }}>
                <div className="progress-bar-fill" style={{ width: `${Math.min(100, Math.round((dailyGoalCompleted / 3) * 100))}%`, background: 'var(--accent-blue)' }} />
              </div>
              <p style={{ margin: 0, fontSize: '0.75em', color: 'var(--text-secondary)' }}>
                {dailyGoalCompleted >= 3 ? 'Goal reached! 🎉' : 'Keep going! 🚀'}
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="main-pane pane" style={{ gridColumn: user ? undefined : '1 / -1' }}>
          <div className="main-content-inner">

            {/* Guest Banner */}
            {!user && !authLoading && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(59,130,246,0.15))',
                border: '1px solid rgba(168,85,247,0.3)',
                borderRadius: '16px', padding: '20px 28px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '16px', marginBottom: '32px', flexWrap: 'wrap',
              }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05em' }}>
                    ✨ Get personalized recommendations
                  </p>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9em' }}>
                    Sign in to unlock AI-powered learning paths tailored to your career goals.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
                  <Link to="/login" style={{
                    padding: '10px 20px', borderRadius: '10px', textDecoration: 'none',
                    border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)',
                    fontSize: '0.9em', fontWeight: 500,
                  }}>Log In</Link>
                  <Link to="/register" style={{
                    padding: '10px 22px', borderRadius: '10px', textDecoration: 'none',
                    background: 'var(--accent-purple)', color: 'white',
                    fontSize: '0.9em', fontWeight: 700,
                  }}>🚀 Get Started Free</Link>
                </div>
              </div>
            )}

            {/* Greeting for logged in users */}
            {user && (
              <div className="greeting-section">
                <div>
                  <h2>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {userName}! 👋</h2>
                  <p>Ready to continue your learning journey?</p>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={() => navigate('/search')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(168,85,247,0.1)', color: 'var(--accent-purple)', borderColor: 'rgba(168,85,247,0.2)' }}
                >
                  <span>🔍</span> Search Topics
                </button>
              </div>
            )}

            {/* Personalized Recommendations (logged-in users) */}
            {user && recommendations.length > 0 && (
              <div className="up-next-section">
                <div className="row-header">
                  <h3 className="row-title">🎯 Recommended for You</h3>
                  <button
                    onClick={handleGenerateRecs}
                    disabled={generatingRecs}
                    style={{ color: 'var(--accent-purple)', background: 'none', border: 'none', fontSize: '0.85em', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {generatingRecs ? '⏳ Generating...' : '+ More →'}
                  </button>
                </div>
                <div className="scroll-container">
                  <button className="scroll-arrow scroll-arrow-left" onClick={() => scrollRow(recsScrollRef.current, 'left')}>‹</button>
                  <div className="scroll-track" ref={recsScrollRef}>
                    {recommendations.map(rec => (
                      <VideoCard
                        key={rec.id}
                        resource={rec.resource}
                        matchScore={rec.score}
                        recommendationId={rec.id}
                        onStatusUpdate={handleStatusUpdate}
                      />
                    ))}
                  </div>
                  <button className="scroll-arrow scroll-arrow-right" onClick={() => scrollRow(recsScrollRef.current, 'right')}>›</button>
                </div>
              </div>
            )}

            {/* Generate Recs CTA for logged-in users with no recs */}
            {user && recommendations.length === 0 && !browseLoading && (
              <div style={{
                textAlign: 'center', padding: '32px', background: 'var(--bg-secondary)',
                borderRadius: '16px', marginBottom: '32px',
              }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                  🤖 Your personalized recommendations are ready to be generated!
                </p>
                <button
                  onClick={handleGenerateRecs}
                  disabled={generatingRecs}
                  className="btn"
                >
                  {generatingRecs ? '⏳ Generating...' : '✨ Generate My Recommendations'}
                </button>
              </div>
            )}

            {/* Continue Learning */}
            {user && activeSessions.length > 0 && (
              <div className="up-next-section">
                <div className="row-header">
                  <h3 className="row-title">▶️ Continue Learning</h3>
                </div>
                <div>
                  {activeSessions.slice(0, 2).map(s => (
                    <ContinueLearningCard
                      key={s.id}
                      title={s.resource.title}
                      channel={s.resource.channel_name || 'YouTube'}
                      progress={65}
                      thumbnailUrl={`https://img.youtube.com/vi/${s.resource.youtube_id}/mqdefault.jpg`}
                      onClick={() => navigate(`/watch/${s.recommendation_id || s.resource.youtube_id}`, { state: { youtubeId: s.resource.youtube_id, browseMode: true } })}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Browse by Category (public + authenticated) */}
            {browseLoading ? (
              <div style={{ padding: '48px', display: 'flex', gap: '16px' }}>
                {[1, 2, 3].map(i => <div key={i} className="shimmer-card" />)}
              </div>
            ) : browseSections.length > 0 ? (
              browseSections.map(section => (
                <div key={section.level} className="up-next-section">
                  <div className="row-header">
                    <h3 className="row-title">{section.label}</h3>
                  </div>
                  <div className="scroll-container">
                    <button
                      className="scroll-arrow scroll-arrow-left"
                      onClick={() => scrollRow(browseSectionRefs.current[section.level], 'left')}
                    >‹</button>
                    <div className="scroll-track" ref={el => { browseSectionRefs.current[section.level] = el }}>
                      {section.resources.map((resource: Resource) => (
                        <VideoCard
                          key={resource.youtube_id}
                          resource={resource}
                          browseMode={!user}
                          onBrowseClick={() => {
                            if (!user) {
                              navigate(`/watch/${resource.youtube_id}`, { state: { youtubeId: resource.youtube_id, browseMode: true } })
                            }
                          }}
                        />
                      ))}
                    </div>
                    <button
                      className="scroll-arrow scroll-arrow-right"
                      onClick={() => scrollRow(browseSectionRefs.current[section.level], 'right')}
                    >›</button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '1.2em', marginBottom: '8px' }}>🌱</p>
                <p>Content is being loaded. Make sure the backend is running.</p>
              </div>
            )}

          </div>
        </div>

        {/* Right Sidebar — only for logged-in users */}
        {user && (
          <RightSidebar
            streak={streak}
            longestStreak={longestStreak}
            careerGoal={careerGoal}
            skillProgress={skillProgress}
            activityHeatmap={activityHeatmap}
            roadmapData={roadmapData}
          />
        )}
      </div>
    </div>
  )
}
