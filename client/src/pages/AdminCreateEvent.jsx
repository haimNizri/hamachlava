import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventsApi } from '../api'
import Navbar from '../components/Navbar'
import ToastContainer, { showToast } from '../components/Toast'

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid #e0e6ed',
  borderRadius: '2px',
  fontSize: '0.95rem',
  background: '#f8fafc',
  outline: 'none',
  transition: 'border-color 0.15s'
}

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontWeight: 600,
  fontSize: '0.78rem',
  color: '#1a2332',
  letterSpacing: '0.05em',
  textTransform: 'uppercase'
}

function focusOn(e) { e.target.style.borderColor = '#3b6fd4' }
function focusOff(e) { e.target.style.borderColor = '#e0e6ed' }

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
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Navbar />
      <ToastContainer />

      <div style={{ maxWidth: '660px', margin: '0 auto', padding: '28px 16px' }}>
        <button
          onClick={() => navigate('/admin')}
          style={{
            background: 'none', border: 'none', color: '#6b7a99',
            fontSize: '0.85rem', cursor: 'pointer', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '6px', padding: 0
          }}
        >
          ← חזרה
        </button>

        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a2332', marginBottom: '24px', letterSpacing: '0.02em' }}>
          יצירת אירוע חדש
        </h1>

        <form onSubmit={handleSubmit}>
          {/* Event Details */}
          <div style={{
            background: '#f8fafc', border: '1px solid #e0e6ed',
            borderRadius: '4px', padding: '24px', marginBottom: '16px'
          }}>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7a99', marginBottom: '20px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
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
                  onFocus={focusOn}
                  onBlur={focusOff}
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
                    onFocus={focusOn}
                    onBlur={focusOff}
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
                    onFocus={focusOn}
                    onBlur={focusOff}
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
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </div>
            </div>
          </div>

          {/* Products */}
          <div style={{
            background: '#f8fafc', border: '1px solid #e0e6ed',
            borderRadius: '4px', padding: '24px', marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7a99', margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                מוצרים ({products.length})
              </h2>
              <button
                type="button"
                onClick={addProduct}
                style={{
                  background: 'linear-gradient(135deg, #3b6fd4, #2a5bb8)', color: '#f0f2f5',
                  padding: '6px 14px', borderRadius: '2px',
                  fontSize: '0.8rem', fontWeight: 600,
                  letterSpacing: '0.04em'
                }}
              >
                + הוסף מוצר
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {products.map((product, i) => (
                <div
                  key={i}
                  style={{
                    background: '#f8fafc',
                    padding: '14px',
                    borderRadius: '2px',
                    border: '1px solid #e0e6ed'
                  }}
                >
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={product.name}
                      onChange={e => updateProduct(i, 'name', e.target.value)}
                      placeholder="שם המוצר"
                      style={{ ...inputStyle, flex: 1, margin: 0 }}
                      onFocus={focusOn}
                      onBlur={focusOff}
                    />
                    <button
                      type="button"
                      onClick={() => removeProduct(i)}
                      disabled={products.length === 1}
                      style={{
                        background: '#f8fafc',
                        color: products.length === 1 ? '#c8d0dc' : '#6b7a99',
                        border: '1px solid #e0e6ed',
                        borderRadius: '2px',
                        width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem', flexShrink: 0
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{
                        position: 'absolute', right: '10px', top: '50%',
                        transform: 'translateY(-50%)', color: '#6b7a99',
                        fontSize: '0.9rem', pointerEvents: 'none'
                      }}>₪</span>
                      <input
                        type="number"
                        value={product.price}
                        onChange={e => updateProduct(i, 'price', e.target.value)}
                        placeholder="מחיר"
                        min="0"
                        step="0.5"
                        style={{ ...inputStyle, width: '100%', paddingRight: '26px', margin: 0 }}
                        onFocus={focusOn}
                        onBlur={focusOff}
                      />
                    </div>
                    <input
                      type="number"
                      value={product.available_quantity}
                      onChange={e => updateProduct(i, 'available_quantity', e.target.value)}
                      placeholder="מלאי (אופציונלי)"
                      min="0"
                      style={{ ...inputStyle, flex: 1, margin: 0 }}
                      onFocus={focusOn}
                      onBlur={focusOff}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '0.78rem', color: '#6b7a99', marginTop: '10px' }}>
              מחיר הוא שדה חובה. ניתן להוסיף מוצרים גם לאחר יצירת האירוע.
            </p>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              style={{
                background: '#f8fafc', color: '#1a2332',
                border: '1px solid #e0e6ed',
                padding: '11px 22px', borderRadius: '2px',
                fontWeight: 600, fontSize: '0.85rem'
              }}
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#8ca8e8' : 'linear-gradient(135deg, #3b6fd4, #2a5bb8)',
                color: '#f0f2f5',
                padding: '11px 28px', borderRadius: '2px',
                fontWeight: 700, fontSize: '0.85rem',
                letterSpacing: '0.06em'
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
