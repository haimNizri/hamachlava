import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { customersApi, purchasesApi } from '../api'

const DEVICE_KEY = 'hamachlava_device_id'
const CUSTOMER_KEY = 'hamachlava_customer'

function getOrCreateDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

function getStoredCustomer() {
  try {
    const raw = localStorage.getItem(CUSTOMER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function CustomerEvent() {
  const { id: eventId } = useParams()
  const [stage, setStage] = useState('loading') // loading | register | event | success
  const [event, setEvent] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [error, setError] = useState(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')

  const [quantities, setQuantities] = useState({})
  const [submitLoading, setSubmitLoading] = useState(false)

  useEffect(() => { init() }, [eventId])

  async function init() {
    const deviceId = getOrCreateDeviceId()
    try {
      const res = await fetch(`/api/events/${eventId}/public`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error || 'האירוע לא נמצא')
        setStage('error')
        return
      }
      const eventData = await res.json()
      setEvent(eventData)

      const stored = getStoredCustomer()
      if (stored?.token && stored?.customer) {
        setCustomer(stored.customer)
        setStage('event')
        return
      }

      const check = await customersApi.check(deviceId)
      if (check.registered) {
        const reg = await customersApi.register({
          device_id: deviceId,
          first_name: check.customer.first_name,
          last_name: check.customer.last_name
        })
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ customer: reg.customer, token: reg.token }))
        setCustomer(reg.customer)
        setStage('event')
      } else {
        setStage('register')
      }
    } catch {
      setError('שגיאה בטעינת האירוע')
      setStage('error')
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setRegError('נא למלא שם פרטי ושם משפחה')
      return
    }
    const deviceId = getOrCreateDeviceId()
    setRegLoading(true)
    setRegError('')
    try {
      const data = await customersApi.register({
        device_id: deviceId,
        first_name: firstName.trim(),
        last_name: lastName.trim()
      })
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ customer: data.customer, token: data.token }))
      setCustomer(data.customer)
      setStage('event')
    } catch (err) {
      setRegError(err.message || 'שגיאה בהרשמה')
    } finally {
      setRegLoading(false)
    }
  }

  async function handleSubmitPurchases(e) {
    e.preventDefault()
    const entries = Object.entries(quantities).filter(([, qty]) => Number(qty) > 0)
    if (entries.length === 0) {
      showInlineToast('יש לבחור לפחות מוצר אחד', 'error')
      return
    }

    const storedCustomer = getStoredCustomer()
    if (!storedCustomer?.token) { setStage('register'); return }

    setSubmitLoading(true)
    const session_id = crypto.randomUUID()
    try {
      for (const [productId, qty] of entries) {
        await fetch('/api/purchases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storedCustomer.token}`
          },
          body: JSON.stringify({
            event_id: Number(eventId),
            product_id: Number(productId),
            quantity: Number(qty),
            session_id
          })
        })
      }
      setStage('success')
    } catch {
      showInlineToast('שגיאה בשמירת הרכישה', 'error')
    } finally {
      setSubmitLoading(false)
    }
  }

  function updateQty(productId, val) {
    const num = parseInt(val) || 0
    setQuantities(q => ({ ...q, [productId]: num > 0 ? num : '' }))
  }

  const totalAmount = event?.products?.reduce((sum, p) => {
    return sum + (Number(quantities[p.id]) || 0) * p.price
  }, 0) || 0

  if (stage === 'loading') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7a99', fontSize: '0.9rem' }}>
            טוען...
          </div>
        </div>
      </div>
    )
  }

  if (stage === 'error') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h2 style={{ color: '#c0392b', marginBottom: '8px', fontSize: '1.1rem' }}>שגיאה</h2>
            <p style={{ color: '#6b7a99', fontSize: '0.9rem' }}>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (stage === 'register') {
    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            המחלבה
          </h1>
          {event && (
            <p style={{ opacity: 0.7, margin: '4px 0 0', fontSize: '0.9rem' }}>{event.name}</p>
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a2332', marginBottom: '6px' }}>
            ברוך הבא
          </h2>
          <p style={{ color: '#6b7a99', marginBottom: '24px', fontSize: '0.88rem', lineHeight: 1.5 }}>
            יש להירשם פעם אחת. הרישום יישמר במכשיר זה.
          </p>

          {regError && (
            <div style={{
              background: '#fff3f3', border: '1px solid #f0c0c0',
              borderRadius: '2px', padding: '10px 14px',
              color: '#c0392b', fontSize: '0.85rem', marginBottom: '16px'
            }}>
              {regError}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={fieldLabelStyle}>שם פרטי</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="הזן שם פרטי"
                autoFocus
                style={fieldInputStyle}
                onFocus={e => e.target.style.borderColor = '#3b6fd4'}
                onBlur={e => e.target.style.borderColor = '#e0e6ed'}
              />
            </div>
            <div>
              <label style={fieldLabelStyle}>שם משפחה</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="הזן שם משפחה"
                style={fieldInputStyle}
                onFocus={e => e.target.style.borderColor = '#3b6fd4'}
                onBlur={e => e.target.style.borderColor = '#e0e6ed'}
              />
            </div>
            <button
              type="submit"
              disabled={regLoading}
              style={{
                background: regLoading ? '#8ca8e8' : 'linear-gradient(135deg, #3b6fd4, #2a5bb8)',
                color: '#f0f2f5',
                padding: '13px',
                borderRadius: '2px',
                fontSize: '0.95rem',
                fontWeight: 700,
                marginTop: '4px',
                letterSpacing: '0.04em'
              }}
            >
              {regLoading ? 'נרשם...' : 'הירשם והמשך'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (stage === 'success') {
    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            המחלבה
          </h1>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <h2 style={{ color: '#1a7a4a', fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px' }}>
            הרכישה נרשמה בהצלחה
          </h2>
          <p style={{ color: '#6b7a99', marginBottom: '20px', fontSize: '0.88rem' }}>
            תודה {customer?.first_name}! הרכישות שלך נשמרו.
          </p>
          <div style={{
            background: '#f0f2f5',
            borderRadius: '2px', padding: '14px', marginBottom: '20px',
            fontSize: '1rem', fontWeight: 700, color: '#1a2332'
          }}>
            סה"כ: ₪{totalAmount.toFixed(2)}
          </div>
          <button
            onClick={() => { setQuantities({}); setStage('event') }}
            style={{
              background: 'linear-gradient(135deg, #3b6fd4, #2a5bb8)', color: '#f0f2f5',
              padding: '11px 24px', borderRadius: '2px',
              fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.04em'
            }}
          >
            חזור לאירוע
          </button>
        </div>
      </div>
    )
  }

  // Stage: event
  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          המחלבה
        </h1>
        {event && (
          <>
            <p style={{ opacity: 0.85, margin: '0 0 2px', fontSize: '0.95rem', fontWeight: 600 }}>{event.name}</p>
            <p style={{ opacity: 0.6, margin: 0, fontSize: '0.82rem' }}>
              {new Date(event.date).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </>
        )}
      </div>

      {/* Greeting */}
      <div style={{ ...cardStyle, paddingTop: '14px', paddingBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
          background: '#1a2332',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#f0f2f5', fontSize: '1rem', fontWeight: 700
        }}>
          {customer?.first_name?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: '#1a2332', fontSize: '0.9rem' }}>
            שלום, {customer?.first_name} {customer?.last_name}
          </p>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#6b7a99' }}>
            בחר מוצרים והזן כמות
          </p>
        </div>
      </div>

      {/* Products */}
      <form onSubmit={handleSubmitPurchases}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {event?.products?.map(product => {
            const qty = quantities[product.id] || ''
            const subtotal = (Number(qty) || 0) * product.price
            return (
              <div
                key={product.id}
                style={{
                  background: '#f8fafc',
                  borderRadius: '4px',
                  padding: '16px',
                  border: qty > 0 ? '1.5px solid #3b6fd4' : '1.5px solid #e0e6ed',
                  transition: 'border-color 0.15s',
                  margin: '0 16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a2332' }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1a2332', marginTop: '2px' }}>
                      ₪{product.price}
                    </div>
                    {qty > 0 && (
                      <div style={{ fontSize: '0.8rem', color: '#1a7a4a', fontWeight: 600, marginTop: '2px' }}>
                        סה"כ: ₪{subtotal.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Quantity Stepper */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => updateQty(product.id, Math.max(0, (Number(qty) || 0) - 1))}
                      style={{
                        width: '34px', height: '34px',
                        borderRadius: '2px',
                        background: qty > 0 ? '#1a2332' : '#f0f2f5',
                        color: qty > 0 ? '#f0f2f5' : '#6b7a99',
                        border: '1px solid ' + (qty > 0 ? '#1a2332' : '#e0e6ed'),
                        fontSize: '1.2rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={qty}
                      onChange={e => updateQty(product.id, e.target.value)}
                      min="0"
                      style={{
                        width: '48px',
                        textAlign: 'center',
                        padding: '6px 4px',
                        border: '1.5px solid #e0e6ed',
                        borderRadius: '2px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        outline: 'none',
                        direction: 'ltr'
                      }}
                      onFocus={e => e.target.style.borderColor = '#3b6fd4'}
                      onBlur={e => e.target.style.borderColor = '#e0e6ed'}
                    />
                    <button
                      type="button"
                      onClick={() => updateQty(product.id, (Number(qty) || 0) + 1)}
                      style={{
                        width: '34px', height: '34px',
                        borderRadius: '2px',
                        background: 'linear-gradient(135deg, #3b6fd4, #2a5bb8)',
                        color: '#f0f2f5',
                        border: 'none', fontSize: '1.2rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Total & Submit */}
        <div style={{
          position: 'sticky', bottom: '16px',
          background: '#f8fafc',
          borderRadius: '4px',
          padding: '14px 16px',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e0e6ed',
          margin: '0 16px'
        }}>
          {totalAmount > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '12px', padding: '10px 12px',
              background: '#f0f2f5', borderRadius: '2px'
            }}>
              <span style={{ fontWeight: 700, color: '#1a2332', fontSize: '0.9rem' }}>סה"כ לתשלום:</span>
              <span style={{ fontWeight: 800, color: '#1a2332', fontSize: '1.1rem' }}>₪{totalAmount.toFixed(2)}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={submitLoading || totalAmount === 0}
            style={{
              width: '100%',
              background: totalAmount === 0 ? '#c8d0dc' : submitLoading ? '#8ca8e8' : 'linear-gradient(135deg, #3b6fd4, #2a5bb8)',
              color: '#f0f2f5',
              padding: '13px',
              borderRadius: '2px',
              fontSize: '0.95rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              transition: 'background 0.15s'
            }}
          >
            {submitLoading ? 'שומר...' : totalAmount === 0 ? 'בחר מוצרים' : `שלח הזמנה • ₪${totalAmount.toFixed(2)}`}
          </button>
        </div>
      </form>
    </div>
  )
}

const pageStyle = {
  minHeight: '100vh',
  background: '#f0f2f5',
  paddingBottom: '100px'
}

const headerStyle = {
  padding: '24px 20px 20px',
  textAlign: 'center',
  background: 'linear-gradient(180deg, #1a2332 0%, #131f2e 100%)',
  color: '#fff'
}

const cardStyle = {
  background: '#f8fafc',
  borderRadius: '4px',
  padding: '24px',
  margin: '16px 16px 12px',
  border: '1px solid #e0e6ed',
  animation: 'fadeIn 0.25s ease'
}

const fieldLabelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontWeight: 600,
  fontSize: '0.78rem',
  color: '#1a2332',
  letterSpacing: '0.05em',
  textTransform: 'uppercase'
}

const fieldInputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '1.5px solid #e0e6ed',
  borderRadius: '2px',
  fontSize: '1rem',
  background: '#f8fafc',
  outline: 'none',
  transition: 'border-color 0.15s'
}

let inlineToastTimer = null
function showInlineToast(msg, type) {
  const existing = document.querySelector('.inline-toast')
  if (existing) existing.remove()
  const el = document.createElement('div')
  el.className = `toast ${type} inline-toast`
  el.textContent = msg
  document.body.appendChild(el)
  clearTimeout(inlineToastTimer)
  inlineToastTimer = setTimeout(() => el.remove(), 3000)
}
