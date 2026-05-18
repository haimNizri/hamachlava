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

  // Registration form
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')

  // Quantities per product
  const [quantities, setQuantities] = useState({})
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    init()
  }, [eventId])

  async function init() {
    const deviceId = getOrCreateDeviceId()

    // Load event
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

      // Check registration
      const stored = getStoredCustomer()
      if (stored?.token && stored?.customer) {
        setCustomer(stored.customer)
        setStage('event')
        return
      }

      // Check by device
      const check = await customersApi.check(deviceId)
      if (check.registered) {
        // Issue a new token
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
    } catch (err) {
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
    if (!storedCustomer?.token) {
      setStage('register')
      return
    }

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
      setSubmitSuccess(true)
      setStage('success')
    } catch (err) {
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

  // ---- RENDER ----

  if (stage === 'loading') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px', animation: 'spin 1s linear infinite' }}>⏳</div>
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
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>😕</div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '8px' }}>שגיאה</h2>
            <p style={{ color: 'var(--text-light)' }}>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (stage === 'register') {
    return (
      <div style={pageStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🏺</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>המחלבה</h1>
          {event && (
            <p style={{ opacity: 0.8, margin: '4px 0 0', fontSize: '1rem' }}>{event.name}</p>
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
            ברוך הבא! 👋
          </h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '24px', fontSize: '0.95rem' }}>
            כדי להמשיך, יש להירשם פעם אחת. הרישום שלך יישמר במכשיר זה.
          </p>

          {regError && (
            <div style={{
              background: '#eef2fb', border: '1px solid #b8cbef',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
              color: 'var(--accent)', fontSize: '0.9rem', marginBottom: '16px'
            }}>
              {regError}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={fieldLabelStyle}>שם פרטי</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="הזן שם פרטי"
                autoFocus
                style={fieldInputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
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
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <button
              type="submit"
              disabled={regLoading}
              style={{
                background: regLoading ? '#aaa' : 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                color: '#fff',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '1.05rem',
                fontWeight: 700,
                marginTop: '4px',
                boxShadow: '0 4px 16px rgba(59,111,212,0.35)',
                transition: 'transform 0.1s'
              }}
              onMouseDown={e => { if (!regLoading) e.target.style.transform = 'scale(0.98)' }}
              onMouseUp={e => e.target.style.transform = 'scale(1)'}
            >
              {regLoading ? 'נרשם...' : 'הירשם והמשך →'}
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
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🏺</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>המחלבה</h1>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ color: 'var(--success)', fontSize: '1.4rem', fontWeight: 700, marginBottom: '10px' }}>
            הרכישה נרשמה בהצלחה!
          </h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>
            תודה {customer?.first_name}! הרכישות שלך נשמרו.
          </p>
          <div style={{
            background: '#e6f4ee', borderRadius: 'var(--radius-sm)',
            padding: '16px', marginBottom: '20px',
            fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)'
          }}>
            סה"כ ששולם: ₪{totalAmount.toFixed(2)}
          </div>
          <button
            onClick={() => {
              setQuantities({})
              setSubmitSuccess(false)
              setStage('event')
            }}
            style={{
              background: 'var(--primary)', color: '#fff',
              padding: '12px 28px', borderRadius: 'var(--radius-sm)',
              fontWeight: 700, fontSize: '1rem'
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
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🏺</div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 4px' }}>המחלבה</h1>
        {event && (
          <>
            <p style={{ opacity: 0.9, margin: '0 0 2px', fontSize: '1.1rem', fontWeight: 600 }}>{event.name}</p>
            <p style={{ opacity: 0.7, margin: 0, fontSize: '0.9rem' }}>
              {new Date(event.date).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </>
        )}
      </div>

      {/* Greeting */}
      <div style={{ ...cardStyle, paddingTop: '16px', paddingBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '1.2rem', fontWeight: 700
        }}>
          {customer?.first_name?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: 'var(--primary)' }}>
            שלום, {customer?.first_name} {customer?.last_name}
          </p>
          <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-light)' }}>
            בחר מוצרים והזן כמות
          </p>
        </div>
      </div>

      {/* Products */}
      <form onSubmit={handleSubmitPurchases}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          {event?.products?.map(product => {
            const qty = quantities[product.id] || ''
            const subtotal = (Number(qty) || 0) * product.price
            return (
              <div
                key={product.id}
                style={{
                  background: '#fff',
                  borderRadius: 'var(--radius)',
                  padding: '16px',
                  boxShadow: 'var(--shadow)',
                  border: qty > 0 ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'border-color 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary)' }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)', marginTop: '2px' }}>
                      ₪{product.price}
                    </div>
                    {qty > 0 && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600, marginTop: '2px' }}>
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
                        width: '36px', height: '36px',
                        borderRadius: '50%',
                        background: qty > 0 ? 'var(--accent)' : 'var(--bg)',
                        color: qty > 0 ? '#fff' : 'var(--text-light)',
                        border: 'none', fontSize: '1.3rem', fontWeight: 700,
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
                        width: '52px',
                        textAlign: 'center',
                        padding: '7px 4px',
                        border: '2px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        outline: 'none',
                        direction: 'ltr'
                      }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                    <button
                      type="button"
                      onClick={() => updateQty(product.id, (Number(qty) || 0) + 1)}
                      style={{
                        width: '36px', height: '36px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        color: '#fff',
                        border: 'none', fontSize: '1.3rem', fontWeight: 700,
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
          background: '#fff',
          borderRadius: 'var(--radius)',
          padding: '16px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1), var(--shadow)',
          border: '1px solid var(--border)'
        }}>
          {totalAmount > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '12px', padding: '10px 14px',
              background: '#e6f4ee', borderRadius: 'var(--radius-sm)'
            }}>
              <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1rem' }}>סה"כ לתשלום:</span>
              <span style={{ fontWeight: 800, color: 'var(--success)', fontSize: '1.2rem' }}>₪{totalAmount.toFixed(2)}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={submitLoading || totalAmount === 0}
            style={{
              width: '100%',
              background: totalAmount === 0 ? '#ddd' : submitLoading ? '#aaa' : 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
              color: '#fff',
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '1.05rem',
              fontWeight: 700,
              boxShadow: totalAmount > 0 ? '0 4px 16px rgba(59,111,212,0.3)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {submitLoading ? 'שומר...' : totalAmount === 0 ? 'בחר מוצרים' : `שלח הזמנה • ₪${totalAmount.toFixed(2)}`}
          </button>
        </div>
      </form>
    </div>
  )
}

// Styles
const pageStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(180deg, var(--primary) 0%, var(--primary-light) 120px, var(--bg) 120px)',
  padding: '0 0 100px'
}

const headerStyle = {
  padding: '28px 20px 24px',
  textAlign: 'center',
  color: '#fff'
}

const cardStyle = {
  background: '#fff',
  borderRadius: 'var(--radius)',
  padding: '24px',
  margin: '0 16px 16px',
  boxShadow: 'var(--shadow-lg)',
  animation: 'fadeIn 0.3s ease'
}

const fieldLabelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontWeight: 700,
  fontSize: '0.9rem',
  color: 'var(--text)'
}

const fieldInputStyle = {
  width: '100%',
  padding: '13px 15px',
  border: '2px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '1rem',
  background: '#fafafa',
  outline: 'none',
  transition: 'border-color 0.2s'
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
