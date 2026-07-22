import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export interface Recommendation {
  id: string
  score: number
  explanation: string
  status: string
  resource: {
    id: string
    youtube_id: string
    title: string
    channel_name: string
    duration_seconds: number
    thumbnail_url: string
    difficulty?: string
  }
}

interface Props {
  recommendation: Recommendation
  onUpdateStatus: (id: string, status: string) => Promise<void>
}

export default function RecommendationCard({ recommendation, onUpdateStatus }: Props) {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { resource, score, explanation, status, id } = recommendation

  const handleAction = async (newStatus: string) => {
    setLoading(true)
    await onUpdateStatus(id, newStatus)
    setLoading(false)
  }

  if (status !== 'pending' && status !== 'saved') {
    return null
  }

  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      display: 'flex',
      gap: '16px',
      alignItems: 'flex-start',
      background: 'white'
    }}>
      <img 
        src={resource.thumbnail_url} 
        alt={resource.title} 
        style={{ width: '160px', borderRadius: '4px', objectFit: 'cover' }}
      />
      
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: '0 0 8px 0' }}>{resource.title}</h3>
        <p style={{ margin: '0 0 8px 0', fontSize: '0.9em', color: '#666' }}>
          {resource.channel_name} • {Math.round(resource.duration_seconds / 60)} mins
          {resource.difficulty && ` • ${resource.difficulty}`}
        </p>
        
        <div style={{
          background: '#f8f9fa',
          padding: '12px',
          borderRadius: '6px',
          margin: '12px 0',
          borderLeft: '4px solid #0056b3'
        }}>
          <p style={{ margin: 0, fontSize: '0.9em', fontStyle: 'italic' }}>
            <strong>Why this?</strong> {explanation}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ 
            background: '#e6f2ff', 
            color: '#0056b3', 
            padding: '4px 8px', 
            borderRadius: '12px', 
            fontSize: '0.8em',
            fontWeight: 'bold'
          }}>
            Match Score: {Math.round(score * 100)}%
          </span>
          <div style={{ flex: 1 }} />
          <button 
            onClick={() => handleAction('saved')} 
            disabled={loading || status === 'saved'}
            style={{ padding: '6px 12px', cursor: 'pointer' }}
          >
            {status === 'saved' ? 'Saved' : 'Save'}
          </button>
          <button 
            onClick={() => navigate(`/watch/${id}`, { state: { youtubeId: resource.youtube_id } })}
            style={{ padding: '6px 12px', cursor: 'pointer', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Watch Now
          </button>
          <button 
            onClick={() => handleAction('dismissed')} 
            disabled={loading}
            style={{ padding: '6px 12px', cursor: 'pointer', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
