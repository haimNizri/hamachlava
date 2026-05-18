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
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <ToastContainer />

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '28px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>ניהול משתמשים</h1>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '4px' }}>גישה לסופר אדמין בלבד</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              background: 'var(--accent)', color: '#fff',
              padding: '10px 20px', borderRadius: 'var(--radius-sm)',
              fontWeight: 700, fontSize: '0.95rem',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            + הוסף אדמין
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-light)' }}>טוען...</div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
            {admins.map((admin, i) => (
              <div key={admin.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', gap: '12px',
                borderBottom: i < admins.length - 1 ? '1px solid var(--border)' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: admin.role === 'superadmin'
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                      : 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '1rem', flexShrink: 0
                  }}>
                    {admin.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text)' }}>{admin.username}</span>
                      {admin.id === me.id && (
                        <span style={{ fontSize: '0.72rem', background: '#eef2fb', color: 'var(--accent)', padding: '1px 7px', borderRadius: '20px' }}>אתה</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '20px',
                        background: admin.role === 'superadmin' ? '#fef3c7' : '#f0f4fb',
                        color: admin.role === 'superadmin' ? '#d97706' : 'var(--accent)'
                      }}>
                        {admin.role === 'superadmin' ? '⭐ סופר אדמין' : 'אדמין'}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                        נוצר: {new Date(admin.created_at).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setEditTarget(admin)}
                    style={{
                      background: '#eef2fb', color: 'var(--accent)',
                      border: '1px solid #b8cbef', borderRadius: 'var(--radius-sm)',
                      padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600
                    }}
                  >
                    ערוך
                  </button>
                  {admin.role !== 'superadmin' && admin.id !== me.id && (
                    <button
                      onClick={() => handleDelete(admin.id, admin.username)}
                      style={{
                        background: '#fee2e2', color: '#dc2626',
                        border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)',
                        padding: '6px 14px', fontSize: '0.85rem'
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
      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>
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
          border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
          fontSize: '0.95rem', background: '#fafafa'
        }}
      />
    </div>
  )
}

function btnStyle(loading) {
  return {
    background: loading ? '#aaa' : 'var(--accent)',
    color: '#fff', border: 'none',
    padding: '11px', borderRadius: 'var(--radius-sm)',
    fontSize: '1rem', fontWeight: 700, marginTop: '4px'
  }
}
