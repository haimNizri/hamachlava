import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventsApi } from '../api'
import Navbar from '../components/Navbar'
import ToastContainer, { showToast } from '../components/Toast'

export default function AdminDashboard() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { loadEvents() }, [])

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
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Navbar />
      <ToastContainer />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 16px' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '32px', flexWrap: 'wrap', gap: '12px'
        }}>
          <div>
            <p style={{ color: '#6b7a99', fontSize: '0.85rem' }}>
              {events.length} אירועים בסך הכל
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/events/new')}
            style={{
              background: 'linear-gradient(135deg, #3b6fd4, #2a5bb8)',
              color: '#f0f2f5',
              padding: '10px 22px',
              borderRadius: '2px',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.06em'
            }}
          >
            + אירוע חדש
          </button>
        </div>

        {/* Stats */}
        {events.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px', marginBottom: '32px'
          }}>
            {[
              { label: 'אירועים פעילים', value: activeEvents.length },
              { label: 'סה"כ אירועים', value: events.length },
              { label: 'הכנסות כוללות', value: `₪${events.reduce((s, e) => s + (e.total_revenue || 0), 0).toFixed(0)}` }
            ].map((stat, i) => (
              <div key={i} style={{
                background: '#f8fafc',
                border: '1px solid #e0e6ed', boxShadow: '0 1px 6px rgba(19,31,46,0.06)',
                padding: '20px',
                borderRadius: '4px'
              }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1a2332' }}>{stat.value}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7a99', marginTop: '4px', letterSpacing: '0.02em' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6b7a99' }}>טוען...</div>
        ) : events.length === 0 ? (
          <div style={{
            background: '#f8fafc', border: '1px solid #e0e6ed', boxShadow: '0 1px 6px rgba(19,31,46,0.06)',
            padding: '60px 20px', textAlign: 'center', borderRadius: '4px'
          }}>
            <h3 style={{ color: '#1a2332', marginBottom: '8px', fontWeight: 600 }}>אין אירועים עדיין</h3>
            <p style={{ color: '#6b7a99', marginBottom: '24px', fontSize: '0.9rem' }}>צור את האירוע הראשון שלך</p>
            <button
              onClick={() => navigate('/admin/events/new')}
              style={{
                background: 'linear-gradient(135deg, #3b6fd4, #2a5bb8)', color: '#f0f2f5',
                padding: '11px 28px', borderRadius: '2px',
                fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.06em'
              }}
            >
              צור אירוע
            </button>
          </div>
        ) : (
          <div>
            {activeEvents.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7a99', marginBottom: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  פעילים
                </h2>
                <EventList events={activeEvents} onDelete={handleDelete} navigate={navigate} />
              </div>
            )}
            {pastEvents.length > 0 && (
              <div>
                <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7a99', marginBottom: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  לא פעילים
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {events.map(event => (
        <div
          key={event.id}
          onClick={() => navigate(`/admin/events/${event.id}`)}
          className="mobile-wrap"
          style={{
            background: '#f8fafc',
            border: '1px solid #e0e6ed', boxShadow: '0 1px 6px rgba(19,31,46,0.06)',
            borderRadius: '4px',
            padding: '16px 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            transition: 'border-color 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#8ca8e8'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#e0e6ed'}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a2332', margin: 0 }}>
                {event.name}
              </h3>
              <span style={{
                fontSize: '0.7rem', letterSpacing: '0.05em',
                padding: '2px 7px', borderRadius: '2px',
                background: event.is_active ? '#e8f5ee' : '#f0f2f5',
                color: event.is_active ? '#1a7a4a' : '#6b7a99',
                fontWeight: 600
              }}>
                {event.is_active ? 'פעיל' : 'לא פעיל'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: '#6b7a99' }}>
                {new Date(event.date).toLocaleDateString('he-IL')}
              </span>
              {event.expected_people && (
                <span style={{ fontSize: '0.8rem', color: '#6b7a99' }}>
                  {event.expected_people} משתתפים
                </span>
              )}
              <span style={{ fontSize: '0.8rem', color: '#6b7a99' }}>
                {event.product_count} מוצרים
              </span>
              {event.total_revenue > 0 && (
                <span style={{ fontSize: '0.8rem', color: '#1a2332', fontWeight: 600 }}>
                  ₪{Number(event.total_revenue).toFixed(0)}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
            <button
              onClick={e => onDelete(e, event.id)}
              style={{
                background: '#f8fafc', color: '#6b7a99',
                border: '1px solid #e0e6ed', boxShadow: '0 1px 6px rgba(19,31,46,0.06)', borderRadius: '2px',
                padding: '6px 12px', fontSize: '0.8rem'
              }}
            >
              מחק
            </button>
            <button
              onClick={e => { e.stopPropagation(); navigate(`/admin/events/${event.id}`) }}
              style={{
                background: 'linear-gradient(135deg, #3b6fd4, #2a5bb8)', color: '#f0f2f5',
                border: 'none', borderRadius: '2px',
                padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600
              }}
            >
              פרטים
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
