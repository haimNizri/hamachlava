import { useNavigate } from 'react-router-dom'

const NAV_LINKS_RIGHT = ['אודות', 'תפריט']
const NAV_LINKS_LEFT = ['גלריה', 'צרו קשר']

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div style={{ fontFamily: "'Frank Ruhl Libre', serif", direction: 'rtl', minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-title   { animation: fadeUp 0.9s ease 0.1s both; }
        .hero-sub     { animation: fadeUp 0.9s ease 0.35s both; }
        .hero-btn     { animation: fadeUp 0.9s ease 0.6s both; }
        .nav-link {
          color: #3d2b1f;
          text-decoration: none;
          font-size: 1.05rem;
          font-family: 'Heebo', sans-serif;
          font-weight: 400;
          letter-spacing: 0.5px;
          transition: color 0.2s;
          position: relative;
          padding-bottom: 2px;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px; right: 0;
          width: 0; height: 1px;
          background: #8b6914;
          transition: width 0.25s;
        }
        .nav-link:hover { color: #8b6914; }
        .nav-link:hover::after { width: 100%; }
        .hero-btn-inner {
          background: transparent;
          border: 1.5px solid #d4b896;
          color: #e8d5b5;
          padding: 12px 36px;
          font-size: 1rem;
          font-family: 'Heebo', sans-serif;
          font-weight: 600;
          letter-spacing: 2px;
          cursor: pointer;
          transition: background 0.25s, color 0.25s;
          border-radius: 3px;
        }
        .hero-btn-inner:hover {
          background: rgba(212,184,150,0.15);
          color: #fff;
        }
        .admin-link {
          color: #8b6914;
          text-decoration: none;
          font-size: 0.82rem;
          font-family: 'Heebo', sans-serif;
          opacity: 0.7;
          transition: opacity 0.2s;
          cursor: pointer;
        }
        .admin-link:hover { opacity: 1; }
      `}</style>

      {/* ─── NAVBAR ─── */}
      <nav style={{
        background: 'linear-gradient(180deg, #f7f0de 0%, #efe5c8 100%)',
        borderBottom: '2px solid #c9a96e',
        padding: '0 60px',
        height: '78px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 20,
        boxShadow: '0 2px 12px rgba(61,43,31,0.12)'
      }}>
        {/* Right links */}
        <div style={{ display: 'flex', gap: '44px' }}>
          {NAV_LINKS_RIGHT.map(l => (
            <a key={l} href={`#${l}`} className="nav-link">{l}</a>
          ))}
        </div>

        {/* Center logo badge */}
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          zIndex: 30
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #f7f0de 0%, #ece0c4 100%)',
            border: '2.5px solid #a07828',
            borderRadius: '50%',
            width: '90px',
            height: '90px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 16px rgba(61,43,31,0.2), inset 0 1px 3px rgba(255,255,255,0.5)',
            marginTop: '10px',
            outline: '1px solid #c9a96e',
            outlineOffset: '4px'
          }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 900,
              color: '#5c3d1e',
              lineHeight: 1.15,
              textAlign: 'center',
              letterSpacing: '0.5px'
            }}>
              המחלבה
            </span>
            <div style={{
              width: '40px', height: '1px',
              background: 'linear-gradient(90deg, transparent, #a07828, transparent)',
              margin: '3px 0'
            }} />
            <span style={{
              fontSize: '0.55rem',
              color: '#8b6914',
              letterSpacing: '2px',
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 600
            }}>
              פאב קהילתי
            </span>
          </div>
        </div>

        {/* Left links */}
        <div style={{ display: 'flex', gap: '44px' }}>
          {NAV_LINKS_LEFT.map(l => (
            <a key={l} href={`#${l}`} className="nav-link">{l}</a>
          ))}
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <div style={{
        position: 'relative',
        height: 'calc(100vh - 78px)',
        minHeight: '520px',
        background: `
          linear-gradient(
            to bottom,
            rgba(10,5,2,0.52) 0%,
            rgba(20,10,4,0.48) 60%,
            rgba(10,5,2,0.70) 100%
          ),
          url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1600&q=80')
          center/cover no-repeat
        `,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 20px'
      }}>
        {/* warm vignette overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(20,8,2,0.55) 100%)',
          pointerEvents: 'none'
        }} />

        <h1 className="hero-title" style={{
          fontSize: 'clamp(3rem, 8vw, 5.5rem)',
          fontWeight: 900,
          color: '#f5e9d0',
          textShadow: '2px 4px 16px rgba(0,0,0,0.85)',
          margin: '0 0 18px',
          lineHeight: 1.1,
          position: 'relative'
        }}>
          המחלבה
        </h1>

        {/* decorative divider */}
        <div className="hero-sub" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', position: 'relative' }}>
          <div style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg, transparent, #c9a96e)' }} />
          <span style={{ color: '#c9a96e', fontSize: '1.2rem' }}>✦</span>
          <div style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg, #c9a96e, transparent)' }} />
        </div>

        <p className="hero-sub" style={{
          fontSize: 'clamp(0.9rem, 2.2vw, 1.1rem)',
          color: '#d4b896',
          maxWidth: '480px',
          lineHeight: 1.85,
          textShadow: '1px 1px 6px rgba(0,0,0,0.9)',
          marginBottom: '40px',
          fontFamily: "'Heebo', sans-serif",
          fontWeight: 300,
          position: 'relative'
        }}>
          ברוכים הבאים לפאב הקהילתי שלנו.<br />
          אירועים, אוכל ואלכוהול איכותי — במקום אחד.
        </p>

        <div className="hero-btn" style={{ position: 'relative' }}>
          <button
            className="hero-btn-inner"
            onClick={() => document.getElementById('about-section').scrollIntoView({ behavior: 'smooth' })}
          >
            גלה עוד
          </button>
        </div>

        {/* scroll indicator */}
        <div style={{
          position: 'absolute',
          bottom: '28px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          opacity: 0.5
        }}>
          <div style={{ width: '1px', height: '40px', background: 'linear-gradient(180deg, transparent, #c9a96e, transparent)' }} />
        </div>
      </div>

      {/* ─── ABOUT SECTION ─── */}
      <div id="about-section" style={{
        background: 'linear-gradient(180deg, #faf5e8 0%, #f3ead4 100%)',
        borderTop: '2px solid #c9a96e',
        padding: '72px 40px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          {/* ornament */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '28px' }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #c9a96e)' }} />
            <span style={{ color: '#a07828', fontSize: '1.3rem' }}>🍺</span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #c9a96e, transparent)' }} />
          </div>

          <h2 style={{
            fontSize: '2.2rem',
            fontWeight: 900,
            color: '#3d2b1f',
            marginBottom: '20px',
            letterSpacing: '0.5px'
          }}>
            אודות המחלבה
          </h2>

          <p style={{
            color: '#6b5744',
            fontSize: '1.05rem',
            lineHeight: 2,
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 300,
            marginBottom: '40px'
          }}>
            המחלבה הוא פאב קהילתי שבו כל ערב הוא אירוע.
            אנחנו מאמינים בחוויה אמיתית — אלכוהול איכותי, אווירה חמה,
            ואנשים שמחים לפגוש אחד את השני.
          </p>

          <button
            onClick={() => navigate('/admin/login')}
            style={{
              background: 'linear-gradient(135deg, #8b6914, #a07828)',
              color: '#f7f0de',
              border: 'none',
              padding: '13px 40px',
              fontSize: '1rem',
              fontFamily: "'Heebo', sans-serif",
              fontWeight: 600,
              letterSpacing: '1px',
              cursor: 'pointer',
              borderRadius: '3px',
              boxShadow: '0 4px 16px rgba(139,105,20,0.35)',
              transition: 'transform 0.15s, box-shadow 0.15s'
            }}
            onMouseEnter={e => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 6px 20px rgba(139,105,20,0.45)'
            }}
            onMouseLeave={e => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 16px rgba(139,105,20,0.35)'
            }}
          >
            כניסת מנהלים
          </button>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer style={{
        background: '#1e1208',
        borderTop: '2px solid #5c3d1e',
        padding: '28px 40px',
        textAlign: 'center'
      }}>
        <p style={{
          color: '#6b5744',
          fontSize: '0.85rem',
          fontFamily: "'Heebo', sans-serif",
          fontWeight: 300,
          margin: 0
        }}>
          © 2025 המחלבה — פאב קהילתי
        </p>
      </footer>
    </div>
  )
}
