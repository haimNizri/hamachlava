import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { eventsApi, productsApi, purchasesApi } from '../api'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal'
import ToastContainer, { showToast } from '../components/Toast'

const inputStyle = {
  width: '100%',
  padding: '10px 13px',
  border: '2px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.95rem',
  background: '#fafafa',
  outline: 'none'
}

export default function AdminEventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('products')

  // Modals
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showAddPurchase, setShowAddPurchase] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showEditEvent, setShowEditEvent] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  const [qrData, setQrData] = useState(null)
  const [qrLoading, setQrLoading] = useState(false)

  useEffect(() => {
    loadEvent()
  }, [id])

  async function loadEvent() {
    try {
      const data = await eventsApi.get(id)
      setEvent(data)
    } catch (err) {
      showToast(err.message, 'error')
      navigate('/admin')
    } finally {
      setLoading(false)
    }
  }

  async function loadQR() {
    setQrLoading(true)
    try {
      const baseUrl = window.location.origin
      const data = await eventsApi.getQR(id, baseUrl)
      setQrData(data)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setQrLoading(false)
    }
  }

  async function handleDeletePurchase(purchaseId) {
    if (!confirm('למחוק את הרכישה?')) return
    try {
      await purchasesApi.delete(purchaseId)
      showToast('הרכישה נמחקה', 'success')
      loadEvent()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleDeleteProduct(productId) {
    if (!confirm('למחוק את המוצר? כל הרכישות הקשורות ימחקו גם.')) return
    try {
      await productsApi.delete(productId)
      showToast('המוצר נמחק', 'success')
      loadEvent()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  async function handleExport() {
    try {
      await eventsApi.export(id)
      showToast('הקובץ הורד בהצלחה', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }


  function openQR() {
    setShowQR(true)
    loadQR()
  }

  function downloadQR() {
    if (!qrData?.qr) return
    const a = document.createElement('a')
    a.href = qrData.qr
    a.download = `qr_event_${id}.png`
    a.click()
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-light)' }}>
          טוען...
        </div>
      </div>
    )
  }

  if (!event) return null

  const totalRevenue = (event.purchases || []).reduce((s, p) => s + p.total_price, 0)
  const totalItems = (event.purchases || []).reduce((s, p) => s + p.quantity, 0)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <ToastContainer />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Back */}
        <button
          onClick={() => navigate('/admin')}
          style={{
            background: 'none', border: 'none', color: 'var(--text-light)',
            fontSize: '0.95rem', cursor: 'pointer', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '6px', padding: 0
          }}
        >
          ← חזרה לדשבורד
        </button>

        {/* Event Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
          borderRadius: 'var(--radius)',
          padding: '24px',
          color: '#fff',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>{event.name}</h1>
                <span style={{
                  background: event.is_active ? 'rgba(39,174,96,0.3)' : 'rgba(255,255,255,0.15)',
                  padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem',
                  border: `1px solid ${event.is_active ? 'rgba(39,174,96,0.5)' : 'rgba(255,255,255,0.3)'}`
                }}>
                  {event.is_active ? 'פעיל' : 'לא פעיל'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', opacity: 0.85, fontSize: '0.9rem' }}>
                <span>📅 {new Date(event.date).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                {event.expected_people && <span>👥 {event.expected_people} משתתפים</span>}
                {event.notes && <span>📝 {event.notes}</span>}
              </div>
            </div>
            <div className="mobile-scroll" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowEditEvent(true)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
                  padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem',
                  flexShrink: 0
                }}
              >
                עריכה
              </button>
              <button
                onClick={openQR}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
                  padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem',
                  flexShrink: 0
                }}
              >
                📱 QR קוד
              </button>
              <button
                onClick={handleExport}
                style={{
                  background: 'var(--success)',
                  color: '#fff', border: 'none',
                  padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', fontWeight: 600,
                  flexShrink: 0
                }}
              >
                📊 ייצוא Excel
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px', marginTop: '20px'
          }}>
            {[
              { label: 'הכנסות', value: `₪${totalRevenue.toFixed(0)}`, icon: '💰' },
              { label: 'פריטים', value: totalItems, icon: '🛍' },
              { label: 'עסקאות', value: (event.purchases || []).length, icon: '📋' },
              { label: 'מוצרים', value: (event.products || []).length, icon: '📦' }
            ].map((s, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.3rem' }}>{s.icon}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '4px',
          background: '#fff', borderRadius: 'var(--radius)',
          padding: '6px', boxShadow: 'var(--shadow)', marginBottom: '20px',
          overflowX: 'auto', flexWrap: 'nowrap',
          WebkitOverflowScrolling: 'touch'
        }}>
          {[
            { id: 'products', label: '📦 מוצרים', count: (event.products || []).length },
            { id: 'purchases', label: '🛍 רכישות', count: (event.purchases || []).length },
            { id: 'customers', label: '👥 סיכום לקוחות', count: Object.keys(groupByCustomer(event.purchases || [])).length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                flexShrink: 0,
                padding: '10px 16px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600, fontSize: '0.95rem',
                background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--text-light)',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
              <span style={{
                marginRight: '6px',
                background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : 'var(--bg)',
                padding: '1px 7px', borderRadius: '20px', fontSize: '0.8rem'
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
              <button
                onClick={() => setShowAddProduct(true)}
                style={{
                  background: 'var(--primary)', color: '#fff',
                  padding: '10px 20px', borderRadius: 'var(--radius-sm)',
                  fontWeight: 600, fontSize: '0.95rem'
                }}
              >
                + הוסף מוצר
              </button>
            </div>

            {event.products?.length === 0 ? (
              <EmptyState icon="📦" text="אין מוצרים לאירוע זה" />
            ) : (
              <div style={{
                background: '#fff', borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow)', overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
                      {['שם המוצר', 'מחיר', 'מלאי', 'נמכר', 'פעולות'].map(h => (
                        <th key={h} style={{
                          padding: '12px 16px', textAlign: 'right',
                          fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-light)'
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {event.products.map((product, i) => {
                      const soldQty = (event.purchases || [])
                        .filter(p => p.product_id === product.id)
                        .reduce((s, p) => s + p.quantity, 0)
                      return (
                        <tr key={product.id} style={{
                          borderBottom: i < event.products.length - 1 ? '1px solid var(--border)' : 'none',
                          transition: 'background 0.15s'
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                        >
                          <td style={{ padding: '14px 16px', fontWeight: 600 }}>{product.name}</td>
                          <td style={{ padding: '14px 16px', color: 'var(--success)', fontWeight: 700 }}>₪{product.price}</td>
                          <td style={{ padding: '14px 16px', color: 'var(--text-light)' }}>
                            {product.available_quantity ?? '∞'}
                          </td>
                          <td style={{ padding: '14px 16px' }}>{soldQty}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => setEditingProduct(product)}
                                style={{
                                  background: '#e8f0fe', color: 'var(--primary)',
                                  border: 'none', borderRadius: 'var(--radius-sm)',
                                  padding: '5px 12px', fontSize: '0.85rem', fontWeight: 600
                                }}
                              >
                                ערוך
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                style={{
                                  background: '#eef2fb', color: 'var(--accent)',
                                  border: 'none', borderRadius: 'var(--radius-sm)',
                                  padding: '5px 12px', fontSize: '0.85rem'
                                }}
                              >
                                מחק
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Purchases Tab */}
        {activeTab === 'purchases' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
              <button
                onClick={() => setShowAddPurchase(true)}
                style={{
                  background: 'var(--accent)', color: '#fff',
                  padding: '10px 20px', borderRadius: 'var(--radius-sm)',
                  fontWeight: 600, fontSize: '0.95rem'
                }}
              >
                + הוסף רכישה ידנית
              </button>
            </div>

            {event.purchases?.length === 0 ? (
              <EmptyState icon="🛍" text="אין רכישות לאירוע זה" />
            ) : (
              <div style={{
                background: '#fff', borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow)', overflow: 'hidden'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
                        {['לקוח', 'מוצר', 'כמות', 'סה"כ', 'נוסף על ידי', 'תאריך / שעה', ''].map(h => (
                          <th key={h} style={{
                            padding: '12px 14px', textAlign: 'right',
                            fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-light)'
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {event.purchases.map((purchase, i) => (
                        <tr key={purchase.id} style={{
                          borderBottom: i < event.purchases.length - 1 ? '1px solid var(--border)' : 'none'
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                        >
                          <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                            {purchase.customer_name || 'אנונימי'}
                          </td>
                          <td style={{ padding: '12px 14px' }}>{purchase.product_name}</td>
                          <td style={{ padding: '12px 14px' }}>{purchase.quantity}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--success)' }}>
                            ₪{purchase.total_price.toFixed(2)}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              background: purchase.added_by === 'admin' ? '#e8f0fe' : '#e6f4ee',
                              color: purchase.added_by === 'admin' ? 'var(--primary)' : 'var(--success)',
                              padding: '2px 8px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600
                            }}>
                              {purchase.added_by === 'admin' ? 'מנהל' : 'לקוח'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-light)', lineHeight: 1.5 }}>
                            <div>{new Date(purchase.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}</div>
                            <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                              {new Date(purchase.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <button
                              onClick={() => handleDeletePurchase(purchase.id)}
                              style={{
                                background: '#eef2fb', color: 'var(--accent)',
                                border: 'none', borderRadius: 'var(--radius-sm)',
                                padding: '4px 10px', fontSize: '0.83rem'
                              }}
                            >
                              מחק
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f8fffe', borderTop: '2px solid var(--border)' }}>
                        <td colSpan={2} style={{ padding: '12px 14px', fontWeight: 700 }}>סה"כ</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700 }}>{totalItems}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--success)' }}>
                          ₪{totalRevenue.toFixed(2)}
                        </td>
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Customers Summary Tab */}
        {activeTab === 'customers' && (
          <CustomerSummaryTab purchases={event.purchases || []} />
        )}
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <AddProductModal
          eventId={id}
          onClose={() => setShowAddProduct(false)}
          onSuccess={() => { setShowAddProduct(false); loadEvent() }}
        />
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSuccess={() => { setEditingProduct(null); loadEvent() }}
        />
      )}

      {/* Add Purchase Modal */}
      {showAddPurchase && (
        <AddPurchaseModal
          eventId={id}
          products={event.products || []}
          onClose={() => setShowAddPurchase(false)}
          onSuccess={() => { setShowAddPurchase(false); loadEvent() }}
        />
      )}

      {/* QR Code Modal */}
      {showQR && (
        <Modal title="קוד QR לאירוע" onClose={() => setShowQR(false)} maxWidth="380px">
          <div style={{ textAlign: 'center' }}>
            {qrLoading ? (
              <div style={{ padding: '40px', color: 'var(--text-light)' }}>
                יוצר קוד QR...
              </div>
            ) : qrData ? (
              <>
                <img
                  src={qrData.qr}
                  alt="QR Code"
                  style={{ width: '240px', height: '240px', borderRadius: '8px', border: '4px solid var(--primary)' }}
                />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: '12px 0', wordBreak: 'break-all' }}>
                  {qrData.url}
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button
                    onClick={downloadQR}
                    style={{
                      background: 'var(--primary)', color: '#fff',
                      padding: '10px 20px', borderRadius: 'var(--radius-sm)',
                      fontWeight: 600
                    }}
                  >
                    הורד תמונה
                  </button>
                  <a
                    href={qrData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'var(--bg)', color: 'var(--text)',
                      padding: '10px 20px', borderRadius: 'var(--radius-sm)',
                      fontWeight: 600, display: 'inline-block',
                      border: '1px solid var(--border)'
                    }}
                  >
                    פתח קישור
                  </a>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--accent)' }}>שגיאה ביצירת QR</div>
            )}
          </div>
        </Modal>
      )}

      {/* Edit Event Modal */}
      {showEditEvent && (
        <EditEventModal
          event={event}
          onClose={() => setShowEditEvent(false)}
          onSuccess={() => { setShowEditEvent(false); loadEvent() }}
        />
      )}
    </div>
  )
}

function EmptyState({ icon, text }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--radius)',
      padding: '60px 20px', textAlign: 'center',
      boxShadow: 'var(--shadow)'
    }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{icon}</div>
      <p style={{ color: 'var(--text-light)', fontSize: '1rem' }}>{text}</p>
    </div>
  )
}

function AddProductModal({ eventId, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', price: '', available_quantity: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.price) {
      showToast('שם ומחיר נדרשים', 'error'); return
    }
    setLoading(true)
    try {
      await productsApi.add(eventId, {
        name: form.name,
        price: Number(form.price),
        available_quantity: form.available_quantity ? Number(form.available_quantity) : null
      })
      showToast('המוצר נוסף', 'success')
      onSuccess()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="הוספת מוצר" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '0.9rem' }}>שם המוצר *</label>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="לדוגמה: בירה קלה" style={inputStyle} autoFocus />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '0.9rem' }}>מחיר ₪ *</label>
            <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              placeholder="0" min="0" step="0.5" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '0.9rem' }}>מלאי</label>
            <input type="number" value={form.available_quantity} onChange={e => setForm(f => ({ ...f, available_quantity: e.target.value }))}
              placeholder="ללא הגבלה" min="0" style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button type="button" onClick={onClose} style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', padding: '9px 20px', borderRadius: 'var(--radius-sm)' }}>
            ביטול
          </button>
          <button type="submit" disabled={loading} style={{ background: 'var(--primary)', color: '#fff', padding: '9px 24px', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
            {loading ? 'שומר...' : 'הוסף'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function EditProductModal({ product, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: product.name,
    price: product.price,
    available_quantity: product.available_quantity ?? ''
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await productsApi.update(product.id, {
        name: form.name,
        price: Number(form.price),
        available_quantity: form.available_quantity !== '' ? Number(form.available_quantity) : null
      })
      showToast('המוצר עודכן', 'success')
      onSuccess()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="עריכת מוצר" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '0.9rem' }}>שם המוצר</label>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} autoFocus />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '0.9rem' }}>מחיר ₪</label>
            <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} min="0" step="0.5" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '0.9rem' }}>מלאי</label>
            <input type="number" value={form.available_quantity} onChange={e => setForm(f => ({ ...f, available_quantity: e.target.value }))} placeholder="ללא הגבלה" min="0" style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button type="button" onClick={onClose} style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', padding: '9px 20px', borderRadius: 'var(--radius-sm)' }}>ביטול</button>
          <button type="submit" disabled={loading} style={{ background: 'var(--primary)', color: '#fff', padding: '9px 24px', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
            {loading ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function AddPurchaseModal({ eventId, products, onClose, onSuccess }) {
  const [form, setForm] = useState({
    customer_name: '',
    product_id: products[0]?.id || '',
    quantity: 1
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.customer_name || !form.product_id || !form.quantity) {
      showToast('כל השדות נדרשים', 'error'); return
    }
    setLoading(true)
    try {
      await purchasesApi.addAsAdmin({
        event_id: Number(eventId),
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
        customer_name: form.customer_name
      })
      showToast('הרכישה נוספה', 'success')
      onSuccess()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="הוספת רכישה ידנית" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '0.9rem' }}>שם הלקוח *</label>
          <input type="text" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
            placeholder="הזן שם לקוח" style={inputStyle} autoFocus />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '0.9rem' }}>מוצר *</label>
          <select value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}
            style={{ ...inputStyle, cursor: 'pointer' }}>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} (₪{p.price})</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '0.9rem' }}>כמות *</label>
          <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
            min="1" style={inputStyle} />
        </div>
        {form.product_id && form.quantity && (
          <div style={{ background: '#e6f4ee', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', color: 'var(--success)', fontWeight: 600 }}>
            סה"כ: ₪{((products.find(p => p.id === Number(form.product_id))?.price || 0) * form.quantity).toFixed(2)}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button type="button" onClick={onClose} style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', padding: '9px 20px', borderRadius: 'var(--radius-sm)' }}>ביטול</button>
          <button type="submit" disabled={loading} style={{ background: 'var(--accent)', color: '#fff', padding: '9px 24px', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
            {loading ? 'שומר...' : 'הוסף רכישה'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function EditEventModal({ event, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: event.name,
    date: event.date,
    expected_people: event.expected_people || '',
    notes: event.notes || '',
    is_active: event.is_active
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await eventsApi.update(event.id, {
        ...form,
        expected_people: form.expected_people ? Number(form.expected_people) : null,
        is_active: form.is_active ? 1 : 0
      })
      showToast('האירוע עודכן', 'success')
      onSuccess()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="עריכת אירוע" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '0.9rem' }}>שם האירוע</label>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} autoFocus />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '0.9rem' }}>תאריך</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '0.9rem' }}>משתתפים</label>
            <input type="number" value={form.expected_people} onChange={e => setForm(f => ({ ...f, expected_people: e.target.value }))} min="1" style={inputStyle} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '0.9rem' }}>הערות</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600 }}>
          <input type="checkbox" checked={!!form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked ? 1 : 0 }))} style={{ width: '18px', height: '18px' }} />
          אירוע פעיל
        </label>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button type="button" onClick={onClose} style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', padding: '9px 20px', borderRadius: 'var(--radius-sm)' }}>ביטול</button>
          <button type="submit" disabled={loading} style={{ background: 'var(--primary)', color: '#fff', padding: '9px 24px', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
            {loading ? 'שומר...' : 'שמור שינויים'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function groupByCustomer(purchases) {
  const map = {}
  for (const p of purchases) {
    const key = p.customer_name || 'אנונימי'
    if (!map[key]) map[key] = { purchases: [], sessions: new Set() }
    map[key].purchases.push(p)
    if (p.session_id) map[key].sessions.add(p.session_id)
  }
  return map
}

// ─── Customer Summary Tab ─────────────────────────────────────────────────────

function CustomerSummaryTab({ purchases }) {
  const byCustomer = groupByCustomer(purchases)
  const customers = Object.entries(byCustomer).map(([name, data]) => {
    const totalQty = data.purchases.reduce((s, p) => s + p.quantity, 0)
    const totalPaid = data.purchases.reduce((s, p) => s + p.total_price, 0)
    const visits = data.sessions.size || 1
    const lastVisit = data.purchases.reduce((latest, p) =>
      new Date(p.created_at) > new Date(latest) ? p.created_at : latest,
      data.purchases[0].created_at
    )
    const bySess = {}
    for (const p of data.purchases) {
      const sid = p.session_id || ('_' + p.created_at)
      if (!bySess[sid]) bySess[sid] = { time: p.created_at, items: [] }
      bySess[sid].items.push(p)
    }
    return { name, totalQty, totalPaid, visits, lastVisit, sessions: Object.values(bySess) }
  }).sort((a, b) => b.totalPaid - a.totalPaid)

  if (customers.length === 0) {
    return (
      <div style={{
        background: '#fff', borderRadius: 'var(--radius)', padding: '60px 20px',
        textAlign: 'center', boxShadow: 'var(--shadow)', color: 'var(--text-light)'
      }}>
        אין רכישות לאירוע זה
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {customers.map(c => (
        <CustomerCard key={c.name} customer={c} />
      ))}
    </div>
  )
}

function CustomerCard({ customer: c }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow)', overflow: 'hidden'
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', cursor: 'pointer', gap: '12px',
          borderRight: '4px solid var(--accent)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: '1rem'
          }}>
            {c.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>{c.name}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginTop: '2px' }}>
              ביקר {c.visits} {c.visits === 1 ? 'פעם' : 'פעמים'} ·{' '}
              ביקור אחרון: {new Date(c.lastVisit).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}{' '}
              {new Date(c.lastVisit).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1.1rem' }}>{c.totalQty}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>פריטים</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.1rem' }}>₪{c.totalPaid.toFixed(0)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>סה"כ</div>
          </div>
          <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
        </div>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '0 20px 16px' }}>
          {c.sessions.map((sess, i) => (
            <div key={i} style={{ marginTop: '14px' }}>
              <div style={{
                fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)',
                marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <span>ביקור {i + 1}</span>
                <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>
                  {new Date(sess.time).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {sess.items.map((item, j) => (
                  <div key={j} style={{
                    background: 'var(--bg)', borderRadius: 'var(--radius-sm)',
                    padding: '6px 12px', fontSize: '0.875rem',
                    display: 'flex', gap: '8px', alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: 600 }}>{item.product_name}</span>
                    <span style={{ color: 'var(--text-light)' }}>×{item.quantity}</span>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>₪{item.total_price.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
