import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminsApi } from '../api'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal'
import ToastContainer, { showToast } from '../components/Toast'

export default function AdminsManager() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const navigate = useNavigate()

  const me = (() => {
    try { return JSON.parse(atob(localStorage.getItem('hamachlava_admin_token').split('.')[1])) } catch { return {} }
  })()

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setAdmins(await adminsApi.list())
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id, username) {
    if (!confirm(`למחוק את המשתמש "${username}"?`)) return
    try {
      await adminsApi.delete(id)
      showToast('המשתמש נמחק', 'success')
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Navbar />
      <ToastContainer />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a2332', letterSpacing: '0.02em' }}>ניהול משתמשים</h1>
            <p style={{ color: '#6b7a99', fontSize: '0.82rem', marginTop: '2px', letterSpacing: '0.03em' }}>גישה לסופר אדמין בלבד</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              background: 'linear-gradient(135deg, #3b6fd4, #2a5bb8)', color: '#f0f2f5',
              padding: '10px 20px', borderRadius: '2px',
              fontWeight: 700, fontSize: '0.82rem',
              letterSpacing: '0.06em'
            }}
          >
            + הוסף אדמין
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6b7a99' }}>טוען...</div>
        ) : (
          <div style={{ background: '#f8fafc', border: '1px solid #e0e6ed', borderRadius: '4px' }}>
            {admins.map((admin, i) => (
              <div key={admin.id} className="mobile-wrap" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', gap: '12px',
                borderBottom: i < admins.length - 1 ? '1px solid #e0e6ed' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: admin.role === 'superadmin' ? '#1a2332' : '#e0e6ed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: admin.role === 'superadmin' ? '#f0f2f5' : '#1a2332',
                    fontWeight: 700, fontSize: '0.9rem', flexShrink: 0
                  }}>
                    {admin.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#1a2332', fontSize: '0.95rem' }}>{admin.username}</span>
                      {admin.id === me.id && (
                        <span style={{ fontSize: '0.7rem', background: '#f0f2f5', color: '#6b7a99', padding: '1px 7px', borderRadius: '2px', border: '1px solid #e0e6ed' }}>אתה</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px' }}>
                      <span style={{ fontSize: '0.75rem', color: admin.role === 'superadmin' ? '#1a2332' : '#6b7a99', fontWeight: admin.role === 'superadmin' ? 700 : 400 }}>
                        {admin.role === 'superadmin' ? '★ סופר אדמין' : 'אדמין'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#8ca8e8' }}>
                        {new Date(admin.created_at).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setEditTarget(admin)}
                    style={{
                      background: '#f8fafc', color: '#1a2332',
                      border: '1px solid #e0e6ed', borderRadius: '2px',
                      padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600
                    }}
                  >
                    ערוך
                  </button>
                  {admin.role !== 'superadmin' && admin.id !== me.id && (
                    <button
                      onClick={() => handleDelete(admin.id, admin.username)}
                      style={{
                        background: '#fff', color: '#c0392b',
                        border: '1px solid #f0c0c0', borderRadius: '2px',
                        padding: '6px 14px', fontSize: '0.8rem'
                      }}
                    >
                      מחק
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateAdminModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); load() }}
        />
      )}

      {editTarget && (
        <EditAdminModal
          admin={editTarget}
          isSelf={editTarget.id === me.id}
          onClose={() => setEditTarget(null)}
          onSuccess={(token) => {
            if (token) {
              localStorage.setItem('hamachlava_admin_token', token)
              showToast('הפרטים עודכנו — מתחבר מחדש...', 'success')
            }
            setEditTarget(null)
            load()
          }}
        />
      )}
    </div>
  )
}

function CreateAdminModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await adminsApi.create(form)
      showToast('האדמין נוצר בהצלחה', 'success')
      onSuccess()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="יצירת אדמין חדש" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Field label="שם משתמש" value={form.username} onChange={v => setForm(f => ({ ...f, username: v }))} placeholder="username" />
        <Field label="סיסמה" type="password" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} placeholder="לפחות 6 תווים" />
        <button type="submit" disabled={loading} style={btnStyle(loading)}>
          {loading ? 'יוצר...' : 'צור אדמין'}
        </button>
      </form>
    </Modal>
  )
}

function EditAdminModal({ admin, isSelf, onClose, onSuccess }) {
  const [form, setForm] = useState({ username: admin.username, password: '', current_password: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      let res
      if (isSelf) {
        res = await adminsApi.updateProfile({
          username: form.username !== admin.username ? form.username : undefined,
          current_password: form.current_password,
          new_password: form.password || undefined
        })
      } else {
        res = await adminsApi.update(admin.id, {
          username: form.username !== admin.username ? form.username : undefined,
          password: form.password || undefined
        })
      }
      showToast('הפרטים עודכנו בהצלחה', 'success')
      onSuccess(res?.token)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={`עריכת ${admin.username}`} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Field label="שם משתמש" value={form.username} onChange={v => setForm(f => ({ ...f, username: v }))} />
        {isSelf && (
          <Field label="סיסמה נוכחית (לאישור)" type="password" value={form.current_password}
            onChange={v => setForm(f => ({ ...f, current_password: v }))} placeholder="הכרחי לשמירה" required />
        )}
        <Field label="סיסמה חדשה (אופציונלי)" type="password" value={form.password}
          onChange={v => setForm(f => ({ ...f, password: v }))} placeholder="השאר ריק לאי-שינוי" />
        <button type="submit" disabled={loading} style={btnStyle(loading)}>
          {loading ? 'שומר...' : 'שמור שינויים'}
        </button>
      </form>
    </Modal>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder = '', required = false }) {
  return (
    <div>
      <label style={{
        display: 'block', marginBottom: '6px',
        fontWeight: 600, fontSize: '0.78rem',
        color: '#1a2332', letterSpacing: '0.05em',
        textTransform: 'uppercase'
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%', padding: '10px 12px',
          border: '1.5px solid #e0e6ed', borderRadius: '2px',
          fontSize: '0.95rem', background: '#f8fafc',
          outline: 'none', transition: 'border-color 0.15s'
        }}
        onFocus={e => e.target.style.borderColor = '#3b6fd4'}
        onBlur={e => e.target.style.borderColor = '#e0e6ed'}
      />
    </div>
  )
}

function btnStyle(loading) {
  return {
    background: loading ? '#8ca8e8' : 'linear-gradient(135deg, #3b6fd4, #2a5bb8)',
    color: '#f0f2f5', border: 'none',
    padding: '11px', borderRadius: '2px',
    fontSize: '0.85rem', fontWeight: 700,
    marginTop: '4px', letterSpacing: '0.06em'
  }
}
