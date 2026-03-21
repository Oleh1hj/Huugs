import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const MODES = { LOGIN: 'login', REGISTER: 'register' }

export default function Auth() {
  const [mode, setMode] = useState(MODES.LOGIN)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { signIn, signUp } = useAuth()

  function switchMode(next) {
    setMode(next)
    setError('')
    setSuccess('')
    setEmail('')
    setPassword('')
    setName('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (mode === MODES.REGISTER && !name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      if (mode === MODES.LOGIN) {
        await signIn(email, password)
      } else {
        await signUp(email, password, name.trim())
        setSuccess('Check your email to confirm your account!')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      {/* Background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      {/* Scrollable inner */}
      <div style={styles.inner}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <HuugsIcon />
          <h1 style={styles.logoText}>Huugs</h1>
          <p style={styles.tagline}>Find your warmth.</p>
        </div>

        {/* Card */}
        <div style={styles.card}>
          {/* Tab switcher */}
          <div style={styles.tabs}>
            <button
              style={{ ...styles.tab, ...(mode === MODES.LOGIN ? styles.tabActive : {}) }}
              onClick={() => switchMode(MODES.LOGIN)}
              type="button"
            >
              Sign In
            </button>
            <button
              style={{ ...styles.tab, ...(mode === MODES.REGISTER ? styles.tabActive : {}) }}
              onClick={() => switchMode(MODES.REGISTER)}
              type="button"
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            {/* Name field (register only) */}
            {mode === MODES.REGISTER && (
              <div style={styles.fieldWrap}>
                <label className="input-label" htmlFor="name">Your Name</label>
                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}>
                    <PersonIcon />
                  </span>
                  <input
                    id="name"
                    className="input-field"
                    style={styles.inputWithIcon}
                    type="text"
                    placeholder="What should we call you?"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoComplete="given-name"
                    maxLength={50}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div style={styles.fieldWrap}>
              <label className="input-label" htmlFor="email">Email</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>
                  <EmailIcon />
                </span>
                <input
                  id="email"
                  className="input-field"
                  style={styles.inputWithIcon}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.fieldWrap}>
              <label className="input-label" htmlFor="password">Password</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>
                  <LockIcon />
                </span>
                <input
                  id="password"
                  className="input-field"
                  style={styles.inputWithIcon}
                  type="password"
                  placeholder={mode === MODES.REGISTER ? 'At least 6 characters' : 'Your password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === MODES.LOGIN ? 'current-password' : 'new-password'}
                />
              </div>
            </div>

            {/* Error / success messages */}
            {error && (
              <div className="error-msg" role="alert">
                {error}
              </div>
            )}
            {success && (
              <div style={styles.successMsg} role="status">
                <CheckCircleIcon />
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              className="btn-primary"
              type="submit"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading ? (
                <Spinner />
              ) : mode === MODES.LOGIN ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>

            {/* Forgot password (login only) */}
            {mode === MODES.LOGIN && (
              <button
                type="button"
                style={styles.forgotBtn}
                onClick={() => handleForgotPassword(email, setError, setSuccess)}
              >
                Forgot password?
              </button>
            )}
          </form>
        </div>

        {/* Switch mode link */}
        <p style={styles.switchText}>
          {mode === MODES.LOGIN ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            style={styles.switchLink}
            onClick={() => switchMode(mode === MODES.LOGIN ? MODES.REGISTER : MODES.LOGIN)}
          >
            {mode === MODES.LOGIN ? 'Join now' : 'Sign in'}
          </button>
        </p>

        {/* Footer */}
        <p style={styles.footer}>
          By continuing you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  )
}

async function handleForgotPassword(email, setError, setSuccess) {
  if (!email.trim()) {
    setError('Enter your email above, then tap "Forgot password?"')
    return
  }
  const { supabase } = await import('../lib/supabase')
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  })
  if (error) setError(error.message)
  else setSuccess('Password reset email sent!')
}

/* ---- Inline styles ---- */
const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    overflowX: 'hidden',
    background: 'var(--cream)',
    position: 'relative',
    WebkitOverflowScrolling: 'touch',
  },
  blob1: {
    position: 'fixed',
    top: -80,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(196,113,74,0.18) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  blob2: {
    position: 'fixed',
    bottom: 40,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(217,139,99,0.14) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  inner: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '48px 24px 36px',
    position: 'relative',
    zIndex: 1,
    gap: 24,
    minHeight: '100%',
  },
  logoWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 700,
    color: 'var(--terracotta)',
    letterSpacing: '-0.5px',
    lineHeight: 1,
    marginTop: 8,
  },
  tagline: {
    fontSize: 15,
    color: 'var(--text-soft)',
    fontStyle: 'italic',
    fontFamily: 'Lora, serif',
  },
  card: {
    width: '100%',
    background: 'var(--cream-card)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-lg)',
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  tabs: {
    display: 'flex',
    background: 'var(--cream-dark)',
    borderRadius: 'var(--radius-md)',
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    padding: '10px 8px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    background: 'transparent',
    color: 'var(--text-soft)',
    transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
    border: 'none',
  },
  tabActive: {
    background: 'var(--cream-card)',
    color: 'var(--terracotta)',
    boxShadow: 'var(--shadow-sm)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  fieldWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  inputWrap: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    color: 'var(--text-soft)',
    pointerEvents: 'none',
  },
  inputWithIcon: {
    paddingLeft: 42,
  },
  successMsg: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#EDF7F0',
    border: '1px solid #A8D5B5',
    color: '#2D7A4F',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 14px',
    fontSize: 14,
    fontWeight: 500,
  },
  forgotBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-soft)',
    fontSize: 13,
    fontWeight: 500,
    textAlign: 'center',
    padding: '2px 0',
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: 2,
  },
  switchText: {
    fontSize: 14,
    color: 'var(--text-mid)',
    textAlign: 'center',
  },
  switchLink: {
    background: 'none',
    border: 'none',
    color: 'var(--terracotta)',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
  },
  footer: {
    fontSize: 11,
    color: 'var(--text-soft)',
    textAlign: 'center',
    lineHeight: 1.5,
  },
}

/* ---- Inline SVG icons ---- */
function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
}

function Spinner() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  )
}

function HuugsIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="36" fill="var(--terra-soft)" />
      {/* Left heart lobe */}
      <path
        d="M20 31c0-6.627 5.373-12 12-12s12 5.373 12 12c0 3.314-1.343 6.314-3.515 8.485L36 43.97l-4.485-4.485A11.944 11.944 0 0120 31z"
        fill="var(--terracotta)"
      />
      {/* Right smaller lobe (overlap) */}
      <path
        d="M38 38c0-4.971 4.029-9 9-9s9 4.029 9 9c0 2.485-1.007 4.734-2.636 6.364L47 51l-7.364-7.636A8.958 8.958 0 0138 38z"
        fill="var(--terra-light)"
        opacity="0.72"
      />
    </svg>
  )
}
