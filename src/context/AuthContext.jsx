import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const ONBOARDING_KEY = 'huugs_onboarding_uid'

export function AuthProvider({ children }) {
  const [session, setSession]               = useState(undefined) // undefined = loading
  const [profile, setProfile]               = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
        setNeedsOnboarding(localStorage.getItem(ONBOARDING_KEY) === session.user.id)
      } else {
        setProfileLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
        setNeedsOnboarding(localStorage.getItem(ONBOARDING_KEY) === session.user.id)
      } else {
        setProfile(null)
        setProfileLoading(false)
        setNeedsOnboarding(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    setProfileLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setProfileLoading(false)
  }

  async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
        email,
        created_at: new Date().toISOString(),
      })
      // Flag this user for onboarding — survives email-confirm redirect
      localStorage.setItem(ONBOARDING_KEY, data.user.id)
    }
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  function completeOnboarding() {
    localStorage.removeItem(ONBOARDING_KEY)
    setNeedsOnboarding(false)
  }

  return (
    <AuthContext.Provider value={{
      session, profile, profileLoading,
      needsOnboarding, completeOnboarding,
      signUp, signIn, signOut, fetchProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
