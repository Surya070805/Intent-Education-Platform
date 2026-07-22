import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface OverlayProps {
  youtubeId: string
}

export default function Overlay({ youtubeId }: OverlayProps) {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [guardStatus, setGuardStatus] = useState<{ is_relevant: boolean; reason: string; guard_mode_enabled: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    // Read session from chrome extension storage
    if (chrome && chrome.storage) {
      chrome.storage.local.get(['sb_session'], (result) => {
        if (result.sb_session) {
          setSession(result.sb_session)
        } else {
          setSession(null)
        }
      })
    } else {
      console.warn("Chrome storage API not available.")
      setSession(null)
    }
  }, [])

  useEffect(() => {
    if (!session) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const headers = { 'Authorization': `Bearer ${session.access_token}` }
        
        // Fetch recommendations and guard check in parallel
        const [recsRes, guardRes] = await Promise.all([
          fetch('http://localhost:8000/api/v1/recommendations/', { headers }),
          fetch(`http://localhost:8000/api/v1/guard/check?youtube_id=${youtubeId}`, { headers })
        ])
        
        if (recsRes.ok) {
          const data = await recsRes.json()
          setRecommendations(data.filter((r: any) => r.status === 'pending' || r.status === 'saved'))
        }
        
        if (guardRes.ok) {
          const guardData = await guardRes.json()
          setGuardStatus(guardData)
        }
      } catch (e) {
        console.error('Bloom Extension Error:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session, youtubeId])

  if (!session) {
    return (
      <div style={styles.container}>
        <h3 style={styles.header}>🌸 Bloom</h3>
        <p style={{ fontSize: '13px', color: '#a0a0b8', margin: 0 }}>Please log in via the web app to sync your learning path.</p>
      </div>
    )
  }

  const showGuardWarning = guardStatus && guardStatus.guard_mode_enabled && !guardStatus.is_relevant

  useEffect(() => {
    if (showGuardWarning) {
      // Pause the video when warning appears
      const video = document.querySelector('video')
      if (video) video.pause()
    }
  }, [showGuardWarning])

  // If there's a guard warning, render a full-screen blocking overlay over the entire screen or player
  if (showGuardWarning) {
    return (
      <div style={styles.blockerOverlay}>
        <div style={styles.blockerModal}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛡️</div>
          <h2 style={{ margin: '0 0 16px 0', color: '#f0f0f5' }}>Focus Interrupted</h2>
          <p style={{ margin: '0 0 24px 0', color: '#a0a0b8', lineHeight: '1.5', fontSize: '15px' }}>
            {guardStatus.reason}
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <a href="http://localhost:5173/dashboard" style={styles.primaryBtnLarge}>
              ← Return to Dashboard
            </a>
            <button 
              style={styles.ghostBtnLarge} 
              onClick={() => {
                setGuardStatus({ ...guardStatus, is_relevant: true })
                const video = document.querySelector('video')
                if (video) video.play()
              }}
            >
              Ignore & Watch Anyway
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* We removed the inline guard warning because it is now a full-screen blocker above */}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={styles.header}>🌸 Bloom - Up Next</h3>
        <a href="http://localhost:5173/dashboard" target="_blank" rel="noreferrer" style={{ color: '#a5b4fc', fontSize: '12px', textDecoration: 'none' }}>
          Dashboard ↗
        </a>
      </div>
      
      {loading ? (
        <p style={{ fontSize: '13px', color: '#a0a0b8' }}>Analyzing learning path...</p>
      ) : recommendations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <p style={{ fontSize: '13px', color: '#a0a0b8', margin: '0 0 12px' }}>You have no pending recommendations.</p>
          <a href="http://localhost:5173/dashboard" target="_blank" rel="noreferrer" style={styles.primaryBtn}>
            Generate New Picks
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recommendations.slice(0, 3).map(rec => (
            <div key={rec.id} style={styles.card}>
              <a href={`/watch?v=${rec.resource.youtube_id}`} style={styles.titleLink}>
                {rec.resource.title}
              </a>
              <p style={styles.explanation}>{rec.explanation}</p>
              <div style={styles.matchScore}>
                {Math.round(rec.score * 100)}% Match
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    background: '#0a0a0f',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '24px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    color: '#f0f0f5',
    width: '100%',
    boxSizing: 'border-box' as const
  },
  header: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  guardWarning: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px'
  },
  dismissBtn: {
    background: 'transparent',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#ef4444',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
    width: '100%',
    fontWeight: '600'
  },
  primaryBtn: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '600'
  },
  card: {
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '10px',
    padding: '14px',
    background: '#141420',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    transition: 'transform 0.2s, border-color 0.2s'
  },
  titleLink: {
    color: '#f0f0f5',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '14px',
    lineHeight: '1.4'
  },
  explanation: {
    margin: 0,
    fontSize: '12px',
    color: '#a0a0b8',
    lineHeight: '1.5'
  },
  matchScore: {
    background: 'rgba(99, 102, 241, 0.15)',
    color: '#a5b4fc',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700',
    alignSelf: 'flex-start'
  },
  blockerOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(10, 10, 15, 0.95)',
    backdropFilter: 'blur(10px)',
    zIndex: 2147483647, // Max z-index
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Inter", sans-serif'
  },
  blockerModal: {
    background: '#141420',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '24px',
    padding: '48px',
    maxWidth: '500px',
    textAlign: 'center' as const,
    boxShadow: '0 24px 48px rgba(0,0,0,0.5)'
  },
  primaryBtnLarge: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    color: 'white',
    padding: '14px 24px',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer'
  },
  ghostBtnLarge: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#a0a0b8',
    padding: '14px 24px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  }
}
