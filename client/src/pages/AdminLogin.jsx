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
    if (!username || !password) {
      showToast('נא למלא שם משתמש וסיסמה', 'error')
      return
    }
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
      background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 60%, #2a3f55 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <ToastContainer />
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'fadeIn 0.4s ease'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '72px', height: '72px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '2rem'
          }}>
            🏺
          </div>
          <h1 style={{
            color: 'var(--primary)', fontSize: '1.8rem',
            fontWeight: 700, marginBottom: '4px'
          }}>
            המחלבה
          </h1>
          <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>
            כניסת מנהלים
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
              שם משתמש
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="הזן שם משתמש"
              autoFocus
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '1rem',
                transition: 'border-color 0.2s',
                outline: 'none',
                background: '#fafafa'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
              סיסמה
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="הזן סיסמה"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '1rem',
                transition: 'border-color 0.2s',
                outline: 'none',
                background: '#fafafa'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#aaa' : 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              color: '#fff',
              padding: '13px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '1rem',
              fontWeight: 700,
              marginTop: '8px',
              transition: 'transform 0.1s, box-shadow 0.1s',
              boxShadow: '0 4px 12px rgba(59,111,212,0.35)'
            }}
            onMouseDown={e => { if (!loading) e.target.style.transform = 'scale(0.98)' }}
            onMouseUp={e => { e.target.style.transform = 'scale(1)' }}
          >
            {loading ? 'מתחבר...' : 'התחבר'}
          </button>
        </form>
      </div>
    </div>
  )
}
