import { useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null)

  const fetchProfile = async (accessToken: string) => {
    try {
      const res = await fetch('/api/v1/profile/', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setIsOnboarded(!!data.learning_profile)
      } else {
        setIsOnboarded(false)
      }
    } catch {
      setIsOnboarded(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.access_token) {
        fetchProfile(session.access_token).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.access_token) {
        fetchProfile(session.access_token).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = () => supabase.auth.signOut()

  return { session, user, loading, isOnboarded, signOut, refetchProfile: () => session?.access_token && fetchProfile(session.access_token) }
}
