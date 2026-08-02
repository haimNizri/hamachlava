import { useState, useEffect } from 'react'
import { reportsApi } from '../api'
import Navbar from '../components/Navbar'
import ToastContainer, { showToast } from '../components/Toast'

function monthLabel(ym) {
  if (!ym) return ''
  const [y, m] = ym.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('he-IL', { year: 'numeric', month: 'long' })
}

export default function AdminMonthlyReport() {
  const [month, setMonth] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [exporting, setExporting] = useState(false)

  useEffect(() => { load(month) }, [])

  async function load(m) {
    setLoading(true)
    try {
      const res = await reportsApi.monthly(m)
      setData(res)
      setMonth(res.month)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function onMonthChange(e) {
    const m = e.target.value
    setMonth(m)
    setExpanded({})
    load(m)
  }

  function toggle(key) {
    setExpanded(x => ({ ...x, [key]: !x[key] }))
  }

  async function handleExport() {
    setExporting(true)
    try {
      await reportsApi.exportMonthly(month)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Navbar />
      <ToastContainer />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '24px', flexWrap: 'wrap', gap: '12px'
        }}>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1a2332', margin: 0 }}>חיובים חודשיים</h1>
            <p style={{ color: '#6b7a99', fontSize: '0.85rem', marginTop: '4px' }}>סיכום חיובים לכל לקוח לפי חודש</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="month"
              value={month}
              onChange={onMonthChange}
              style={{
                padding: '9px 12px', border: '1.5px solid #e0e6ed', borderRadius: '4px',
                fontSize: '0.9rem', background: '#f8fafc', color: '#1a2332'
              }}
            />
            <button
              onClick={handleExport}
              disabled={exporting || !data || data.customers.length === 0}
              style={{
                background: (exporting || !data || data.customers.length === 0) ? '#c8d0dc' : 'linear-gradient(135deg, #1a7a4a, #15613b)',
                color: '#f0f2f5', border: 'none', borderRadius: '4px',
                padding: '9px 16px', fontSize: '0.85rem', fontWeight: 700,
                cursor: (exporting || !data || data.customers.length === 0) ? 'default' : 'pointer'
              }}
            >
              {exporting ? 'מייצא...' : '⬇ ייצוא לאקסל'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6b7a99' }}>טוען...</div>
        ) : !data || data.customers.length === 0 ? (
          <div style={{
            background: '#f8fafc', border: '1px solid #e0e6ed', boxShadow: '0 1px 6px rgba(19,31,46,0.06)',
            padding: '50px 20px', textAlign: 'center', borderRadius: '4px'
          }}>
            <h3 style={{ color: '#1a2332', marginBottom: '6px', fontWeight: 600 }}>אין חיובים בחודש זה</h3>
            <p style={{ color: '#6b7a99', fontSize: '0.9rem' }}>{monthLabel(month)}</p>
          </div>
        ) : (
          <>
            {/* Totals */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '12px', marginBottom: '24px'
            }}>
              {[
                { label: 'סה"כ חיובים', value: `₪${Number(data.grandTotal).toFixed(0)}` },
                { label: 'לקוחות', value: data.customers.length },
                { label: 'פריטים', value: data.grandItems }
              ].map((s, i) => (
                <div key={i} style={{
                  background: '#f8fafc', border: '1px solid #e0e6ed', boxShadow: '0 1px 6px rgba(19,31,46,0.06)',
                  padding: '18px', borderRadius: '4px'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a2332' }}>{s.value}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7a99', marginTop: '4px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Per-customer list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.customers.map((c, idx) => {
                const key = c.customer_id != null ? `id:${c.customer_id}` : `name:${c.name}:${idx}`
                const isOpen = !!expanded[key]
                return (
                  <div key={key} style={{
                    background: '#f8fafc', border: '1px solid #e0e6ed', boxShadow: '0 1px 6px rgba(19,31,46,0.06)',
                    borderRadius: '4px', overflow: 'hidden'
                  }}>
                    <div
                      onClick={() => toggle(key)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 18px', cursor: 'pointer', gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <span style={{
                          color: '#6b7a99', fontSize: '0.8rem', transition: 'transform 0.15s',
                          transform: isOpen ? 'rotate(90deg)' : 'none', display: 'inline-block'
                        }}>▶</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: '#1a2332', fontSize: '0.95rem' }}>{c.name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#6b7a99' }}>{c.item_count} פריטים</div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 800, color: '#1a2332', fontSize: '1.05rem', flexShrink: 0 }}>
                        ₪{c.total.toFixed(2)}
                      </span>
                    </div>

                    {isOpen && (
                      <div style={{ borderTop: '1px solid #e0e6ed', padding: '10px 18px 14px', background: '#f0f2f5' }}>
                        {c.products.map((p, i) => (
                          <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                            padding: '5px 0', fontSize: '0.85rem'
                          }}>
                            <span style={{ color: '#1a2332' }}>
                              {p.product_name}<span style={{ color: '#6b7a99' }}> × {p.quantity}</span>
                            </span>
                            <span style={{ color: '#6b7a99' }}>₪{p.total.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
