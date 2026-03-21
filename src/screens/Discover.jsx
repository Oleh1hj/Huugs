import { useState, useEffect, useCallback, useRef } from 'react'
import { useSpring, animated } from 'react-spring'
import { useDrag } from '@use-gesture/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const SWIPE_THRESHOLD = 100

export default function Discover() {
  const { session } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [matchedProfile, setMatchedProfile] = useState(null)
  const flyingRef = useRef(false)

  const [{ x, y, rotate }, api] = useSpring(() => ({
    x: 0, y: 0, rotate: 0,
    config: { friction: 50, tension: 400 },
  }))

  useEffect(() => { if (session) loadProfiles() }, [session])

  const loadProfiles = async () => {
    setLoading(true)
    setCurrentIdx(0)
    flyingRef.current = false
    api.set({ x: 0, y: 0, rotate: 0 })
    const uid = session.user.id
    const { data: swiped } = await supabase.from('swipes').select('swiped_id').eq('swiper_id', uid)
    const swipedIds = (swiped || []).map(s => s.swiped_id)
    let q = supabase.from('profiles').select('*').neq('id', uid).limit(30)
    if (swipedIds.length > 0) q = q.not('id', 'in', `(${swipedIds.join(',')})`)
    const { data } = await q
    setProfiles(data || [])
    setLoading(false)
  }

  const flyOut = useCallback((dir, profilesSnap, idxSnap) => {
    if (flyingRef.current) return
    flyingRef.current = true
    const capturedProfile = profilesSnap[idxSnap]
    const uid = session?.user?.id
    api.start({
      x: dir === 'right' ? 800 : dir === 'super' ? 0 : -800,
      y: dir === 'super' ? -800 : 0,
      rotate: dir === 'right' ? 25 : dir === 'super' ? 0 : -25,
      config: { friction: 20, tension: 200 },
      onRest: async () => {
        flyingRef.current = false
        api.set({ x: 0, y: 0, rotate: 0 })
        setCurrentIdx(i => i + 1)
        if (!uid || !capturedProfile) return
        await supabase.from('swipes').insert({ swiper_id: uid, swiped_id: capturedProfile.id, direction: dir })
        if (dir !== 'left') {
          const { data } = await supabase.from('swipes').select('id')
            .eq('swiper_id', capturedProfile.id).eq('swiped_id', uid)
            .in('direction', ['right', 'super']).maybeSingle()
          if (data) {
            const ids = [uid, capturedProfile.id].sort()
            await supabase.from('matches').upsert({ user1_id: ids[0], user2_id: ids[1] }, { onConflict: 'user1_id,user2_id' })
            setMatchedProfile(capturedProfile)
          }
        }
      },
    })
  }, [session, api])

  const bind = useDrag(({ active, movement: [mx], velocity: [vx] }) => {
    if (flyingRef.current) return
    const trigger = !active && (Math.abs(mx) > SWIPE_THRESHOLD || Math.abs(vx) > 0.5)
    if (trigger) {
      flyOut(mx > 0 ? 'right' : 'left', profiles, currentIdx)
    } else {
      api.start({ x: active ? mx : 0, y: 0, rotate: active ? mx / 12 : 0, immediate: active })
    }
  }, { filterTaps: true })

  const likeOpacity = x.to(v => Math.max(0, Math.min(1, v / 80)))
  const nopeOpacity = x.to(v => Math.max(0, Math.min(1, -v / 80)))
  const current = profiles[currentIdx]
  const next = profiles[currentIdx + 1]
  const third = profiles[currentIdx + 2]

  return (
    <div className="screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 8px', flexShrink: 0 }}>
        <h1 style={{ fontSize: 26, fontFamily: 'Lora, serif', color: 'var(--terracotta)' }}>Huugs</h1>
        <button onClick={loadProfiles} style={{ background: 'none', color: 'var(--text-soft)', padding: 8 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', padding: '8px 20px 0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--terra-soft)', borderTopColor: 'var(--terracotta)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : !current ? (
          <EmptyState onRefresh={loadProfiles} />
        ) : (
          <>
            {third && (
              <div style={{ position: 'absolute', inset: '0 20px', zIndex: 1, transform: 'translateY(16px) scale(0.92)', transformOrigin: 'bottom center' }}>
                <ProfileCard profile={third} />
              </div>
            )}
            {next && (
              <div style={{ position: 'absolute', inset: '0 20px', zIndex: 2, transform: 'translateY(8px) scale(0.96)', transformOrigin: 'bottom center' }}>
                <ProfileCard profile={next} />
              </div>
            )}
            <animated.div
              {...bind()}
              style={{ position: 'absolute', inset: '0 20px', zIndex: 10, x, y, rotate, touchAction: 'none', willChange: 'transform', cursor: 'grab' }}
            >
              <ProfileCard profile={current} likeOpacity={likeOpacity} nopeOpacity={nopeOpacity} />
            </animated.div>
          </>
        )}
      </div>

      {current && !loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, padding: '16px 20px 24px', flexShrink: 0 }}>
          <ActionBtn type="dislike" onClick={() => flyOut('left', profiles, currentIdx)} />
          <ActionBtn type="super"   onClick={() => flyOut('super', profiles, currentIdx)} />
          <ActionBtn type="like"    onClick={() => flyOut('right', profiles, currentIdx)} />
        </div>
      )}

      {matchedProfile && <MatchOverlay profile={matchedProfile} onClose={() => setMatchedProfile(null)} />}
    </div>
  )
}

