import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const GENDERS     = ['Man', 'Woman', 'Non-binary', 'Prefer not to say']
const LOOKING_FOR = ['Relationship', 'Casual', 'Friends', 'Not sure yet']

const EMPTY = { name: '', age: '', bio: '', gender: '', looking_for: '', location: '' }

export default function Profile() {
  const { profile, profileLoading, session, signOut, fetchProfile } = useAuth()
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')

  // Seed form whenever profile loads or changes
  useEffect(() => {
    if (profile) {
      setForm({
        name:        profile.name        ?? '',
        age:         profile.age != null  ? String(profile.age) : '',
        bio:         profile.bio         ?? '',
        gender:      profile.gender      ?? '',
        looking_for: profile.looking_for ?? '',
        location:    profile.location    ?? '',
      })
    }
  }, [profile])

  const set  = key => e  => { setForm(f => ({ ...f, [key]: e.target.value })); setSaved(false) }
  const pick = (key, val) => { setForm(f => ({ ...f, [key]: f[key] === val ? '' : val })); setSaved(false) }

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setError(''); setSaving(true)
    const { error: err } = await supabase.from('profiles').upsert({
      id:          session.user.id,
      email:       session.user.email,
      name:        form.name.trim(),
      age:         form.age ? parseInt(form.age, 10) : null,
      bio:         form.bio.trim(),
      gender:      form.gender,
      looking_for: form.looking_for,
      location:    form.location.trim(),
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    await fetchProfile(session.user.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const photo = profile?.photos?.[0] || profile?.avatar_url
  const initials = form.name?.[0]?.toUpperCase() || '?'

  if (profileLoading) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Spinner />
      </div>
    )
  }

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
        <h1 style={{ fontSize: 22, fontFamily: 'Lora, serif', color: 'var(--text-dark)' }}>My Profile</h1>
      </div>

      <div className="screen-scrollable" style={{ flex: 1 }}>
        <div style={{ padding: '20px 20px 48px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Avatar */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 4 }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', background: 'var(--terra-soft)', border: '3px solid var(--cream-card)', boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {photo
                ? <img src={photo} alt={form.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 38, fontFamily: 'Lora, serif', color: 'var(--terracotta)' }}>{initials}</span>
              }
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}

          {/* Name */}
          <div>
            <label className="input-label">Name</label>
            <input
              className="input-field"
              value={form.name}
              onChange={set('name')}
              placeholder="Your name"
            />
          </div>

          {/* Age */}
          <div>
            <label className="input-label">Age</label>
            <input
              className="input-field"
              value={form.age}
              onChange={set('age')}
              type="number"
              placeholder="Your age"
              min="18"
              max="120"
            />
          </div>

          {/* City */}
          <div>
            <label className="input-label">City</label>
            <input
              className="input-field"
              value={form.location}
              onChange={set('location')}
              placeholder="e.g. London, UK"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="input-label">Bio</label>
            <textarea
              className="input-field"
              value={form.bio}
              onChange={set('bio')}
              placeholder="Tell people a little about yourself…"
              rows={4}
              style={{ resize: 'none', lineHeight: 1.5 }}
            />
          </div>

          {/* Gender */}
          <div>
            <label className="input-label">Gender</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
              {GENDERS.map(opt => (
                <Chip
                  key={opt}
                  label={opt}
                  active={form.gender === opt}
                  onClick={() => pick('gender', opt)}
                />
              ))}
            </div>
          </div>

          {/* Looking for */}
          <div>
            <label className="input-label">Looking For</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
              {LOOKING_FOR.map(opt => (
                <Chip
                  key={opt}
                  label={opt}
                  active={form.looking_for === opt}
                  onClick={() => pick('looking_for', opt)}
                />
              ))}
            </div>
          </div>

          {/* Save */}
          <button
            onClick={save}
            disabled={saving}
            className="btn-primary"
            style={saved ? { background: '#5a9e6f', boxShadow: '0 4px 16px rgba(90,158,111,0.35)' } : {}}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Profile'}
          </button>

          {/* Sign out */}
          <button
            onClick={signOut}
            style={{ width: '100%', padding: '13px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--cream-dark)', background: 'none', color: 'var(--text-soft)', fontSize: 15, fontWeight: 600 }}
          >
            Sign Out
          </button>

        </div>
      </div>
    </div>
  )
}

function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: 20,
        fontSize: 14,
        fontWeight: 600,
        border: '1.5px solid',
        borderColor: active ? 'var(--terracotta)' : 'var(--cream-dark)',
        background:  active ? 'var(--terra-soft)' : 'var(--cream-card)',
        color:       active ? 'var(--terracotta)' : 'var(--text-mid)',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

function Spinner() {
  return (
    <div style={{ width: 36, height: 36, border: '3px solid var(--terra-soft)', borderTopColor: 'var(--terracotta)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  )
}
