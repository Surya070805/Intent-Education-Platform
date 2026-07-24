import React from 'react'

interface RightSidebarProps {
  streak: number
  longestStreak: number
  careerGoal: string
  skillProgress: any[]
  activityHeatmap?: Record<string, number>
  roadmapData?: {
    completion_percent: number
    completed_skills: number
    total_skills: number
    career: any
    skills?: any[]
  } | null
}

export default function RightSidebar({ streak, longestStreak, careerGoal, skillProgress, activityHeatmap, roadmapData }: RightSidebarProps) {
  
  // Calculate skills stats
  const totalSkills = skillProgress.length
  const mastered = skillProgress.filter(s => s.mastery_level >= 0.8).length
  const inProgress = skillProgress.filter(s => s.mastery_level > 0 && s.mastery_level < 0.8).length
  const toLearn = totalSkills - mastered - inProgress

  // Calculate percentages for donut chart
  const pMastered = totalSkills > 0 ? (mastered / totalSkills) * 100 : 0
  const pInProgress = totalSkills > 0 ? (inProgress / totalSkills) * 100 : 0
  const conicGradient = `conic-gradient(var(--accent-green) 0% ${pMastered}%, var(--accent-purple) ${pMastered}% ${pMastered + pInProgress}%, #f1f5f9 ${pMastered + pInProgress}% 100%)`

  // Calculate dates for current week to show ticks
  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const today = new Date()
  const currentDay = today.getDay() // 0 is Sunday, 1 is Monday
  const currentWeekDates: string[] = []
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - (currentDay === 0 ? 7 : currentDay) + i)
    currentWeekDates.push(d.toISOString().split('T')[0])
  }



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'mastered': return <span style={{ color: '#22c55e' }}>✅</span>
      case 'active': return <span style={{ color: '#a855f7' }}>🟣</span>
      case 'locked': return <span style={{ color: '#6a6a80' }}>🔒</span>
      default: return null
    }
  }

  return (
    <div className="right-pane pane">
      
      {/* Learning Streak */}
      <div className="widget-card">
        <h4 className="widget-title">
          <span>Learning Streak 🔥</span>
        </h4>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '2.5em', fontWeight: '800', lineHeight: 1, color: 'var(--accent-purple)' }}>
            {streak}
          </span>
          <span style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>days</span>
          <span style={{ marginLeft: 'auto', fontSize: '2.5em' }}>🔥</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75em', margin: '0 0 16px' }}>Best streak: {longestStreak} days</p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7em', color: 'var(--text-muted)' }}>
          {daysOfWeek.map((day, i) => {
            const dateStr = currentWeekDates[i]
            const hasSession = activityHeatmap && activityHeatmap[dateStr] > 0
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span>{day}</span>
                {hasSession ? (
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px' }}>✓</div>
                ) : (
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--border-subtle)' }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Your Roadmap */}
      <div className="widget-card">
        <h4 className="widget-title" style={{ marginBottom: '8px' }}>Your Roadmap</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', color: 'var(--text-primary)', marginBottom: '8px' }}>
          <span>{careerGoal || 'No goal set'}</span>
          <span>{roadmapData?.completion_percent ?? 0}%</span>
        </div>
        <div className="progress-bar-bg" style={{ marginBottom: '20px' }}>
          <div className="progress-bar-fill" style={{ width: `${roadmapData?.completion_percent ?? 0}%`, background: 'var(--accent-purple)' }} />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {roadmapData?.skills && roadmapData.skills.length > 0 ? (
            roadmapData.skills
              .filter((s: any) => s.status !== 'locked')
              .slice(0, 4)
              .map((item: any) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8em', color: 'var(--text-secondary)' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{item.name}</span>
                  {getStatusIcon(item.status === 'completed' ? 'mastered' : item.status === 'in_progress' ? 'active' : 'locked')}
                </div>
              ))
          ) : (
            <div style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>Complete onboarding to see your roadmap.</div>
          )}
        </div>
        
        <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => window.location.href = '/roadmap'}>View Full Roadmap</button>
      </div>

      {/* Skills Progress */}
      <div className="widget-card">
        <h4 className="widget-title">Skills Progress</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="donut-chart" style={{ background: conicGradient }}>
            <div className="donut-inner">
              <span>{totalSkills}</span>
              <small>Skills</small>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8em' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: 'var(--accent-green)' }}>●</span> Mastered</span>
              <span style={{ color: 'var(--text-primary)' }}>{mastered}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: 'var(--accent-blue)' }}>●</span> In Progress</span>
              <span style={{ color: 'var(--text-primary)' }}>{inProgress}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: 'var(--text-muted)' }}>●</span> To Learn</span>
              <span style={{ color: 'var(--text-primary)' }}>{toLearn}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Revision */}
      <div className="widget-card">
        <h4 className="widget-title" style={{ fontSize: '0.85em', color: 'var(--text-secondary)' }}>Upcoming Revision</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h5 style={{ margin: '0 0 4px', fontSize: '0.95em', fontWeight: 600 }}>Linear Regression</h5>
            <div style={{ fontSize: '0.75em', color: 'var(--text-muted)' }}>In 2 days • 15 min</div>
          </div>
          <div style={{ background: '#f3e8ff', padding: '10px', borderRadius: '10px', color: 'var(--accent-purple)' }}>
            📅
          </div>
        </div>
      </div>

    </div>
  )
}
