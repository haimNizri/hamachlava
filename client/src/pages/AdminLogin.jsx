import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import ToastContainer, { showToast } from '../components/Toast'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('hamachlava_admin_token')
    if (token) {
      authApi.verify().then(() => navigate('/admin')).catch(() => {
        localStorage.removeItem('hamachlava_admin_token')
      })
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username || !password) { showToast('נא למלא שם משתמש וסיסמה', 'error'); return }
    setLoading(true)
    try {
      const data = await authApi.login(username, password)
      localStorage.setItem('hamachlava_admin_token', data.token)
      navigate('/admin')
    } catch (err) {
      showToast(err.message || 'שגיאה בהתחברות', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #131f2e 0%, #1e2d3d 60%, #162436 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Heebo', 'Segoe UI', sans-serif"
    }}>
      <ToastContainer />

      {/* Logo */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{
          background: '#fff',
          border: '3px solid #3b6fd4',
          borderRadius: '50%',
          width: '100px', height: '100px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
          boxShadow: '0 0 0 6px rgba(59,111,212,0.2), 0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <span style={{
            fontSize: '0.82rem', fontWeight: 900, color: '#131f2e',
            lineHeight: 1.2, textAlign: 'center', letterSpacing: '0.3px',
            fontFamily: "'Frank Ruhl Libre', serif"
          }}>המחלבה</span>
          <div style={{
            width: '48px', height: '1px',
            background: 'linear-gradient(90deg, transparent, #3b6fd4, transparent)',
            margin: '4px 0'
          }} />
          <span style={{
            fontSize: '0.52rem', color: '#3b6fd4',
            letterSpacing: '2px', fontFamily: "'Heebo', sans-serif", fontWeight: 700
          }}>פאב קהילתי</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
          כניסת מנהלים
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: '#fff',
        borderRadius: '10px',
        padding: '36px 32px',
        width: '100%',
        maxWidth: '380px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        animation: 'fadeIn 0.3s ease'
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>שם משתמש</label>
            <input
              type="text" value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="הזן שם משתמש" autoFocus
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#3b6fd4'}
              onBlur={e => e.target.style.borderColor = '#e0e6ed'}
            />
          </div>
          <div>
            <label style={labelStyle}>סיסמה</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="הזן סיסמה"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#3b6fd4'}
              onBlur={e => e.target.style.borderColor = '#e0e6ed'}
            />
          </div>
          <button
            type="submit" disabled={loading}
            style={{
              background: loading ? '#8ca8e8' : 'linear-gradient(135deg, #3b6fd4, #2a5bb8)',
              color: '#fff', padding: '12px', borderRadius: '6px',
              fontSize: '0.95rem', fontWeight: 700, marginTop: '6px',
              boxShadow: '0 4px 12px rgba(59,111,212,0.35)',
              transition: 'opacity 0.2s', border: 'none'
            }}
          >
            {loading ? 'מתחבר...' : 'כניסה'}
          </button>
        </form>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@900&family=Heebo:wght@400;600&display=swap');`}</style>
    </div>
  )
}

const labelStyle = {
  display: 'block', marginBottom: '6px',
  fontWeight: 600, fontSize: '0.82rem', color: '#1a2332', letterSpacing: '0.03em'
}

const inputStyle = {
  width: '100%', padding: '11px 12px',
  border: '1.5px solid #e0e6ed', borderRadius: '6px',
  fontSize: '0.95rem', outline: 'none',
  background: '#f8fafc', color: '#1a2332',
  transition: 'border-color 0.15s'
}
