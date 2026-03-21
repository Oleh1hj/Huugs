import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Auth from './screens/Auth'
import Onboarding from './screens/Onboarding'
import Discover from './screens/Discover'
import Chats from './screens/Chats'
import Profile from './screens/Profile'
import BottomNav from './components/BottomNav'

function AppRoutes() {
  const { session, needsOnboarding } = useAuth()

  // Still loading session from Supabase
  if (session === undefined) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
      }}>
        <HuugsLogo size={56} />
        <p style={{ color: 'var(--text-soft)', fontSize: 14 }}>Loading…</p>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  if (needsOnboarding) {
    return <Onboarding />
  }

  return (
    <>
      <div className="screen-scrollable" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/discover" replace />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/discover" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </>
  )
}

function HuugsLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="24" fill="var(--terra-soft)" />
      <path
        d="M14 20c0-4.418 3.582-8 8-8s8 3.582 8 8c0 2.21-.896 4.21-2.343 5.657L24 29.314l-3.657-3.657A7.963 7.963 0 0114 20z"
        fill="var(--terracotta)"
      />
      <path
        d="M26 26c0-3.314 2.686-6 6-6s6 2.686 6 6c0 1.657-.672 3.157-1.757 4.243L32 34.486l-4.243-4.243A5.973 5.973 0 0126 26z"
        fill="var(--terra-light)"
        opacity="0.7"
      />
    </svg>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
