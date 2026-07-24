import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import VideoCard, { Resource } from '../components/VideoCard'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function Search() {
  const { session } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [difficulty, setDifficulty] = useState('')
  const [results, setResults] = useState<Resource[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // Auto-search when query changes (debounced)
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSearched(false)
      return
    }
    const timer = setTimeout(() => performSearch(), 400)
    return () => clearTimeout(timer)
  }, [query, difficulty])

  // Auto-search on mount if query is in URL
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setQuery(q)
    }
  }, [])

  const performSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const url = new URL(`${API_BASE}/api/v1/search/`, window.location.origin)
      url.searchParams.append('q', query)
      if (difficulty) url.searchParams.append('difficulty', difficulty)

      const headers: Record<string, string> = {}
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`

      const res = await fetch(url.toString(), { headers })
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams(query ? { q: query } : {})
    performSearch()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 48px' }}>
        <h2 style={{ fontSize: '1.8em', marginBottom: '24px', color: 'var(--text-primary)' }}>🔍 Search Resources</h2>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
          <input
            type="text"
            placeholder="Search by title, channel, or skill (e.g. 'React', 'Python', 'Machine Learning')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1, padding: '14px 20px', fontSize: '1em',
              background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
              borderRadius: '12px', color: 'var(--text-primary)', outline: 'none',
            }}
          />
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={{
              padding: '0 20px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
              borderRadius: '12px', color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            <option value="">Any Difficulty</option>
            <option value="beginner">🌱 Beginner</option>
            <option value="intermediate">🚀 Intermediate</option>
            <option value="advanced">🔥 Advanced</option>
          </select>
          <button
            type="submit"
            style={{
              padding: '14px 28px', background: 'var(--accent-purple)', color: 'white',
              border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95em',
            }}
          >
            Search
          </button>
        </form>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            ⏳ Searching...
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '2.5em', display: 'block', marginBottom: '16px' }}>🤔</span>
            <p>No resources found for "<strong>{query}</strong>".</p>
            <p style={{ fontSize: '0.9em', marginTop: '8px' }}>Try a different keyword or browse by difficulty.</p>
          </div>
        )}

        {!searched && !loading && (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '3em', display: 'block', marginBottom: '16px' }}>🔍</span>
            <p style={{ fontSize: '1.1em' }}>Search for any skill, topic, or channel name above.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
              {['Python', 'React', 'Machine Learning', 'JavaScript', 'Docker', 'TypeScript'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  style={{
                    padding: '8px 18px', borderRadius: '20px', border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: '0.9em', transition: 'all 0.15s',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9em', marginBottom: '24px' }}>
              {results.length} result{results.length !== 1 ? 's' : ''} for "<strong style={{ color: 'var(--text-primary)' }}>{query}</strong>"
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px'
            }}>
              {results.map(resource => (
                <VideoCard key={resource.id || resource.youtube_id} resource={resource} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
