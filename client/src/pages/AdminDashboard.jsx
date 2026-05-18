import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventsApi } from '../api'
import Navbar from '../components/Navbar'
import ToastContainer, { showToast } from '../components/Toast'

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

export default function AdminDashboard() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    try {
      const data = await eventsApi.list()
      setEvents(data)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(e, id) {
    e.stopPropagation()
    if (!confirm('האם למחוק את האירוע? פעולה זו אינה הפיכה.')) return
    try {
      await eventsApi.delete(id)
      showToast('האירוע נמחק', 'success')
      loadEvents()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const activeEvents = events.filter(e => e.is_active)
  const pastEvents = events.filter(e => !e.is_active)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <ToastContainer />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '28px', flexWrap: 'wrap', gap: '12px'
        }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>
              לוח בקרה
            </h1>
            <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>
              {events.length} אירועים בסך הכל
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/events/new')}
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(59,111,212,0.3)',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>+</span>
            אירוע חדש
          </button>
        </div>

        {/* Stats Cards */}
        {events.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px', marginBottom: '28px'
          }}>
            {[
              { label: 'אירועים פעילים', value: activeEvents.length, color: 'var(--success)', icon: '✅' },
              { label: 'אירועים סה"כ', value: events.length, color: 'var(--primary)', icon: '📅' },
              {
                label: 'הכנסות כוללות',
                value: `₪${events.reduce((s, e) => s + (e.total_revenue || 0), 0).toFixed(0)}`,
                color: 'var(--warning)', icon: '💰'
              }
            ].map((stat, i) => (
              <div key={i} style={{
                background: '#fff',
                borderRadius: 'var(--radius)',
                padding: '20px',
                boxShadow: 'var(--shadow)',
                borderTop: `3px solid ${stat.color}`
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{stat.icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '2px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-light)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
            טוען אירועים...
          </div>
        ) : events.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: 'var(--radius)', padding: '60px 20px',
            textAlign: 'center', boxShadow: 'var(--shadow)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
            <h3 style={{ color: 'var(--primary)', marginBottom: '8px' }}>אין אירועים עדיין</h3>
            <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>צור את האירוע הראשון שלך</p>
            <button
              onClick={() => navigate('/admin/events/new')}
              style={{
                background: 'var(--accent)', color: '#fff',
                padding: '12px 28px', borderRadius: 'var(--radius-sm)',
                fontWeight: 700, fontSize: '1rem'
              }}
            >
              צור אירוע
            </button>
          </div>
        ) : (
          <div>
            {activeEvents.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: 'var(--success)', width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' }}></span>
                  אירועים פעילים
                </h2>
                <EventList events={activeEvents} onDelete={handleDelete} navigate={navigate} />
              </div>
            )}

            {pastEvents.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: 'var(--text-light)', width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' }}></span>
                  אירועים לא פעילים
                </h2>
                <EventList events={pastEvents} onDelete={handleDelete} navigate={navigate} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function EventList({ events, onDelete, navigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {events.map(event => (
        <div
          key={event.id}
          onClick={() => navigate(`/admin/events/${event.id}`)}
          style={{
            background: '#fff',
            borderRadius: 'var(--radius)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow)',
            cursor: 'pointer',
            transition: 'transform 0.15s, box-shadow 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            borderRight: `4px solid ${event.is_active ? 'var(--success)' : 'var(--border)'}`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'var(--shadow)'
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary)', margin: 0 }}>
                {event.name}
              </h3>
              {event.is_active ? (
                <span style={{
                  background: '#e6f4ee', color: 'var(--success)',
                  padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600
                }}>פעיל</span>
              ) : (
                <span style={{
                  background: '#f5f5f5', color: 'var(--text-light)',
                  padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem'
                }}>לא פעיל</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                📅 {new Date(event.date).toLocaleDateString('he-IL')}
              </span>
              {event.expected_people && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                  👥 {event.expected_people} משתתפים
                </span>
              )}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                🛍 {event.product_count} מוצרים
              </span>
              {event.total_revenue > 0 && (
                <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>
                  ₪{Number(event.total_revenue).toFixed(0)} הכנסות
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={e => onDelete(e, event.id)}
              style={{
                background: '#eef2fb', color: 'var(--accent)',
                border: '1px solid #b8cbef',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px', fontSize: '0.85rem'
              }}
            >
              מחק
            </button>
            <button
              onClick={e => { e.stopPropagation(); navigate(`/admin/events/${event.id}`) }}
              style={{
                background: 'var(--primary)', color: '#fff',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600
              }}
            >
              פרטים ←
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