function ProfileCard({ profile, likeOpacity, nopeOpacity }) {
  const photo = profile.photos?.[0] || profile.avatar_url
  return (
    <div style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--cream-card)', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
      {photo
        ? <img src={photo} alt={profile.name} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
        : <AvatarPlaceholder name={profile.name} />
      }
      {likeOpacity && (
        <animated.div style={{ position: 'absolute', top: 36, left: 24, border: '3px solid #5CB85C', borderRadius: 8, padding: '4px 14px', color: '#5CB85C', fontSize: 26, fontWeight: 800, letterSpacing: 2, fontFamily: 'Lora, serif', transform: 'rotate(-15deg)', opacity: likeOpacity }}>
          LIKE
        </animated.div>
      )}
      {nopeOpacity && (
        <animated.div style={{ position: 'absolute', top: 36, right: 24, border: '3px solid #E05252', borderRadius: 8, padding: '4px 14px', color: '#E05252', fontSize: 26, fontWeight: 800, letterSpacing: 2, fontFamily: 'Lora, serif', transform: 'rotate(15deg)', opacity: nopeOpacity }}>
          NOPE
        </animated.div>
      )}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(30,18,10,0.88) 0%, rgba(30,18,10,0.35) 55%, transparent 100%)', padding: '56px 22px 24px', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <h2 style={{ color: '#fff', fontSize: 24, fontFamily: 'Lora, serif', fontWeight: 700 }}>{profile.name}</h2>
          {profile.age && <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 20 }}>{profile.age}</span>}
        </div>
        {profile.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {profile.location}
          </div>
        )}
        {profile.bio && (
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.45 }}>
            {profile.bio.length > 90 ? profile.bio.slice(0, 90) + '…' : profile.bio}
          </p>
        )}
      </div>
    </div>
  )
}

function AvatarPlaceholder({ name }) {
  const palette = ['#C4714A','#D98B63','#A55C38','#8B7355','#7A8E6B']
  const bg = palette[(name?.charCodeAt(0) || 0) % palette.length]
  return (
    <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${bg}18 0%, ${bg}38 100%)`, backgroundColor: 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 120, height: 120, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, color: '#fff', fontFamily: 'Lora, serif' }}>
        {name?.[0]?.toUpperCase() || '?'}
      </div>
    </div>
  )
}

function ActionBtn({ type, onClick }) {
  const configs = {
    dislike: { size: 60, shadow: 'rgba(224,82,82,0.2)',   icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E05252" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> },
    super:   { size: 52, shadow: 'rgba(96,130,200,0.2)',  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="#6082C8"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg> },
    like:    { size: 60, shadow: 'rgba(92,184,92,0.2)',   icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="#5CB85C"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
  }
  const { size, shadow, icon } = configs[type]
  return (
    <button onClick={onClick} style={{ width: size, height: size, borderRadius: '50%', background: 'var(--white)', boxShadow: `0 4px 16px ${shadow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s, box-shadow 0.15s' }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.9)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {icon}
    </button>
  )
}

function MatchOverlay({ profile, onClose }) {
  const photo = profile.photos?.[0] || profile.avatar_url
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'linear-gradient(135deg, #C4714A 0%, #D98B63 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, animation: 'fadeIn 0.35s ease' }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontFamily: 'Lora, serif', fontSize: 34, color: '#fff', marginBottom: 8, textAlign: 'center' }}>It's a Huug!</h2>
      <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, marginBottom: 32, textAlign: 'center', lineHeight: 1.5 }}>
        You and {profile.name} liked each other!
      </p>
      {photo && (
        <img src={photo} alt={profile.name} style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.45)', marginBottom: 32 }} />
      )}
      <button onClick={onClose} style={{ background: '#fff', color: 'var(--terracotta)', padding: '14px 40px', borderRadius: 'var(--radius-md)', fontSize: 16, fontWeight: 700, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
        Keep Swiping
      </button>
    </div>
  )
}

function EmptyState({ onRefresh }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--terra-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="36" height="36" viewBox="0 0 48 48" fill="none"><path d="M14 20c0-4.418 3.582-8 8-8s8 3.582 8 8c0 2.21-.896 4.21-2.343 5.657L24 29.314l-3.657-3.657A7.963 7.963 0 0114 20z" fill="var(--terracotta)"/></svg>
      </div>
      <h3 style={{ fontFamily: 'Lora, serif', fontSize: 22, color: 'var(--text-dark)' }}>You've seen everyone!</h3>
      <p style={{ color: 'var(--text-soft)', textAlign: 'center', fontSize: 14, lineHeight: 1.55 }}>Check back later for new people near you.</p>
      <button onClick={onRefresh} className="btn-primary" style={{ maxWidth: 200 }}>Refresh</button>
    </div>
  )
}
