import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Chats() {
  const { session } = useAuth()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => { if (session) loadMatches() }, [session])

  const loadMatches = async () => {
    setLoading(true)
    const uid = session.user.id
    const { data: matchRows } = await supabase
      .from('matches').select('*')
      .or(`user1_id.eq.${uid},user2_id.eq.${uid}`)
      .order('created_at', { ascending: false })

    if (!matchRows?.length) { setMatches([]); setLoading(false); return }

    const otherIds = matchRows.map(m => m.user1_id === uid ? m.user2_id : m.user1_id)
    const { data: profs } = await supabase.from('profiles').select('*').in('id', otherIds)
    const matchIds = matchRows.map(m => m.id)
    const { data: msgs } = await supabase.from('messages').select('*')
      .in('match_id', matchIds).order('created_at', { ascending: false })

    const lastByMatch = {}
    msgs?.forEach(m => { if (!lastByMatch[m.match_id]) lastByMatch[m.match_id] = m })

    setMatches(matchRows.map(m => {
      const otherId = m.user1_id === uid ? m.user2_id : m.user1_id
      return { match: m, profile: profs?.find(p => p.id === otherId), lastMsg: lastByMatch[m.id] || null }
    }))
    setLoading(false)
  }

  if (selected) {
    return <ChatThread item={selected} onBack={() => { setSelected(null); loadMatches() }} />
  }

  return (
    <div className="screen">
      <div style={{ padding: '16px 20px 12px', flexShrink: 0 }}>
        <h1 style={{ fontSize: 26, fontFamily: 'Lora, serif', color: 'var(--text-dark)' }}>Chats</h1>
      </div>
      <div className="screen-scrollable" style={{ flex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--terra-soft)', borderTopColor: 'var(--terracotta)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : matches.length === 0 ? (
          <EmptyChats />
        ) : (
          <div>
            {matches.map(item => (
              <MatchRow key={item.match.id} item={item} onSelect={() => setSelected(item)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MatchRow({ item, onSelect }) {
  const { profile, lastMsg } = item
  if (!profile) return null
  const photo = profile.photos?.[0] || profile.avatar_url
  return (
    <button onClick={onSelect} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', background: 'none', textAlign: 'left', borderBottom: '1px solid var(--cream-dark)' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--terra-soft)' }}>
        {photo
          ? <img src={photo} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontFamily: 'Lora, serif', color: 'var(--terracotta)' }}>{profile.name?.[0]?.toUpperCase()}</div>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-dark)' }}>{profile.name}</span>
          <span style={{ fontSize: 12, color: 'var(--text-soft)', flexShrink: 0, marginLeft: 8 }}>{lastMsg ? formatTime(lastMsg.created_at) : ''}</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lastMsg ? lastMsg.content : 'Say hi! 👋'}
        </p>
      </div>
    </button>
  )
}

function ChatThread({ item, onBack }) {
  const { session } = useAuth()
  const { match, profile } = item
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const photo = profile?.photos?.[0] || profile?.avatar_url

  useEffect(() => {
    loadMessages()
    const channel = supabase.channel(`match-${match.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${match.id}` },
        ({ new: msg }) => setMessages(prev => [...prev, msg]))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [match.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadMessages = async () => {
    const { data } = await supabase.from('messages').select('*')
      .eq('match_id', match.id).order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const send = async () => {
    if (!text.trim() || sending) return
    const content = text.trim()
    setText('')
    setSending(true)
    await supabase.from('messages').insert({ match_id: match.id, sender_id: session.user.id, content })
    setSending(false)
  }

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--cream-dark)', flexShrink: 0, background: 'var(--cream-card)' }}>
        <button onClick={onBack} style={{ background: 'none', padding: 6, color: 'var(--text-mid)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', background: 'var(--terra-soft)', flexShrink: 0 }}>
          {photo
            ? <img src={photo} alt={profile?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontFamily: 'Lora, serif', color: 'var(--terracotta)' }}>{profile?.name?.[0]?.toUpperCase()}</div>
          }
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-dark)' }}>{profile?.name}</p>
          {profile?.age && <p style={{ fontSize: 12, color: 'var(--text-soft)' }}>{profile.age} years old</p>}
        </div>
      </div>

      <div className="screen-scrollable" style={{ flex: 1, padding: '16px 16px 8px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-soft)', fontSize: 14 }}>
            You matched! Start the conversation ✨
          </div>
        )}
        {messages.map(msg => (
          <Bubble key={msg.id} msg={msg} isMe={msg.sender_id === session?.user?.id} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 10, padding: '12px 16px', borderTop: '1px solid var(--cream-dark)', background: 'var(--cream-card)', flexShrink: 0 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Type a message…"
          className="input-field"
          style={{ flex: 1 }}
        />
        <button onClick={send} disabled={!text.trim() || sending} style={{ width: 44, height: 44, borderRadius: '50%', background: text.trim() ? 'var(--terracotta)' : 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  )
}

function Bubble({ msg, isMe }) {
  return (
    <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
      <div style={{ maxWidth: '72%', padding: '10px 14px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isMe ? 'var(--terracotta)' : 'var(--cream-card)', color: isMe ? '#fff' : 'var(--text-dark)', fontSize: 14, lineHeight: 1.45, boxShadow: 'var(--shadow-sm)' }}>
        {msg.content}
      </div>
    </div>
  )
}

function EmptyChats() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 32px', gap: 16 }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--terra-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--terracotta)" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      <h3 style={{ fontFamily: 'Lora, serif', fontSize: 20, color: 'var(--text-dark)' }}>No matches yet</h3>
      <p style={{ color: 'var(--text-soft)', textAlign: 'center', fontSize: 14, lineHeight: 1.55 }}>
        Start swiping to find your huug! Matches appear here.
      </p>
    </div>
  )
}

function formatTime(ts) {
  const d = new Date(ts), diff = Date.now() - d
  if (diff < 60000) return 'now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
