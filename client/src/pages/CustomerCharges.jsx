import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { customersApi } from '../api'

const CUSTOMER_KEY = 'hamachlava_customer'

function getStoredCustomer() {
  try {
    const raw = localStorage.getItem(CUSTOMER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function monthLabel(ym) {
  const [y, m] = ym.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('he-IL', { year: 'numeric', month: 'long' })
}

function dayLabel(ymd) {
  const [y, m, d] = ymd.split('-')
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function CustomerCharges() {
  const navigate = useNavigate()
  const [stage, setStage] = useState('loading') // loading | ready | error | noauth
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const stored = getStoredCustomer()

  useEffect(() => {
    if (!stored?.token) { setStage('noauth'); return }
    load()
  }, [])

  async function load() {
    try {
      const res = await customersApi.myCharges()
      setData(res)
      setStage('ready')
    } catch (err) {
      setError(err.message || 'שגיאה בטעינת החיובים')
      setStage('error')
    }
  }

  const currentMonth = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' }).slice(0, 7)
  const thisMonth = data?.monthly?.find(m => m.month === currentMonth)

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          המחלבה
        </h1>
        <p style={{ opacity: 0.7, margin: '4px 0 0', fontSize: '0.9rem' }}>החיובים שלי</p>
      </div>

      {stage === 'loading' && (
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7a99', fontSize: '0.9rem' }}>טוען...</div>
        </div>
      )}

      {stage === 'noauth' && (
        <div style={cardStyle}>
          <p style={{ color: '#6b7a99', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
            יש להירשם דרך אירוע כדי לראות את החיובים שלך.
          </p>
        </div>
      )}

      {stage === 'error' && (
        <div style={cardStyle}>
          <h2 style={{ color: '#c0392b', marginBottom: '8px', fontSize: '1.1rem', textAlign: 'center' }}>שגיאה</h2>
          <p style={{ color: '#6b7a99', fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>
        </div>
      )}

      {stage === 'ready' && (
        <>
          {/* Summary */}
          <div style={{ ...cardStyle, display: 'flex', gap: '10px' }}>
            <SummaryTile label="החודש" value={`₪${(thisMonth?.total || 0).toFixed(2)}`} sub={monthLabel(currentMonth)} highlight />
            <SummaryTile label={'סה"כ מצטבר'} value={`₪${(data.grandTotal || 0).toFixed(2)}`} />
          </div>

          {data.daily.length === 0 ? (
            <div style={cardStyle}>
              <p style={{ color: '#6b7a99', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
                אין עדיין חיובים.
              </p>
            </div>
          ) : (
            <>
              {/* Monthly breakdown */}
              {data.monthly.length > 1 && (
                <div style={cardStyle}>
                  <h3 style={sectionTitleStyle}>לפי חודש</h3>
                  {data.monthly.map(m => (
                    <div key={m.month} style={rowStyle}>
                      <span style={{ color: '#1a2332', fontWeight: 600, fontSize: '0.9rem' }}>{monthLabel(m.month)}</span>
                      <span style={{ color: '#1a2332', fontWeight: 700 }}>₪{m.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Daily breakdown with items */}
              <div style={cardStyle}>
                <h3 style={sectionTitleStyle}>לפי יום</h3>
                {data.daily.map(day => (
                  <div key={day.date} style={{ marginBottom: '18px' }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginBottom: '8px', paddingBottom: '6px', borderBottom: '1.5px solid #e0e6ed'
                    }}>
                      <span style={{ fontWeight: 700, color: '#1a2332', fontSize: '0.9rem' }}>{dayLabel(day.date)}</span>
                      <span style={{ fontWeight: 700, color: '#1a2332' }}>₪{day.total.toFixed(2)}</span>
                    </div>
                    {day.items.map((it, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                        padding: '4px 0', fontSize: '0.85rem'
                      }}>
                        <span style={{ color: '#1a2332' }}>
                          {it.product_name}
                          <span style={{ color: '#6b7a99' }}> × {it.quantity}</span>
                          {it.event_name && <span style={{ color: '#8ca8bb', fontSize: '0.78rem' }}> · {it.event_name}</span>}
                        </span>
                        <span style={{ color: '#6b7a99', flexShrink: 0, marginRight: '8px' }}>₪{Number(it.total_price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div style={{ padding: '4px 16px 24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: '100%', background: '#f8fafc', color: '#1a2332',
            border: '1.5px solid #e0e6ed', borderRadius: '2px',
            padding: '12px', fontWeight: 700, fontSize: '0.9rem'
          }}
        >
          ← חזרה
        </button>
      </div>
    </div>
  )
}

function SummaryTile({ label, value, sub, highlight }) {
  return (
    <div style={{
      flex: 1, textAlign: 'center', padding: '14px 8px', borderRadius: '4px',
      background: highlight ? 'linear-gradient(135deg, #3b6fd4, #2a5bb8)' : '#f0f2f5',
      color: highlight ? '#f0f2f5' : '#1a2332'
    }}>
      <div style={{ fontSize: '0.72rem', opacity: 0.8, letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 800, margin: '4px 0 2px' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{sub}</div>}
    </div>
  )
}

const pageStyle = {
  minHeight: '100vh',
  background: '#f0f2f5',
  paddingBottom: '20px'
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
  padding: '20px',
  margin: '16px 16px 0',
  border: '1px solid #e0e6ed'
}

const sectionTitleStyle = {
  fontSize: '0.72rem',
  fontWeight: 700,
  color: '#6b7a99',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: '14px'
}

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
  borderBottom: '1px solid #eef1f5'
}
