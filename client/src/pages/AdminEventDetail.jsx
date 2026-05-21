import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { eventsApi, productsApi, purchasesApi, customersApi } from '../api'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal'
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

  async function handleDeleteCustomer(customerName) {
    if (!confirm(`להסיר את ${customerName} מהאירוע? כל הרכישות שלהם יימחקו.`)) return
    try {
      await eventsApi.removeCustomerFromEvent(id, customerName)
      showToast('הלקוח הוסר מהאירוע', 'success')
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
      <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '80px', color: '#6b7a99' }}>
          טוען...
        </div>
      </div>
    )
  }

  if (!event) return null

  const totalRevenue = (event.purchases || []).reduce((s, p) => s + p.total_price, 0)
  const totalItems = (event.purchases || []).reduce((s, p) => s + p.quantity, 0)

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Navbar />
      <ToastContainer />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '28px 16px' }}>
        {/* Back */}
        <button
          onClick={() => navigate('/admin')}
          style={{
            background: 'none', border: 'none', color: '#6b7a99',
            fontSize: '0.85rem', cursor: 'pointer', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '6px', padding: 0,
            letterSpacing: '0.02em'
          }}
        >
          ← חזרה לדשבורד
        </button>

        {/* Event Header */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e0e6ed',
          borderRadius: '4px',
          padding: '24px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#1a2332' }}>{event.name}</h1>
                <span style={{
                  fontSize: '0.7rem', letterSpacing: '0.05em', fontWeight: 600,
                  padding: '2px 8px', borderRadius: '2px',
                  background: event.is_active ? '#e8f5ee' : '#f0f2f5',
                  color: event.is_active ? '#1a7a4a' : '#6b7a99'
                }}>
                  {event.is_active ? 'פעיל' : 'לא פעיל'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: '#6b7a99', fontSize: '0.85rem' }}>
                <span>{new Date(event.date).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                {event.expected_people && <span>{event.expected_people} משתתפים</span>}
                {event.notes && <span>{event.notes}</span>}
              </div>
            </div>
            <div className="mobile-scroll" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowEditEvent(true)}
                style={{
                  background: '#f8fafc', color: '#1a2332',
                  border: '1px solid #e0e6ed',
                  padding: '7px 14px', borderRadius: '2px', fontSize: '0.82rem',
                  flexShrink: 0
                }}
              >
                עריכה
              </button>
              <button
                onClick={openQR}
                style={{
                  background: '#f8fafc', color: '#1a2332',
                  border: '1px solid #e0e6ed',
                  padding: '7px 14px', borderRadius: '2px', fontSize: '0.82rem',
                  flexShrink: 0
                }}
              >
                QR קוד
              </button>
              <button
                onClick={handleExport}
                style={{
                  background: 'linear-gradient(135deg, #3b6fd4, #2a5bb8)', color: '#f0f2f5', border: 'none',
                  padding: '7px 14px', borderRadius: '2px', fontSize: '0.82rem', fontWeight: 600,
                  flexShrink: 0, letterSpacing: '0.04em'
                }}
              >
                ייצוא Excel
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: '10px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e0e6ed'
          }}>
            {[
              { label: 'הכנסות', value: `₪${totalRevenue.toFixed(0)}` },
              { label: 'פריטים', value: totalItems },
              { label: 'עסקאות', value: (event.purchases || []).length },
              { label: 'מוצרים', value: (event.products || []).length }
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '10px' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a2332' }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7a99', marginTop: '2px', letterSpacing: '0.03em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #e0e6ed',
          marginBottom: '20px',
          overflowX: 'auto', flexWrap: 'nowrap',
          WebkitOverflowScrolling: 'touch'
        }}>
          {[
            { id: 'products', label: 'מוצרים', count: (event.products || []).length },
            { id: 'purchases', label: 'רכישות', count: (event.purchases || []).length },
            { id: 'customers', label: 'לקוחות', count: Object.keys(groupByCustomer(event.purchases || [])).length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flexShrink: 0,
                padding: '10px 20px',
                fontWeight: activeTab === tab.id ? 700 : 400,
                fontSize: '0.88rem',
                background: 'transparent',
                color: activeTab === tab.id ? '#1a2332' : '#6b7a99',
                borderBottom: activeTab === tab.id ? '2px solid #3b6fd4' : '2px solid transparent',
                marginBottom: '-2px',
                letterSpacing: '0.02em',
                transition: 'color 0.15s'
              }}
            >
              {tab.label}
              <span style={{
                marginRight: '6px', marginLeft: '0',
                background: '#f0f2f5',
                color: '#6b7a99',
                padding: '1px 6px', borderRadius: '10px', fontSize: '0.75rem'
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
                  background: 'linear-gradient(135deg, #3b6fd4, #2a5bb8)', color: '#f0f2f5',
                  padding: '9px 18px', borderRadius: '2px',
                  fontWeight: 600, fontSize: '0.82rem', letterSpacing: '0.04em'
                }}
              >
                + הוסף מוצר
              </button>
            </div>

            {event.products?.length === 0 ? (
              <EmptyState text="אין מוצרים לאירוע זה" />
            ) : (
              <div style={{ background: '#f8fafc', border: '1px solid #e0e6ed', borderRadius: '4px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f0f2f5', borderBottom: '1px solid #e0e6ed' }}>
                      {['שם המוצר', 'מחיר', 'מלאי', 'נמכר', 'פעולות'].map(h => (
                        <th key={h} style={{
                          padding: '11px 16px', textAlign: 'right',
                          fontSize: '0.75rem', fontWeight: 700, color: '#6b7a99',
                          letterSpacing: '0.06em', textTransform: 'uppercase'
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
                          borderBottom: i < event.products.length - 1 ? '1px solid #e0e6ed' : 'none'
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f0f2f5'}
                          onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                        >
                          <td style={{ padding: '13px 16px', fontWeight: 600, color: '#1a2332' }}>{product.name}</td>
                          <td style={{ padding: '13px 16px', color: '#1a2332', fontWeight: 700 }}>₪{product.price}</td>
                          <td style={{ padding: '13px 16px', color: '#6b7a99' }}>
                            {product.available_quantity ?? '∞'}
                          </td>
                          <td style={{ padding: '13px 16px', color: '#1a2332' }}>{soldQty}</td>
                          <td style={{ padding: '13px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => setEditingProduct(product)}
                                style={{
                                  background: '#f8fafc', color: '#1a2332',
                                  border: '1px solid #e0e6ed', borderRadius: '2px',
                                  padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600
                                }}
                              >
                                ערוך
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                style={{
                                  background: '#fff', color: '#c0392b',
                                  border: '1px solid #f0c0c0', borderRadius: '2px',
                                  padding: '4px 12px', fontSize: '0.8rem'
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
                  background: 'linear-gradient(135deg, #3b6fd4, #2a5bb8)', color: '#f0f2f5',
                  padding: '9px 18px', borderRadius: '2px',
                  fontWeight: 600, fontSize: '0.82rem', letterSpacing: '0.04em'
                }}
              >
                + הוסף רכישה ידנית
              </button>
            </div>

            {event.purchases?.length === 0 ? (
              <EmptyState text="אין רכישות לאירוע זה" />
            ) : (
              <div style={{ background: '#f8fafc', border: '1px solid #e0e6ed', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ background: '#f0f2f5', borderBottom: '1px solid #e0e6ed' }}>
                        {['לקוח', 'מוצר', 'כמות', 'סה"כ', 'מקור', 'תאריך / שעה', ''].map(h => (
                          <th key={h} style={{
                            padding: '11px 14px', textAlign: 'right',
                            fontSize: '0.75rem', fontWeight: 700, color: '#6b7a99',
                            letterSpacing: '0.06em', textTransform: 'uppercase'
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {event.purchases.map((purchase, i) => (
                        <tr key={purchase.id} style={{
                          borderBottom: i < event.purchases.length - 1 ? '1px solid #e0e6ed' : 'none'
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f0f2f5'}
                          onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                        >
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1a2332' }}>
                            {purchase.customer_name || 'אנונימי'}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#1a2332' }}>{purchase.product_name}</td>
                          <td style={{ padding: '12px 14px', color: '#1a2332' }}>{purchase.quantity}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1a2332' }}>
                            ₪{purchase.total_price.toFixed(2)}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              background: '#f0f2f5',
                              color: '#6b7a99',
                              padding: '2px 8px', borderRadius: '2px', fontSize: '0.75rem', fontWeight: 600,
                              letterSpacing: '0.03em'
                            }}>
                              {purchase.added_by === 'admin' ? 'מנהל' : 'לקוח'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#6b7a99', lineHeight: 1.5 }}>
                            <div>{new Date(purchase.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}</div>
                            <div style={{ fontWeight: 600, color: '#1a2332' }}>
                              {new Date(purchase.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <button
                              onClick={() => handleDeletePurchase(purchase.id)}
                              style={{
                                background: '#fff', color: '#c0392b',
                                border: '1px solid #f0c0c0', borderRadius: '2px',
                                padding: '4px 10px', fontSize: '0.78rem'
                              }}
                            >
                              מחק
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f0f2f5', borderTop: '1px solid #e0e6ed' }}>
                        <td colSpan={2} style={{ padding: '11px 14px', fontWeight: 700, color: '#1a2332' }}>סה"כ</td>
                        <td style={{ padding: '11px 14px', fontWeight: 700, color: '#1a2332' }}>{totalItems}</td>
                        <td style={{ padding: '11px 14px', fontWeight: 700, color: '#1a2332' }}>
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
          <CustomerSummaryTab purchases={event.purchases || []} onDeleteCustomer={handleDeleteCustomer} />
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
        <Modal title="קוד QR לאירוע" onClose={() => setShowQR(false)} maxWidth="360px">
          <div style={{ textAlign: 'center' }}>
            {qrLoading ? (
              <div style={{ padding: '40px', color: '#6b7a99', fontSize: '0.9rem' }}>
                יוצר קוד QR...
              </div>
            ) : qrData ? (
              <>
                <img
                  src={qrData.qr}
                  alt="QR Code"
                  style={{ width: '220px', height: '220px', border: '1px solid #e8e8e8' }}
                />
                <p style={{ fontSize: '0.78rem', color: '#6b7a99', margin: '12px 0', wordBreak: 'break-all' }}>
                  {qrData.url}
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button
                    onClick={downloadQR}
                    style={{
                      background: 'linear-gradient(135deg, #3b6fd4, #2a5bb8)', color: '#f0f2f5',
                      padding: '9px 18px', borderRadius: '2px',
                      fontWeight: 600, fontSize: '0.85rem'
                    }}
                  >
                    הורד תמונה
                  </button>
                  <a
                    href={qrData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#f8fafc', color: '#1a2332',
                      padding: '9px 18px', borderRadius: '2px',
                      fontWeight: 600, display: 'inline-block',
                      border: '1px solid #e0e6ed', fontSize: '0.85rem',
                      textDecoration: 'none'
                    }}
                  >
                    פתח קישור
                  </a>
                </div>
              </>
            ) : (
              <div style={{ color: '#c0392b', fontSize: '0.9rem' }}>שגיאה ביצירת QR</div>
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

function EmptyState({ text }) {
  return (
    <div style={{
      background: '#f8fafc', border: '1px solid #e0e6ed',
      borderRadius: '4px', padding: '60px 20px', textAlign: 'center'
    }}>
      <p style={{ color: '#6b7a99', fontSize: '0.9rem' }}>{text}</p>
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
          <button type="button" onClick={onClose} style={{ background: '#f8fafc', color: '#1a2332', border: '1px solid #e0e6ed', padding: '9px 20px', borderRadius: '2px' }}>
            ביטול
          </button>
          <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #3b6fd4, #2a5bb8)', color: '#f0f2f5', padding: '9px 24px', borderRadius: '2px', fontWeight: 700 }}>
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
          <button type="button" onClick={onClose} style={{ background: '#f8fafc', color: '#1a2332', border: '1px solid #e0e6ed', padding: '9px 20px', borderRadius: '2px' }}>ביטול</button>
          <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #3b6fd4, #2a5bb8)', color: '#f0f2f5', padding: '9px 24px', borderRadius: '2px', fontWeight: 700 }}>
            {loading ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function AddPurchaseModal({ eventId, products, onClose, onSuccess }) {
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [allCustomers, setAllCustomers] = useState([])
  const [customersLoading, setCustomersLoading] = useState(true)
  const [filterQuery, setFilterQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [quantities, setQuantities] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    customersApi.listByEvent(eventId)
      .then(setAllCustomers)
      .catch(() => setAllCustomers([]))
      .finally(() => setCustomersLoading(false))
  }, [eventId])

  const filteredCustomers = allCustomers.filter(c =>
    (c.customer_name || '').toLowerCase().includes(filterQuery.toLowerCase())
  )

  const customerName = isNewCustomer
    ? newCustomerName.trim()
    : selectedCustomer ? selectedCustomer.customer_name : ''

  function setQty(productId, val) {
    const num = parseInt(val) || 0
    setQuantities(q => ({ ...q, [productId]: num > 0 ? num : '' }))
  }

  const entries = Object.entries(quantities).filter(([, qty]) => Number(qty) > 0)
  const total = entries.reduce((sum, [pid, qty]) => {
    const price = products.find(p => p.id === Number(pid))?.price || 0
    return sum + price * Number(qty)
  }, 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!customerName) { showToast('נא לבחור או להזין שם לקוח', 'error'); return }
    if (entries.length === 0) { showToast('יש לבחור לפחות מוצר אחד', 'error'); return }
    setLoading(true)
    const session_id = crypto.randomUUID()
    const customer_id = !isNewCustomer && selectedCustomer ? selectedCustomer.customer_id : null
    try {
      for (const [pid, qty] of entries) {
        await purchasesApi.addAsAdmin({
          event_id: Number(eventId),
          product_id: Number(pid),
          quantity: Number(qty),
          customer_name: customerName,
          customer_id,
          session_id
        })
      }
      showToast('הרכישה נוספה בהצלחה', 'success')
      onSuccess()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="הוספת רכישה ידנית" onClose={onClose} maxWidth="500px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* Customer section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <label style={modalLabel}>לקוח *</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontSize: '0.85rem', color: '#6b7a99' }}>
              <input
                type="checkbox"
                checked={isNewCustomer}
                onChange={e => { setIsNewCustomer(e.target.checked); setSelectedCustomer(null); setNewCustomerName('') }}
                style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#3b6fd4' }}
              />
              לקוח חדש
            </label>
          </div>

          {!isNewCustomer ? (
            <div>
              {/* Search filter */}
              <input
                type="text"
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                placeholder="חפש לפי שם..."
                style={{ ...inputStyle, marginBottom: '8px' }}
                onFocus={e => e.target.style.borderColor = '#3b6fd4'}
                onBlur={e => e.target.style.borderColor = '#e0e6ed'}
                autoComplete="off"
              />
              {/* Customer list */}
              <div style={{
                border: '1.5px solid #e0e6ed', borderRadius: '6px',
                maxHeight: '180px', overflowY: 'auto',
                background: '#fff'
              }}>
                {customersLoading ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#6b7a99', fontSize: '0.85rem' }}>טוען לקוחות...</div>
                ) : filteredCustomers.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#6b7a99', fontSize: '0.85rem' }}>
                    {filterQuery ? 'לא נמצאו לקוחות' : 'אין לקוחות רשומים'}
                  </div>
                ) : filteredCustomers.map(c => {
                  const isSelected = selectedCustomer?.customer_name === c.customer_name
                  return (
                    <div
                      key={c.customer_name}
                      onClick={() => setSelectedCustomer(c)}
                      style={{
                        padding: '10px 14px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        borderBottom: '1px solid #f0f2f5',
                        background: isSelected ? '#eef3fc' : '#fff',
                        transition: 'background 0.1s'
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#fff' }}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                        background: isSelected ? '#3b6fd4' : '#e0e6ed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isSelected ? '#fff' : '#6b7a99',
                        fontSize: '0.8rem', fontWeight: 700
                      }}>
                        {(c.customer_name || '?')[0]}
                      </div>
                      <span style={{ fontWeight: isSelected ? 700 : 500, color: '#1a2332', fontSize: '0.9rem' }}>
                        {c.customer_name}
                      </span>
                      {isSelected && (
                        <span style={{ marginRight: 'auto', color: '#3b6fd4', fontSize: '0.8rem', fontWeight: 700 }}>✓ נבחר</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <input
              type="text"
              value={newCustomerName}
              onChange={e => setNewCustomerName(e.target.value)}
              placeholder="הזן שם לקוח חדש"
              autoFocus
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#3b6fd4'}
              onBlur={e => e.target.style.borderColor = '#e0e6ed'}
            />
          )}

          {customerName && (
            <p style={{ fontSize: '0.78rem', color: '#6b7a99', marginTop: '6px' }}>
              לקוח שנבחר: <strong style={{ color: '#1a2332' }}>{customerName}</strong>
            </p>
          )}
        </div>

        {/* Products list */}
        <div>
          <label style={modalLabel}>מוצרים</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {products.map(p => {
              const qty = quantities[p.id] || ''
              const subtotal = (Number(qty) || 0) * p.price
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: qty > 0 ? '#eef3fc' : '#f8fafc',
                  border: `1.5px solid ${qty > 0 ? '#3b6fd4' : '#e0e6ed'}`,
                  borderRadius: '6px', gap: '12px',
                  transition: 'border-color 0.15s, background 0.15s'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a2332' }}>{p.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7a99' }}>
                      ₪{p.price} ליחידה
                      {qty > 0 && <span style={{ color: '#3b6fd4', fontWeight: 700, marginRight: '8px' }}>= ₪{subtotal.toFixed(2)}</span>}
                    </div>
                  </div>
                  {/* Stepper */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button type="button"
                      onClick={() => setQty(p.id, Math.max(0, (Number(qty) || 0) - 1))}
                      style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: qty > 0 ? '#3b6fd4' : '#e0e6ed',
                        color: qty > 0 ? '#fff' : '#6b7a99',
                        border: 'none', fontSize: '1.1rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>−</button>
                    <input
                      type="number" value={qty}
                      onChange={e => setQty(p.id, e.target.value)}
                      min="0"
                      style={{
                        width: '46px', textAlign: 'center',
                        padding: '5px 4px', border: '1.5px solid #e0e6ed',
                        borderRadius: '5px', fontSize: '0.95rem', fontWeight: 700,
                        outline: 'none', direction: 'ltr', background: '#fff'
                      }}
                      onFocus={e => e.target.style.borderColor = '#3b6fd4'}
                      onBlur={e => e.target.style.borderColor = '#e0e6ed'}
                    />
                    <button type="button"
                      onClick={() => setQty(p.id, (Number(qty) || 0) + 1)}
                      style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b6fd4, #2a5bb8)',
                        color: '#fff', border: 'none', fontSize: '1.1rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>+</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Total */}
        {total > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#eef3fc', border: '1px solid #c0d4f5',
            borderRadius: '6px', padding: '12px 16px'
          }}>
            <span style={{ fontWeight: 600, color: '#1a2332' }}>סה"כ לתשלום</span>
            <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#3b6fd4' }}>₪{total.toFixed(2)}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button type="button" onClick={onClose}
            style={{ background: '#f8fafc', color: '#1a2332', border: '1px solid #e0e6ed', padding: '9px 20px', borderRadius: '6px' }}>
            ביטול
          </button>
          <button type="submit" disabled={loading}
            style={{ background: loading ? '#8ca8e8' : 'linear-gradient(135deg, #3b6fd4, #2a5bb8)', color: '#fff', padding: '9px 24px', borderRadius: '6px', fontWeight: 700, border: 'none' }}>
            {loading ? 'שומר...' : `הוסף רכישה${total > 0 ? ` • ₪${total.toFixed(2)}` : ''}`}
          </button>
        </div>
      </form>
    </Modal>
  )
}

const modalLabel = { display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem', color: '#1a2332' }

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
          <button type="button" onClick={onClose} style={{ background: '#f8fafc', color: '#1a2332', border: '1px solid #e0e6ed', padding: '9px 20px', borderRadius: '2px' }}>ביטול</button>
          <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #3b6fd4, #2a5bb8)', color: '#f0f2f5', padding: '9px 24px', borderRadius: '2px', fontWeight: 700 }}>
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
    if (!map[key]) map[key] = { purchases: [], sessions: new Set(), customerId: p.customer_id || null }
    map[key].purchases.push(p)
    if (p.session_id) map[key].sessions.add(p.session_id)
  }
  return map
}

// ─── Customer Summary Tab ─────────────────────────────────────────────────────

function CustomerSummaryTab({ purchases, onDeleteCustomer }) {
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
    return { name, customerId: data.customerId, totalQty, totalPaid, visits, lastVisit, sessions: Object.values(bySess) }
  }).sort((a, b) => b.totalPaid - a.totalPaid)

  if (customers.length === 0) {
    return (
      <div style={{
        background: '#f8fafc', border: '1px solid #e0e6ed',
        borderRadius: '4px', padding: '60px 20px',
        textAlign: 'center', color: '#6b7a99', fontSize: '0.9rem'
      }}>
        אין רכישות לאירוע זה
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {customers.map(c => (
        <CustomerCard key={c.name} customer={c} onDelete={onDeleteCustomer} />
      ))}
    </div>
  )
}

function CustomerCard({ customer: c, onDelete }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      background: '#f8fafc', border: '1px solid #e0e6ed',
      borderRadius: '4px', overflow: 'hidden'
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', cursor: 'pointer', gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
            background: '#1a2332',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#f0f2f5', fontWeight: 700, fontSize: '0.9rem'
          }}>
            {c.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a2332' }}>{c.name}</div>
            <div style={{ fontSize: '0.78rem', color: '#6b7a99', marginTop: '2px' }}>
              {c.visits} {c.visits === 1 ? 'ביקור' : 'ביקורים'} ·{' '}
              {new Date(c.lastVisit).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}{' '}
              {new Date(c.lastVisit).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: '#1a2332', fontSize: '1rem' }}>{c.totalQty}</div>
            <div style={{ fontSize: '0.72rem', color: '#6b7a99' }}>פריטים</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: '#1a2332', fontSize: '1rem' }}>₪{c.totalPaid.toFixed(0)}</div>
            <div style={{ fontSize: '0.72rem', color: '#6b7a99' }}>סה"כ</div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDelete(c.name) }}
            style={{
              background: '#fff', color: '#c0392b',
              border: '1px solid #f0c0c0', borderRadius: '2px',
              padding: '4px 10px', fontSize: '0.78rem', flexShrink: 0
            }}
          >
            הסר
          </button>
          <span style={{ color: '#6b7a99', fontSize: '0.75rem', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
        </div>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid #e0e6ed', padding: '0 20px 16px', background: '#f0f2f5' }}>
          {c.sessions.map((sess, i) => (
            <div key={i} style={{ marginTop: '14px' }}>
              <div style={{
                fontSize: '0.75rem', fontWeight: 700, color: '#6b7a99',
                marginBottom: '8px', letterSpacing: '0.06em', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <span>ביקור {i + 1}</span>
                <span style={{ fontWeight: 400 }}>
                  {new Date(sess.time).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {sess.items.map((item, j) => (
                  <div key={j} style={{
                    background: '#f8fafc', border: '1px solid #e0e6ed',
                    borderRadius: '2px',
                    padding: '5px 10px', fontSize: '0.82rem',
                    display: 'flex', gap: '8px', alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: 600, color: '#1a2332' }}>{item.product_name}</span>
                    <span style={{ color: '#6b7a99' }}>×{item.quantity}</span>
                    <span style={{ color: '#1a2332', fontWeight: 600 }}>₪{item.total_price.toFixed(0)}</span>
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
