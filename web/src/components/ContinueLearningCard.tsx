import React from 'react'

interface ContinueLearningCardProps {
  title: string
  channel: string
  progress: number
  thumbnailUrl?: string
  onClick: () => void
}

export default function ContinueLearningCard({ title, channel, progress, thumbnailUrl, onClick }: ContinueLearningCardProps) {
  return (
    <div className="continue-card" onClick={onClick}>
      <div className="continue-thumb">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
        ) : (
          <span>🐼</span>
        )}
      </div>
      <div className="continue-info">
        <h4 className="continue-title">{title}</h4>
        <p className="continue-meta">{channel} • 3.5 hours left</p>
        <div className="continue-progress">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text">{progress}%</span>
        </div>
      </div>
      <button className="btn btn-primary" style={{ padding: '10px 24px', background: 'var(--accent-blue)', boxShadow: 'none' }}>
        Continue
      </button>
    </div>
  )
}
