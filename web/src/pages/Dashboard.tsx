import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import RecommendationCard, { Recommendation } from '../components/RecommendationCard'

export default function Dashboard() {
  const { user, session, signOut } = useAuth()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('/api/v1/recommendations/', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setRecommendations(data)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchRecommendations()
    }
  }, [session])

  const generateRecommendations = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/v1/recommendations/generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      if (res.ok) {
        await fetchRecommendations()
      } else {
        setError('Failed to generate recommendations.')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/v1/recommendations/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({ status })
      })
      // Optimistic update
      setRecommendations(prev => prev.filter(r => r.id !== id || status === 'saved'))
      if (status === 'saved') {
         setRecommendations(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSeed = async () => {
    await fetch('/api/v1/recommendations/seed', { method: 'POST' })
    alert("Seeded database!")
  }

  if (loading) return <div>Loading dashboard...</div>

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Bloom Dashboard</h2>
        <div>
          <button onClick={handleSeed} style={{ marginRight: '10px' }}>Seed DB (Dev)</button>
          <button onClick={signOut}>Sign Out</button>
        </div>
      </div>
      <p>Welcome back, {user?.email}</p>

      <div style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Your Up Next</h3>
          <button 
            onClick={generateRecommendations}
            disabled={generating}
            style={{ padding: '8px 16px', cursor: 'pointer', background: '#0056b3', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            {generating ? 'Analyzing...' : 'Generate New Recommendations'}
          </button>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        {recommendations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#f8f9fa', borderRadius: '8px' }}>
            <p>You don't have any pending recommendations.</p>
            <p>Click the button above to let AI analyze your learning intent!</p>
          </div>
        ) : (
          recommendations.map(rec => (
            <RecommendationCard 
              key={rec.id} 
              recommendation={rec} 
              onUpdateStatus={handleUpdateStatus} 
            />
          ))
        )}
      </div>
    </div>
  )
}
