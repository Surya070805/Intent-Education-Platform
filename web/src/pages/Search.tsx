import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import VideoCard, { Resource } from '../components/VideoCard'

export default function Search() {
  const { session } = useAuth()
  const navigate = useNavigate()
  
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [results, setResults] = useState<Resource[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // Use a simple debounce for search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSearched(false)
      return
    }

    const timer = setTimeout(() => {
      performSearch()
    }, 400)

    return () => clearTimeout(timer)
  }, [query, difficulty])

  const performSearch = async () => {
    if (!session || !query.trim()) return
    
    setLoading(true)
    setSearched(true)
    try {
      const url = new URL('/api/v1/search/', window.location.origin)
      url.searchParams.append('q', query)
      if (difficulty) url.searchParams.append('difficulty', difficulty)

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setResults(data.results || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f0f5', fontFamily: 'Inter' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 48px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/dashboard" style={{ color: '#a0a0b8', textDecoration: 'none' }}>← Back to Dashboard</Link>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 48px' }}>
        <h2 style={{ fontSize: '2em', marginBottom: '24px' }}>🔍 Search Resources</h2>
        
        <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
          <input 
            type="text"
            placeholder="Search by title or channel (e.g., 'React', 'Traversy')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ 
              flex: 1, 
              padding: '16px 20px', 
              fontSize: '1.1em', 
              background: '#141420', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '8px', 
              color: 'white',
              outline: 'none'
            }}
          />
          <select 
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={{ 
              padding: '0 20px', 
              background: '#141420', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '8px', 
              color: '#a0a0b8' 
            }}
          >
            <option value="">Any Difficulty</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {loading && <div style={{ color: '#a0a0b8' }}>Searching...</div>}

        {!loading && searched && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#a0a0b8' }}>
            <span style={{ fontSize: '2em', display: 'block', marginBottom: '16px' }}>🤔</span>
            No resources found for "{query}".
          </div>
        )}

        {!loading && results.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '24px' 
          }}>
            {results.map(resource => (
              <VideoCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
