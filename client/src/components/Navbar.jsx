import { useNavigate } from 'react-router-dom'

function getMe() {
  try {
    const token = localStorage.getItem('hamachlava_admin_token')
    if (!token) return {}
    return JSON.parse(atob(token.split('.')[1]))
  } catch { return {} }
}

export default function Navbar({ title = 'המחלבה' }) {
  const navigate = useNavigate()
  const token = localStorage.getItem('hamachlava_admin_token')
  const me = getMe()

  function handleLogout() {
    localStorage.removeItem('hamachlava_admin_token')
    navigate('/admin/login')
  }

  return (
    <nav style={{
      background: 'var(--primary)',
      color: '#fff',
      padding: '0 20px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div
        onClick={() => navigate('/admin')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
      >
        <span style={{ fontSize: '1.5rem' }}>🏺</span>
        <span style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '0.5px' }}>{title}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {token && (
          <>
            <button
              onClick={() => navigate('/admin')}
              style={navBtn()}
            >
              לוח בקרה
            </button>

            {me.role === 'superadmin' && (
              <button
                onClick={() => navigate('/admin/users')}
                style={navBtn()}
              >
                👥 משתמשים
              </button>
            )}

            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 10px', fontSize: '0.85rem'
            }}>
              <span>{me.username}</span>
              {me.role === 'superadmin' && <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>⭐</span>}
            </div>

            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(220,38,38,0.8)',
                color: '#fff', border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 14px', fontSize: '0.9rem', cursor: 'pointer'
              }}
            >
              יציאה
            </button>
          </>
        )}
      </div>
    </nav>
  )
}

function navBtn() {
  return {
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 'var(--radius-sm)',
    padding: '6px 14px',
    fontSize: '0.88rem',
    cursor: 'pointer'
  }
}
