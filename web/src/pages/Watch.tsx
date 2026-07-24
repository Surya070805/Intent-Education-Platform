import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export default function Watch() {
  const { id } = useParams<{ id: string }>() // recommendation_id or youtube_id
  const navigate = useNavigate()
  const location = useLocation()
  const youtubeId = location.state?.youtubeId || id // Fallback: id IS the youtube_id in browse mode
  const isBrowseMode = location.state?.browseMode === true
  const { session } = useAuth()
  
  const [player, setPlayer] = useState<any>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [savedNotes, setSavedNotes] = useState<{ time: string; text: string }[]>([])
  const [currentNote, setCurrentNote] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [rating, setRating] = useState<number | null>(null)
  const [masteryUpdates, setMasteryUpdates] = useState<any[]>([])
  const sessionStartTime = useRef<number>(Date.now())

  // Tabs: 'notes' | 'coach'
  const [activeTab, setActiveTab] = useState<'notes' | 'coach'>('notes')
  
  // AI Coach State
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])

  // Initialize YouTube Iframe API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        initPlayer()
      }
    } else {
      initPlayer()
    }

    function initPlayer() {
      const ytPlayer = new window.YT.Player('yt-player', {
        height: '450',
        width: '100%',
        videoId: youtubeId,
        events: {
          onReady: (e: any) => setPlayer(e.target)
        }
      })
    }

    return () => {
      // Cleanup
      if (player && typeof player.destroy === 'function') {
        player.destroy()
      }
    }
  }, [id])

  // Session Tracking
  useEffect(() => {
    // Start session
    const startSession = async () => {
      if (!session || isBrowseMode) return // Skip session tracking for browse mode
      try {
        const res = await fetch('/api/v1/sessions/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ recommendation_id: id }) 
        })
        const data = await res.json()
        setSessionId(data.id)
        sessionStartTime.current = Date.now()
      } catch (e) {
        console.error("Failed to start session", e)
      }
    }
    startSession()

    // End session on unmount
    return () => {
      if (sessionId && session) {
        const durationSeconds = Math.floor((Date.now() - sessionStartTime.current) / 1000)
        fetch(`/api/v1/sessions/${sessionId}/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ duration_seconds: durationSeconds }),
          keepalive: true
        }).catch(e => console.error(e))
      }
    }
  }, [session, id, sessionId])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleSaveNote = () => {
    if (!currentNote.trim()) return
    const currentTime = player && typeof player.getCurrentTime === 'function' 
      ? player.getCurrentTime() 
      : 0
    
    setSavedNotes(prev => [...prev, {
      time: formatTime(currentTime),
      text: currentNote
    }])
    setCurrentNote('')
  }

  const handleFinishLearning = () => {
    // Show feedback modal instead of navigating away immediately
    setShowFeedback(true)
  }

  const handleSubmitFeedback = async () => {
    if (!rating || !sessionId) return

    try {
      const durationSeconds = Math.floor((Date.now() - sessionStartTime.current) / 1000)

      // End the session with the rating — this triggers the Mastery Engine
      const endRes = await fetch(`/api/v1/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ duration_seconds: durationSeconds, rating })
      })
      
      if (endRes.ok) {
        const endData = await endRes.json()
        setMasteryUpdates(endData.mastery_updates || [])
      }

      // Also submit qualitative feedback
      await fetch(`/api/v1/feedback/session/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ rating, notes: savedNotes })
      }).catch(() => {}) // Non-critical

    } catch (e) {
      console.error(e)
    }
  }

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return
    
    const userMessage = { role: 'user', content: chatInput }
    const newMessages = [...chatMessages, userMessage]
    setChatMessages(newMessages)
    setChatInput('')
    setIsChatLoading(true)

    try {
      const res = await fetch('/api/v1/coach/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          youtube_id: youtubeId,
          messages: newMessages
        })
      })

      if (res.ok) {
        const data = await res.json()
        setChatMessages([...newMessages, { role: 'assistant', content: data.response }])
      } else {
        setChatMessages([...newMessages, { role: 'assistant', content: 'Oops, I encountered an error connecting to my servers.' }])
      }
    } catch (e) {
      setChatMessages([...newMessages, { role: 'assistant', content: 'Oops, something went wrong on my end.' }])
    } finally {
      setIsChatLoading(false)
    }
  }

  if (showFeedback) {
    // If we have mastery updates, show them; else show rating form
    if (masteryUpdates.length > 0) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
          <div style={{ maxWidth: '500px', width: '90%', background: 'var(--bg-card)', borderRadius: '24px', padding: '48px 40px', border: '1px solid var(--border-subtle)', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '3em', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '1.8em' }}>Session Complete!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>You leveled up these skills:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px', textAlign: 'left' }}>
              {masteryUpdates.map((update, i) => (
                <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, textTransform: 'capitalize' }}>
                      {update.skill_slug?.replace(/-/g, ' ')}
                    </span>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
                      +{Math.round(update.delta * 100)}%
                    </span>
                  </div>
                  <div style={{ background: 'var(--border-subtle)', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${Math.round(update.new_mastery * 100)}%`, 
                      background: update.mastered ? 'var(--accent-green)' : 'var(--accent-purple)',
                      borderRadius: '8px',
                      transition: 'width 1s ease'
                    }} />
                  </div>
                  <div style={{ fontSize: '0.75em', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'right' }}>
                    {Math.round(update.new_mastery * 100)}% mastery {update.mastered ? '✅ Mastered!' : ''}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              style={{ width: '100%', padding: '14px', background: 'var(--accent-purple)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1em', fontWeight: 700, cursor: 'pointer' }}
            >
              Back to Dashboard →
            </button>
          </div>
        </div>
      )
    }

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '480px', width: '90%', background: 'var(--bg-card)', borderRadius: '24px', padding: '48px 40px', border: '1px solid var(--border-subtle)', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ fontSize: '3em', marginBottom: '16px' }}>🧠</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '1.8em' }}>How well did you understand it?</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Your answer helps Bloom update your skill mastery.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
            {[
              { num: 1, label: 'Lost', emoji: '😕' },
              { num: 2, label: 'Shaky', emoji: '😐' },
              { num: 3, label: 'Okay', emoji: '🙂' },
              { num: 4, label: 'Good', emoji: '😊' },
              { num: 5, label: 'Got it!', emoji: '🚀' }
            ].map(({ num, label, emoji }) => (
              <button
                key={num}
                onClick={() => setRating(num)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  padding: '12px 8px', borderRadius: '12px', border: '2px solid',
                  borderColor: rating === num ? 'var(--accent-purple)' : 'var(--border-subtle)',
                  background: rating === num ? 'rgba(168,85,247,0.15)' : 'var(--bg-secondary)',
                  cursor: 'pointer', minWidth: '60px', transition: 'all 0.15s'
                }}
              >
                <span style={{ fontSize: '1.5em' }}>{emoji}</span>
                <span style={{ fontSize: '0.7em', color: rating === num ? 'var(--accent-purple)' : 'var(--text-muted)', fontWeight: rating === num ? 700 : 400 }}>{label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmitFeedback}
            disabled={!rating}
            style={{ width: '100%', padding: '14px', background: rating ? 'var(--accent-purple)' : 'var(--border-subtle)', color: rating ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '12px', fontSize: '1em', fontWeight: 700, cursor: rating ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
          >
            Submit & See Your Progress
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={() => navigate('/')} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          &larr; Back to Dashboard
        </button>
        <button onClick={handleFinishLearning} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Finish Learning
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Left Column: Video */}
        <div style={{ flex: '2', minWidth: '600px' }}>
          <div id="yt-player" style={{ background: '#000', borderRadius: '8px', overflow: 'hidden' }}></div>
        </div>

        {/* Right Column: Interactive Sidebar */}
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
          
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #ddd', background: '#f8f9fa' }}>
            <button 
              onClick={() => setActiveTab('notes')}
              style={{ flex: 1, padding: '12px', border: 'none', background: activeTab === 'notes' ? '#fff' : 'transparent', fontWeight: activeTab === 'notes' ? 'bold' : 'normal', cursor: 'pointer', borderBottom: activeTab === 'notes' ? '2px solid #0056b3' : '2px solid transparent' }}
            >
              📝 Notes
            </button>
            <button 
              onClick={() => setActiveTab('coach')}
              style={{ flex: 1, padding: '12px', border: 'none', background: activeTab === 'coach' ? '#fff' : 'transparent', fontWeight: activeTab === 'coach' ? 'bold' : 'normal', cursor: 'pointer', borderBottom: activeTab === 'coach' ? '2px solid #28a745' : '2px solid transparent' }}
            >
              🤖 AI Coach
            </button>
          </div>

          <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', height: '400px' }}>
            {activeTab === 'notes' ? (
              <>
                <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: '8px', padding: '16px', overflowY: 'auto', marginBottom: '16px', background: '#f8f9fa' }}>
                  {savedNotes.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic', fontSize: '0.9em' }}>Take notes while you watch! They will be timestamped.</p>
                  ) : (
                    savedNotes.map((note, idx) => (
                      <div key={idx} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #eee' }}>
                        <span style={{ fontWeight: 'bold', color: '#0056b3', marginRight: '8px' }}>[{note.time}]</span>
                        <span>{note.text}</span>
                      </div>
                    ))
                  )}
                </div>

                <textarea 
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="Type your note here..."
                  style={{ width: '100%', height: '80px', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '8px', boxSizing: 'border-box' }}
                />
                <button 
                  onClick={handleSaveNote}
                  style={{ padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Save Note
                </button>
              </>
            ) : (
              <>
                {/* AI Coach Chat Area */}
                <div ref={chatScrollRef} style={{ flex: 1, border: '1px solid #ccc', borderRadius: '8px', padding: '16px', overflowY: 'auto', marginBottom: '16px', background: '#f8f9fa', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {chatMessages.length === 0 && (
                    <p style={{ color: '#666', fontStyle: 'italic', fontSize: '0.9em', textAlign: 'center', marginTop: '40px' }}>
                      Ask me anything about this video or your learning path! 🌸
                    </p>
                  )}
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} style={{ 
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      background: msg.role === 'user' ? '#0056b3' : '#e5e5e5',
                      color: msg.role === 'user' ? 'white' : 'black',
                      padding: '10px 14px',
                      borderRadius: '16px',
                      maxWidth: '85%',
                      lineHeight: '1.4'
                    }}>
                      {msg.content}
                    </div>
                  ))}
                  {isChatLoading && (
                    <div style={{ alignSelf: 'flex-start', background: '#e5e5e5', padding: '10px 14px', borderRadius: '16px', color: '#666' }}>
                      Typing...
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder="Ask the coach..."
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                  <button 
                    onClick={handleSendChat}
                    disabled={isChatLoading || !chatInput.trim()}
                    style={{ padding: '0 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: (isChatLoading || !chatInput.trim()) ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
