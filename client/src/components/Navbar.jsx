import { useNavigate } from 'react-router-dom'

export default function Navbar({ title = 'המחלבה' }) {
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('hamachlava_admin_token')
    navigate('/admin/login')
  }

  const token = localStorage.getItem('hamachlava_admin_token')

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {token && (
          <>
            <button
              onClick={() => navigate('/admin')}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 14px',
                fontSize: '0.9rem'
              }}
            >
              לוח בקרה
            </button>
            <button
              onClick={handleLogout}
              style={{
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 14px',
                fontSize: '0.9rem'
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
