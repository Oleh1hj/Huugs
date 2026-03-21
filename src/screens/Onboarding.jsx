import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const GENDERS     = ['Man', 'Woman', 'Non-binary', 'Prefer not to say']
const LOOKING_FOR = ['Relationship', 'Casual', 'Friends', 'Not sure yet']

export default function Onboarding() {
  const { session, profile, fetchProfile, completeOnboarding } = useAuth()
  const [step, setStep]         = useState(0)
  const [photoFile, setPhotoFile] = useState(null)
  const [preview, setPreview]   = useState(null)
  const [form, setForm]         = useState({
    name:        profile?.name || '',
    age:         '',
    bio:         '',
    gender:      '',
    looking_for: '',
    location:    '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const fileRef = useRef(null)

  const setField = key => e => setForm(f => ({ ...f, [key]: e.target.value }))
  const toggle   = (key, val) => setForm(f => ({ ...f, [key]: f[key] === val ? '' : val }))

  const handleFileChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const goNext = () => { setError(''); setStep(s => s + 1) }

  const handleAboutNext = () => {
    if (!form.name.trim()) { setError('Please enter your name'); return }
    goNext()
  }

  const handleFinish = async () => {
    setSaving(true)
    setError('')

    let avatarUrl = profile?.avatar_url || null

    // Upload photo if one was selected
    if (photoFile) {
      const ext  = photoFile.name.split('.').pop() || 'jpg'
      const path = `${session.user.id}/avatar.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, photoFile, { upsert: true, contentType: photoFile.type })
      if (upErr) {
        setError('Photo upload failed — ' + upErr.message)
        setSaving(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      avatarUrl = publicUrl
    }

    const { error: saveErr } = await supabase.from('profiles').upsert({
      id:          session.user.id,
      email:       session.user.email,
      name:        form.name.trim() || profile?.name || 'User',
      age:         form.age ? parseInt(form.age, 10) : null,
      bio:         form.bio.trim(),
      gender:      form.gender,
      looking_for: form.looking_for,
      location:    form.location.trim(),
      avatar_url:  avatarUrl,
    })

    if (saveErr) { setError(saveErr.message); setSaving(false); return }

    await fetchProfile(session.user.id)
    completeOnboarding()
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--cream)', overflow: 'hidden' }}>
      {/* Background blob */}
      <div style={{ position: 'fixed', top: -80, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,113,74,0.16) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Step bar */}
      <div style={{ display: 'flex', gap: 6, padding: '20px 28px 0' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? 'var(--terracotta)' : 'var(--cream-dark)', transition: 'background 0.35s' }} />
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative', zIndex: 1 }}>
        {step === 0 && (
          <Step0
            preview={preview}
            fileRef={fileRef}
            onFileChange={handleFileChange}
            onNext={goNext}
          />
        )}
        {step === 1 && (
          <Step1
            form={form}
            setField={setField}
            error={error}
            onNext={handleAboutNext}
          />
        )}
        {step === 2 && (
          <Step2
            form={form}
            setField={setField}
            toggle={toggle}
            error={error}
            saving={saving}
            onFinish={handleFinish}
          />
        )}
      </div>
    </div>
  )
}

/* ─── Step 0: Photo ─────────────────────────────────────────── */
function Step0({ preview, fileRef, onFileChange, onNext }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 28px 48px', gap: 28, textAlign: 'center' }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--terracotta)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Step 1 of 3</p>
        <h2 style={{ fontFamily: 'Lora, serif', fontSize: 28, color: 'var(--text-dark)', marginBottom: 10 }}>Add your photo</h2>
        <p style={{ color: 'var(--text-soft)', fontSize: 15, lineHeight: 1.55 }}>
          Profiles with a photo get 3× more matches.
        </p>
      </div>

      {/* Photo circle */}
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          width: 168, height: 168, borderRadius: '50%',
          background: preview ? 'transparent' : 'var(--terra-soft)',
          border: preview ? '4px solid var(--terracotta)' : '3px dashed var(--terra-light)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', overflow: 'hidden',
          boxShadow: preview ? 'var(--shadow-lg)' : 'none',
          transition: 'box-shadow 0.2s, border 0.2s',
          flexShrink: 0,
        }}
      >
        {preview ? (
          <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <>
            <CameraIcon />
            <span style={{ fontSize: 13, color: 'var(--terracotta)', fontWeight: 700, marginTop: 10 }}>Tap to upload</span>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn-primary" onClick={onNext}>
          {preview ? 'Continue' : 'Skip for now'}
        </button>
        {preview && (
          <button
            onClick={() => fileRef.current?.click()}
            style={{ background: 'none', color: 'var(--text-soft)', fontSize: 14, padding: '6px 0' }}
          >
            Change photo
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Step 1: About ─────────────────────────────────────────── */
function Step1({ form, setField, error, onNext }) {
  return (
    <div style={{ padding: '36px 24px 48px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--terracotta)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Step 2 of 3</p>
        <h2 style={{ fontFamily: 'Lora, serif', fontSize: 28, color: 'var(--text-dark)', marginBottom: 8 }}>About you</h2>
        <p style={{ color: 'var(--text-soft)', fontSize: 15 }}>Tell people who you are.</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div>
        <label className="input-label">Name *</label>
        <input
          className="input-field"
          value={form.name}
          onChange={setField('name')}
          placeholder="What should we call you?"
          autoFocus
        />
      </div>

      <div>
        <label className="input-label">Age</label>
        <input
          className="input-field"
          value={form.age}
          onChange={setField('age')}
          type="number"
          placeholder="Your age"
          min="18"
          max="120"
        />
      </div>

      <div>
        <label className="input-label">Bio</label>
        <textarea
          className="input-field"
          value={form.bio}
          onChange={setField('bio')}
          placeholder="A few words about yourself…"
          rows={4}
          style={{ resize: 'none', lineHeight: 1.55 }}
        />
      </div>

      <button className="btn-primary" onClick={onNext} style={{ marginTop: 4 }}>
        Continue
      </button>
    </div>
  )
}

/* ─── Step 2: Preferences ───────────────────────────────────── */
function Step2({ form, setField, toggle, error, saving, onFinish }) {
  return (
    <div style={{ padding: '36px 24px 48px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--terracotta)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Step 3 of 3</p>
        <h2 style={{ fontFamily: 'Lora, serif', fontSize: 28, color: 'var(--text-dark)', marginBottom: 8 }}>Your preferences</h2>
        <p style={{ color: 'var(--text-soft)', fontSize: 15 }}>Help us find the right people for you.</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div>
        <label className="input-label">City</label>
        <input
          className="input-field"
          value={form.location}
          onChange={setField('location')}
          placeholder="e.g. London, UK"
        />
      </div>

      <div>
        <label className="input-label">I am</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
          {GENDERS.map(g => (
            <Chip key={g} label={g} active={form.gender === g} onClick={() => toggle('gender', g)} />
          ))}
        </div>
      </div>

      <div>
        <label className="input-label">Looking for</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
          {LOOKING_FOR.map(lf => (
            <Chip key={lf} label={lf} active={form.looking_for === lf} onClick={() => toggle('looking_for', lf)} />
          ))}
        </div>
      </div>

      <button
        className="btn-primary"
        onClick={onFinish}
        disabled={saving}
        style={{ marginTop: 8 }}
      >
        {saving ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SpinnerIcon /> Setting up your profile…
          </span>
        ) : (
          'Get Started'
        )}
      </button>
    </div>
  )
}

/* ─── Shared components ─────────────────────────────────────── */
function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '9px 18px', borderRadius: 20, fontSize: 14, fontWeight: 600,
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

function CameraIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--terracotta)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  )
}
