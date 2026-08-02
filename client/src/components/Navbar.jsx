import { useNavigate } from 'react-router-dom'

function getMe() {
  try {
    const token = localStorage.getItem('hamachlava_admin_token')
    if (!token) return {}
    return JSON.parse(atob(token.split('.')[1]))
  } catch { return {} }
}

export default function Navbar() {
  const navigate = useNavigate()
  const token = localStorage.getItem('hamachlava_admin_token')
  const me = getMe()

  function handleLogout() {
    localStorage.removeItem('hamachlava_admin_token')
    navigate('/admin/login')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@700;900&family=Heebo:wght@400;600&display=swap');
        .nav-btn {
          background: transparent;
          color: rgba(255,255,255,0.75);
          border: none;
          padding: 6px 13px;
          font-size: 0.85rem;
          font-family: 'Heebo', sans-serif;
          cursor: pointer;
          border-radius: 5px;
          transition: background 0.2s, color 0.2s;
        }
        .nav-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .nav-logout {
          background: transparent;
          color: rgba(255,255,255,0.65);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 5px;
          padding: 5px 13px;
          font-size: 0.82rem;
          font-family: 'Heebo', sans-serif;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .nav-logout:hover { background: rgba(255,255,255,0.12); color: #fff; }
      `}</style>

      <nav style={{
        background: '#131f2e',
        color: '#fff',
        padding: '0 24px',
        height: '96px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
      }}>

        {/* Logo */}
        <div
          onClick={() => navigate('/admin')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <div style={{
            background: '#fff',
            border: '2.5px solid #3b6fd4',
            borderRadius: '50%',
            width: '76px',
            height: '76px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 0 4px rgba(59,111,212,0.2)',
            flexShrink: 0
          }}>
            <span style={{
              fontSize: '0.85rem', fontWeight: 900, color: '#131f2e',
              lineHeight: 1.2, textAlign: 'center', letterSpacing: '0.3px',
              fontFamily: "'Frank Ruhl Libre', serif"
            }}>המחלבה</span>
            <div style={{
              width: '40px', height: '1px',
              background: 'linear-gradient(90deg, transparent, #3b6fd4, transparent)',
              margin: '2px 0'
            }} />
            <span style={{
              fontSize: '0.58rem', color: '#3b6fd4',
              letterSpacing: '1.5px', fontFamily: "'Heebo', sans-serif", fontWeight: 700
            }}>פאב קהילתי</span>
          </div>
          <span className="hide-mobile" style={{
            fontWeight: 700, fontSize: '1rem', color: '#fff',
            letterSpacing: '0.04em', fontFamily: "'Heebo', sans-serif"
          }}>
            המחלבה
          </span>
        </div>

        {/* Nav actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {token && (
            <>
              <button className="nav-btn" onClick={() => navigate('/admin')}>
                <span className="hide-mobile">ראשי</span>
                <span className="show-mobile-only">🏠</span>
              </button>

              <button className="nav-btn" onClick={() => navigate('/admin/reports/monthly')}>
                <span className="hide-mobile">חיובים חודשיים</span>
                <span className="show-mobile-only">📅</span>
              </button>

              {me.role === 'superadmin' && (
                <button className="nav-btn" onClick={() => navigate('/admin/users')}>
                  <span className="hide-mobile">משתמשים</span>
                  <span className="show-mobile-only">👥</span>
                </button>
              )}

              <span className="hide-mobile" style={{
                fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)',
                padding: '0 8px', fontFamily: "'Heebo', sans-serif"
              }}>
                {me.username}{me.role === 'superadmin' && ' ★'}
              </span>

              <button className="nav-logout" onClick={handleLogout}>יציאה</button>
            </>
          )}
        </div>
      </nav>
    </>
  )
}
