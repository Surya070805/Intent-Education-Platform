import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Overlay() {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  useEffect(() => {
    if (!session) return

    const fetchRecs = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/v1/recommendations/', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setRecommendations(data)
        }
      } catch (e) {
        console.error('Bloom Extension Error:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchRecs()
  }, [session])

  if (!session) {
    return (
      <div style={styles.container}>
        <h3 style={styles.header}>Bloom</h3>
        <p style={{ fontSize: '12px' }}>Please log in via the web app to see recommendations.</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.header}>Bloom - Up Next</h3>
      
      {loading ? (
        <p style={{ fontSize: '12px', padding: '10px' }}>Loading...</p>
      ) : recommendations.length === 0 ? (
        <p style={{ fontSize: '12px', padding: '10px' }}>No recommendations found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
    background: 'white',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    color: '#0f0f0f'
  },
  header: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: '600'
  },
  card: {
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    padding: '12px',
    background: '#f9f9f9',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px'
  },
  titleLink: {
    color: '#0f0f0f',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '14px',
    lineHeight: '1.4'
  },
  explanation: {
    margin: 0,
    fontSize: '12px',
    color: '#606060',
    fontStyle: 'italic'
  },
  matchScore: {
    background: '#e6f2ff',
    color: '#0056b3',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: 'bold',
    alignSelf: 'flex-start'
  }
}
