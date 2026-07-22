import React from 'react'
import { useNavigate } from 'react-router-dom'

export interface Resource {
  id: string
  youtube_id: string
  title: string
  channel_name: string
  duration_seconds: number
  thumbnail_url: string
  difficulty?: string
  view_count?: number
  like_count?: number
  skills?: string[]
}

interface VideoCardProps {
  resource: Resource
  matchScore?: number       // If from a personal recommendation
  recommendationId?: string // If from a personal recommendation
  explanation?: string      // If AI generated an explanation
  onStatusUpdate?: (id: string, status: string) => void // Callback when saved/dismissed
}

export default function VideoCard({ resource, matchScore, recommendationId, explanation, onStatusUpdate }: VideoCardProps) {
  const navigate = useNavigate()

  const formatDuration = (seconds: number) => {
    if (!seconds) return ''
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m} min`
  }

  const handleClick = () => {
    if (recommendationId) {
      // Personal recommendation — track via recommendation flow
      navigate(`/watch/${recommendationId}`, { state: { youtubeId: resource.youtube_id } })
    } else {
      // Browse card — direct watch with youtube_id
      navigate(`/watch/${resource.youtube_id}`, { state: { youtubeId: resource.youtube_id, browseMode: true } })
    }
  }

  const handleAction = async (e: React.MouseEvent, status: string) => {
    e.stopPropagation() // prevent navigating to video
    if (!recommendationId || !onStatusUpdate) return
    
    // Optimistic UI update
    onStatusUpdate(recommendationId, status)

    try {
      // Try to get token from local storage (or pass session down, but we can do a quick check)
      const token = localStorage.getItem('supabase.auth.token')
      let parsedToken = ''
      if (token) {
        const parsed = JSON.parse(token)
        parsedToken = parsed.currentSession?.access_token || ''
      }

      await fetch(`/api/v1/recommendations/${recommendationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${parsedToken}`
        },
        body: JSON.stringify({ status })
      })
    } catch (err) {
      console.error("Failed to update status", err)
    }
  }

  return (
    <div className="video-card" onClick={handleClick}>
      <div className="card-thumbnail">
        <img 
          src={resource.thumbnail_url || `https://img.youtube.com/vi/${resource.youtube_id}/hqdefault.jpg`} 
          alt={resource.title} 
          loading="lazy"
        />

        {/* Play overlay */}
        <div className="play-overlay">
          <div className="play-icon">▶</div>
        </div>

        {/* Duration badge */}
        {resource.duration_seconds > 0 && (
          <span className="duration-badge">{formatDuration(resource.duration_seconds)}</span>
        )}
        
        {/* Platform badge */}
        <span style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          background: 'red',
          color: 'white',
          fontSize: '0.7em',
          fontWeight: 'bold',
          padding: '2px 6px',
          borderRadius: '4px',
          zIndex: 10
        }}>
          YouTube
        </span>
        
        {/* Actions (Save / Dismiss) */}
        {recommendationId && onStatusUpdate && (
          <div className="card-actions" style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px', zIndex: 10 }}>
            <button 
              onClick={(e) => handleAction(e, 'saved')}
              style={{ background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', padding: '6px', borderRadius: '50%', cursor: 'pointer' }}
              title="Save for later"
            >
              💾
            </button>
            <button 
              onClick={(e) => handleAction(e, 'dismissed')}
              style={{ background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', padding: '6px', borderRadius: '50%', cursor: 'pointer' }}
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* Match score pill (only for personal recommendations) */}
        {matchScore && (
          <span className="match-pill">{Math.round(matchScore * 100)}% Match</span>
        )}

        {/* Difficulty badge (only for browse cards) */}
        {resource.difficulty && !matchScore && (
          <span className={`difficulty-badge ${resource.difficulty}`}>
            {resource.difficulty}
          </span>
        )}
      </div>

      <div className="card-info">
        <p className="card-title">{resource.title}</p>
        <p className="card-channel">{resource.channel_name}</p>
        
        {/* AI Explanation (if provided) */}
        {explanation && (
          <p style={{ fontSize: '0.8em', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            ✨ {explanation}
          </p>
        )}

        {/* Skills Tags */}
        {resource.skills && resource.skills.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
            {resource.skills.map((skill, idx) => (
              <span key={idx} style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.7em', padding: '2px 6px', borderRadius: '4px' }}>
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
