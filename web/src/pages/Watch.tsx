import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export default function Watch() {
  const { id } = useParams<{ id: string }>() // this is actually the youtube_id passed via route
  const navigate = useNavigate()
  const { session } = useAuth()
  
  const [player, setPlayer] = useState<any>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [savedNotes, setSavedNotes] = useState<{ time: string; text: string }[]>([])
  const [currentNote, setCurrentNote] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [rating, setRating] = useState<number | null>(null)
  const sessionStartTime = useRef<number>(Date.now())

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
        videoId: id,
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
      if (!session) return
      try {
        const res = await fetch('/api/v1/sessions/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ resource_id: id }) // Note: passing youtube_id for now as mock
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
        // Use keepalive to ensure request goes through on unmount/navigate
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
    if (!rating) return
    
    // Submit feedback
    try {
      await fetch(`/api/v1/feedback/session/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          rating: rating,
          notes: savedNotes
        })
      })
    } catch (e) {
      console.error(e)
    } finally {
      // Force end session logic to run and go to dashboard
      navigate('/')
    }
  }

  if (showFeedback) {
    return (
      <div style={{ padding: '40px', maxWidth: '600px', margin: '100px auto', background: '#f8f9fa', borderRadius: '12px', textAlign: 'center', fontFamily: 'sans-serif', border: '1px solid #ccc' }}>
        <h2>Session Complete! 🎉</h2>
        <p>How well did you understand the material?</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '20px 0' }}>
          {[1, 2, 3, 4, 5].map(num => (
            <button 
              key={num}
              onClick={() => setRating(num)}
              style={{
                width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                background: rating === num ? '#0056b3' : '#e5e5e5',
                color: rating === num ? 'white' : 'black',
                cursor: 'pointer', fontSize: '1.2em'
              }}
            >
              {num}
            </button>
          ))}
        </div>
        <button 
          onClick={handleSubmitFeedback}
          disabled={!rating}
          style={{ padding: '12px 24px', background: rating ? '#28a745' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', cursor: rating ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
        >
          Submit & Return to Dashboard
        </button>
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

        {/* Right Column: Notes */}
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column' }}>
          <h3>Learning Notes</h3>
          
          <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: '8px', padding: '16px', overflowY: 'auto', maxHeight: '350px', marginBottom: '16px', background: '#f8f9fa' }}>
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
        </div>
      </div>
    </div>
  )
}
