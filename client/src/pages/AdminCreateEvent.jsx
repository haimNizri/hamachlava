import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventsApi } from '../api'
import Navbar from '../components/Navbar'
import ToastContainer, { showToast } from '../components/Toast'

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  border: '2px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '1rem',
  background: '#fafafa',
  outline: 'none',
  transition: 'border-color 0.2s'
}

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontWeight: 600,
  fontSize: '0.9rem',
  color: 'var(--text)'
}

export default function AdminCreateEvent() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    date: '',
    expected_people: '',
    notes: ''
  })
  const [products, setProducts] = useState([
    { name: '', price: '', available_quantity: '' }
  ])

  function updateForm(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function updateProduct(i, key, val) {
    setProducts(ps => ps.map((p, idx) => idx === i ? { ...p, [key]: val } : p))
  }

  function addProduct() {
    setProducts(ps => [...ps, { name: '', price: '', available_quantity: '' }])
  }

  function removeProduct(i) {
    if (products.length === 1) return
    setProducts(ps => ps.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.date) {
      showToast('שם ותאריך הם שדות חובה', 'error')
      return
    }

    const validProducts = products.filter(p => p.name && p.price !== '')
    const payload = {
      ...form,
      expected_people: form.expected_people ? Number(form.expected_people) : null,
      products: validProducts.map(p => ({
        name: p.name,
        price: Number(p.price),
        available_quantity: p.available_quantity ? Number(p.available_quantity) : null
      }))
    }

    setLoading(true)
    try {
      const event = await eventsApi.create(payload)
      showToast('האירוע נוצר בהצלחה!', 'success')
      navigate(`/admin/events/${event.id}`)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <ToastContainer />

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Back */}
        <button
          onClick={() => navigate('/admin')}
          style={{
            background: 'none', border: 'none', color: 'var(--text-light)',
            fontSize: '0.95rem', cursor: 'pointer', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '6px', padding: 0
          }}
        >
          ← חזרה
        </button>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '24px' }}>
          יצירת אירוע חדש
        </h1>

        <form onSubmit={handleSubmit}>
          {/* Event Details Card */}
          <div style={{
            background: '#fff', borderRadius: 'var(--radius)',
            padding: '24px', boxShadow: 'var(--shadow)', marginBottom: '20px'
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              פרטי האירוע
            </h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={labelStyle}>שם האירוע *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => updateForm('name', e.target.value)}
                  placeholder="לדוגמה: ערב ביר 2024"
                  required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>תאריך *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => updateForm('date', e.target.value)}
                    required
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>משתתפים צפויים</label>
                  <input
                    type="number"
                    value={form.expected_people}
                    onChange={e => updateForm('expected_people', e.target.value)}
                    placeholder="כמות"
                    min="1"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>הערות</label>
                <textarea
                  value={form.notes}
                  onChange={e => updateForm('notes', e.target.value)}
                  placeholder="הערות נוספות לאירוע..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>
          </div>

          {/* Products Card */}
          <div style={{
            background: '#fff', borderRadius: 'var(--radius)',
            padding: '24px', boxShadow: 'var(--shadow)', marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                מוצרים ({products.length})
              </h2>
              <button
                type="button"
                onClick={addProduct}
                style={{
                  background: 'var(--primary)', color: '#fff',
                  padding: '7px 16px', borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                + הוסף מוצר
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {products.map((product, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto',
                    gap: '10px',
                    alignItems: 'center',
                    background: '#f8f9fa',
                    padding: '14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <input
                    type="text"
                    value={product.name}
                    onChange={e => updateProduct(i, 'name', e.target.value)}
                    placeholder="שם המוצר"
                    style={{ ...inputStyle, background: '#fff', margin: 0 }}
                    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', right: '10px', top: '50%',
                      transform: 'translateY(-50%)', color: 'var(--text-light)',
                      fontSize: '0.9rem', pointerEvents: 'none'
                    }}>₪</span>
                    <input
                      type="number"
                      value={product.price}
                      onChange={e => updateProduct(i, 'price', e.target.value)}
                      placeholder="מחיר"
                      min="0"
                      step="0.5"
                      style={{ ...inputStyle, background: '#fff', width: '90px', paddingRight: '26px', margin: 0 }}
                      onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                  <input
                    type="number"
                    value={product.available_quantity}
                    onChange={e => updateProduct(i, 'available_quantity', e.target.value)}
                    placeholder="מלאי"
                    min="0"
                    style={{ ...inputStyle, background: '#fff', width: '80px', margin: 0 }}
                    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <button
                    type="button"
                    onClick={() => removeProduct(i)}
                    disabled={products.length === 1}
                    style={{
                      background: products.length === 1 ? '#f5f5f5' : '#eef2fb',
                      color: products.length === 1 ? '#ccc' : 'var(--accent)',
                      border: `1px solid ${products.length === 1 ? '#eee' : '#b8cbef'}`,
                      borderRadius: 'var(--radius-sm)',
                      width: '32px', height: '32px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem', flexShrink: 0
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '10px' }}>
              * מחיר הוא שדה חובה. ניתן להוסיף מוצרים גם לאחר יצירת האירוע.
            </p>
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              style={{
                background: '#fff', color: 'var(--text)',
                border: '2px solid var(--border)',
                padding: '12px 24px', borderRadius: 'var(--radius-sm)',
                fontWeight: 600, fontSize: '1rem'
              }}
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#aaa' : 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                color: '#fff',
                padding: '12px 32px', borderRadius: 'var(--radius-sm)',
                fontWeight: 700, fontSize: '1rem',
                boxShadow: '0 4px 12px rgba(59,111,212,0.3)'
              }}
            >
              {loading ? 'יוצר...' : 'צור אירוע'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
