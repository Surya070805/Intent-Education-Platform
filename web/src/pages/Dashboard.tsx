import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import VideoCard, { Resource } from '../components/VideoCard'
import Sidebar from '../components/Sidebar'
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

export default function Dashboard() {
  const { user, session, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [streak, setStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [dailyGoalCompleted, setDailyGoalCompleted] = useState(0)
  const [careerGoal, setCareerGoal] = useState<string>('')
  const [skillProgress, setSkillProgress] = useState<any[]>([])
  const [activityHeatmap, setActivityHeatmap] = useState<Record<string, number>>({})
  const [roadmapData, setRoadmapData] = useState<{ completion_percent: number; completed_skills: number; total_skills: number; career: any } | null>(null)
  
  const [loading, setLoading] = useState(true)
  const upNextScrollRef = useRef<HTMLDivElement>(null)

  const fetchDashboardData = async () => {
    if (!session) return

    try {
      const headers = { 'Authorization': `Bearer ${session.access_token}` }
      
      const [recsRes, browseRes, sessionsRes, progressRes, revisionsRes, profileRes, roadmapRes] = await Promise.all([
        fetch('/api/v1/recommendations/', { headers }),
        fetch('/api/v1/recommendations/browse', { headers }),
        fetch('/api/v1/sessions/active', { headers }),
        fetch('/api/v1/progress/', { headers }),
        fetch('/api/v1/sessions/revisions', { headers }),
        fetch('/api/v1/profile/', { headers }),
        fetch('/api/v1/roadmap/', { headers })
      ])

      if (recsRes.ok) {
        const data = await recsRes.json()
        setRecommendations(data.filter((r: Recommendation) => r.status === 'pending' || r.status === 'saved'))
      }

      if (sessionsRes.ok) {
        const data = await sessionsRes.json()
        setActiveSessions(data || [])
      }

      if (progressRes.ok) {
        const data = await progressRes.json()
        setStreak(data.stats?.current_streak || 0)
        setLongestStreak(data.stats?.longest_streak || 0)
        
        const todayStr = new Date().toISOString().split('T')[0]
        const completedToday = data.activity_heatmap?.[todayStr] || 0
        setDailyGoalCompleted(completedToday)
        setActivityHeatmap(data.activity_heatmap || {})
        setSkillProgress(data.skill_progress || [])
      }

      if (profileRes.ok) {
        const data = await profileRes.json()
        setCareerGoal(data.learning_profile?.career?.name || '')
      }

      if (roadmapRes.ok) {
        const data = await roadmapRes.json()
        setRoadmapData(data)
      }
    } catch (e: any) {
      console.error('Error fetching dashboard data:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [session])

  const scrollRow = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    const el = ref.current
    if (!el) return
    const scrollAmount = el.clientWidth * 0.75
    el.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    })
  }

  const handleStatusUpdate = (id: string, status: string) => {
    if (status === 'dismissed') {
      setRecommendations(prev => prev.filter(r => r.id !== id))
    }
    // If 'saved', we just leave it in the list (as status='saved' is still fetched).
    // Or we could update its internal status if we rendered it differently.
  }

  // Featured recommendation for hero section
  const featured = recommendations.length > 0 ? recommendations[0] : null

  if (loading) {
    return (
      <div className="dashboard">
        <Sidebar userName={user?.email || 'Learner'} />
        <div className="main-pane pane">
          <div style={{ padding: '48px', display: 'flex', gap: '16px' }}>
            {[1, 2, 3].map(i => <div key={i} className="shimmer-card" />)}
          </div>
        </div>
        <div className="right-pane pane" />
      </div>
    )
  }

  const userName = user?.email ? user.email.split('@')[0] : 'Arjun'

  return (
    <div className="dashboard">
      
      {/* 1. Left Sidebar */}
      <Sidebar userName={userName} dailyGoalCompleted={dailyGoalCompleted} dailyGoalTarget={3} />

      {/* 2. Main Content Area */}
      <div className="main-pane pane">
        
        {/* Top Header */}
        <header className="main-header">
          <form
            onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`) }}
            className="search-bar"
            style={{ cursor: 'text' }}
          >
            <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>🔍</span>
            <input
              type="text"
              placeholder="Search for skills, topics, careers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`) }}
            />
            <span className="search-shortcut" style={{ cursor: 'pointer' }} onClick={() => { if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`) }}>→</span>
          </form>
          <div className="header-icons">
            <Link to="/progress" style={{ textDecoration: 'none', position: 'relative', cursor: 'pointer' }}>
              <span>🔔</span>
              <span style={{ position: 'absolute', top: 0, right: 0, width: '6px', height: '6px', background: 'var(--accent-red)', borderRadius: '50%' }} />
            </Link>
            <Link to="/profile" style={{ textDecoration: 'none' }}>
              <span style={{ cursor: 'pointer' }}>⚙️</span>
            </Link>
          </div>
        </header>

        <div className="main-content-inner">
          
          {/* Greeting */}
          <div className="greeting-section">
            <div>
              <h2>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {userName}! 👋</h2>
              <p>Ready to continue your learning journey?</p>
            </div>
            <button className="btn btn-ghost" onClick={() => navigate('/search')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent-purple)', borderColor: 'rgba(168, 85, 247, 0.2)' }}>
              <span>✨</span> Ask AI Mentor
            </button>
          </div>



          {/* Recommended for you */}
          {recommendations.length > 0 && (
            <div className="up-next-section">
              <div className="row-header">
                <h3 className="row-title">Recommended for you</h3>
                <button
                  onClick={async () => {
                    const res = await fetch('/api/v1/recommendations/generate', {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${session?.access_token}` }
                    })
                    if (res.ok) {
                      const newRecs = await res.json()
                      setRecommendations(prev => [...prev, ...newRecs])
                    }
                  }}
                  style={{ color: 'var(--accent-purple)', background: 'none', border: 'none', fontSize: '0.85em', cursor: 'pointer', fontWeight: 600 }}
                >
                  + More →
                </button>
              </div>
              <div className="scroll-container">
                <button className="scroll-arrow scroll-arrow-left" onClick={() => scrollRow(upNextScrollRef, 'left')}>‹</button>
                <div className="scroll-track" ref={upNextScrollRef}>
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
                <button className="scroll-arrow scroll-arrow-right" onClick={() => scrollRow(upNextScrollRef, 'right')}>›</button>
              </div>
            </div>
          )}

          {/* Continue Learning */}
          {activeSessions.length > 0 && (
            <div className="up-next-section">
              <div className="row-header">
                <h3 className="row-title">Continue learning</h3>
                <span style={{ color: 'var(--accent-blue)', fontSize: '0.85em', cursor: 'pointer' }}>See all</span>
              </div>
              <div>
                {activeSessions.slice(0, 2).map(session => (
                  <ContinueLearningCard
                    key={session.id}
                    title={session.resource.title}
                    channel={session.resource.channel_name || 'YouTube Channel'}
                    progress={65} // Mocking progress to match design
                    thumbnailUrl={`https://img.youtube.com/vi/${session.resource.youtube_id}/mqdefault.jpg`}
                    onClick={() => navigate(`/watch?v=${session.resource.youtube_id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Bottom Banner */}
          <div style={{ background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 'var(--radius-md)', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '2em', color: 'var(--accent-purple)' }}>✨</span>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '0.95em', color: 'var(--text-primary)' }}>Consistency is the compound interest of learning.</p>
                <p style={{ margin: 0, fontSize: '0.85em', color: 'var(--text-muted)' }}>Keep building, every day counts.</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--accent-green)', fontSize: '0.85em', marginBottom: '4px' }}>You're in the top 18%</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>of learners this week!</div>
            </div>
          </div>
          
        </div>
      </div>

      {/* 3. Right Sidebar */}
      <RightSidebar 
        streak={streak}
        longestStreak={longestStreak}
        careerGoal={careerGoal} 
        skillProgress={skillProgress}
        activityHeatmap={activityHeatmap}
        roadmapData={roadmapData}
      />

    </div>
  )
}
