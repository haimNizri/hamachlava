import { useEffect } from 'react'

export default function Modal({ title, onClose, children, maxWidth = '500px' }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      onClick={onClose}
      className="modal-overlay"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(19,31,46,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '16px'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="modal-box"
        style={{
          background: '#fff',
          width: '100%', maxWidth,
          maxHeight: '90vh', overflowY: 'auto',
          animation: 'slideIn 0.2s ease',
          borderRadius: '10px',
          boxShadow: '0 20px 60px rgba(19,31,46,0.25)'
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid #e0e6ed',
          position: 'sticky', top: 0, background: '#fff', zIndex: 1,
          borderRadius: '10px 10px 0 0'
        }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#131f2e' }}>
            {title}
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '1.2rem',
            cursor: 'pointer', color: '#6b7a99', lineHeight: 1, padding: '0 4px'
          }}>✕</button>
        </div>
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  )
}
