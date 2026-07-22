import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

function App() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (chrome && chrome.storage) {
      chrome.storage.local.get(['sb_session'], (result) => {
        if (result.sb_session) setSession(result.sb_session);
      });
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        setSession(data.session);
        if (chrome && chrome.storage) {
          chrome.storage.local.set({ sb_session: data.session });
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    if (chrome && chrome.storage) {
      chrome.storage.local.remove(['sb_session']);
    }
  };

  if (session) {
    return (
      <div style={{ padding: '24px', background: '#0a0a0f', color: '#f0f0f5', fontFamily: 'Inter', height: '100%', boxSizing: 'border-box' }}>
        <h2 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🌸 Bloom Guard
        </h2>
        <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '12px', borderRadius: '8px', marginBottom: '24px' }}>
          Connected! Guard Mode is active on YouTube.
        </div>
        <button 
          onClick={handleLogout}
          style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#a0a0b8', borderRadius: '6px', cursor: 'pointer' }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#0a0a0f', color: '#f0f0f5', fontFamily: 'Inter', height: '100%', boxSizing: 'border-box' }}>
      <h2 style={{ margin: '0 0 8px 0' }}>🌸 Bloom Guard</h2>
      <p style={{ color: '#a0a0b8', fontSize: '13px', marginBottom: '24px' }}>Log in to sync your learning intent and block distractions on YouTube.</p>
      
      {error && <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#141420', color: 'white' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#141420', color: 'white' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '12px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </div>
  );
}

export default App;
