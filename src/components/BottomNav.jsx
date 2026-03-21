import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/discover', label: 'Discover', icon: FlameIcon },
  { to: '/chats',    label: 'Chats',    icon: ChatIcon },
  { to: '/profile',  label: 'Me',       icon: ProfileIcon },
]

export default function BottomNav() {
  return (
    <nav style={styles.nav}>
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} style={({ isActive }) => ({
          ...styles.tab,
          ...(isActive ? styles.tabActive : {}),
        })}>
          {({ isActive }) => (
            <>
              <span style={styles.iconWrap}>
                <Icon active={isActive} />
                {isActive && <span style={styles.dot} />}
              </span>
              <span style={{ ...styles.label, ...(isActive ? styles.labelActive : {}) }}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

const styles = {
  nav: {
    height: 'var(--nav-h)',
    display: 'flex',
    alignItems: 'stretch',
    background: 'var(--cream-card)',
    borderTop: '1px solid var(--cream-dark)',
    boxShadow: '0 -4px 20px rgba(44,32,22,0.07)',
    flexShrink: 0,
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    color: 'var(--text-soft)',
    transition: 'color 0.2s',
    textDecoration: 'none',
    position: 'relative',
  },
  tabActive: {
    color: 'var(--terracotta)',
  },
  iconWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: 'var(--terracotta)',
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: 'var(--terracotta)',
  },
}

/* ---- Tab icons ---- */
function FlameIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'var(--terracotta)' : 'none'}
      stroke={active ? 'var(--terracotta)' : 'currentColor'} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>
    </svg>
  )
}

function ChatIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'var(--terracotta)' : 'none'}
      stroke={active ? 'var(--terracotta)' : 'currentColor'} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function ProfileIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'var(--terracotta)' : 'none'}
      stroke={active ? 'var(--terracotta)' : 'currentColor'} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}
