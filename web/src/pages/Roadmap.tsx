import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './roadmap.css'

interface Skill {
  id: string
  name: string
  slug: string
  level: string
  estimated_hours: number
  mastery: number
  status: 'completed' | 'in_progress' | 'unlocked' | 'locked'
  prerequisites: string[]
  is_unlocked: boolean
}

interface RoadmapData {
  career: { name: string; description: string } | null
  skills: Skill[]
  total_skills: number
  completed_skills: number
  completion_percent: number
  message?: string
}

export default function Roadmap() {
  const { session } = useAuth()
  const [data, setData] = useState<RoadmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  const fetchRoadmap = async () => {
    try {
      const res = await fetch('/api/v1/roadmap/', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      if (res.ok) {
        setData(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) fetchRoadmap()
  }, [session])

  const handleSeedSkills = async () => {
    setSeeding(true)
    try {
      await fetch('/api/v1/roadmap/seed', { method: 'POST' })
      await fetchRoadmap()
    } catch (e) {
      console.error(e)
    } finally {
      setSeeding(false)
    }
  }

  // Group skills by level
  const groupByLevel = (skills: Skill[]) => {
    const groups: Record<string, Skill[]> = {}
    const order = ['foundation', 'beginner', 'intermediate', 'advanced']
    for (const s of skills) {
      const lvl = s.level || 'foundation'
      if (!groups[lvl]) groups[lvl] = []
      groups[lvl].push(s)
    }
    return order.filter(l => groups[l]).map(l => ({ level: l, skills: groups[l] }))
  }

  if (loading) {
    return (
      <div className="roadmap-page">
        <div className="page-nav"><Link to="/dashboard">← Back to Dashboard</Link></div>
        <div style={{ textAlign: 'center', padding: '80px', color: '#a0a0b8' }}>Loading roadmap...</div>
      </div>
    )
  }

  const hasSkills = data?.skills && data.skills.length > 0

  return (
    <div className="roadmap-page">
      <nav className="page-nav">
        <Link to="/dashboard">← Back to Dashboard</Link>
        <span style={{ color: '#6a6a80', fontSize: '0.85em' }}>
          {data?.career?.name || 'No career selected'}
        </span>
      </nav>

      {hasSkills ? (
        <>
          <div className="roadmap-header">
            <h2>🗺️ Your Learning Roadmap</h2>
            <p className="career-name">{data!.career?.name}</p>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${data!.completion_percent}%` }} />
            </div>
            <p className="progress-label">
              {data!.completed_skills} / {data!.total_skills} skills completed ({data!.completion_percent}%)
            </p>
          </div>

          <div className="skill-timeline">
            {groupByLevel(data!.skills).map(group => (
              <div className="level-group" key={group.level}>
                <div className={`level-label ${group.level}`}>
                  {group.level === 'foundation' || group.level === 'beginner' ? '🌱' : 
                   group.level === 'intermediate' ? '🚀' : '🔥'} {group.level}
                </div>
                <div className="skills-grid">
                  {group.skills.map(skill => (
                    <div className={`skill-node ${skill.status}`} key={skill.id}>
                      {skill.status === 'locked' && <div className="lock-icon">🔒</div>}
                      <div className="skill-header">
                        <p className="skill-name">{skill.name}</p>
                        <span className={`status-badge ${skill.status}`}>
                          {skill.status === 'completed' ? '✓ Done' :
                           skill.status === 'in_progress' ? '◑ Learning' :
                           skill.status === 'unlocked' ? '→ Ready' : '🔒 Locked'}
                        </span>
                      </div>
                      <div className="mastery-bar">
                        <div 
                          className={`mastery-fill ${skill.status}`} 
                          style={{ width: `${Math.round(skill.mastery * 100)}%` }} 
                        />
                      </div>
                      <div className="skill-meta">
                        <span>{Math.round(skill.mastery * 100)}% mastery</span>
                        <span>~{skill.estimated_hours}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="roadmap-empty">
          <h2 style={{ fontSize: '2em', marginBottom: '12px' }}>🗺️</h2>
          <h3>No Roadmap Yet</h3>
          <p>Seed the skill graph to see your personalized learning roadmap.</p>
          <button className="btn" onClick={handleSeedSkills} disabled={seeding}>
            {seeding ? '⏳ Seeding Skills...' : '🌱 Seed Skill Graph'}
          </button>
        </div>
      )}
    </div>
  )
}
