import { useEffect } from 'react'

export default function Modal({ title, onClose, children, maxWidth = '500px' }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '16px'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 'var(--radius)',
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'slideIn 0.2s ease',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, background: '#fff', zIndex: 1
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary)' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', fontSize: '1.4rem',
              cursor: 'pointer', color: 'var(--text-light)', lineHeight: 1,
              padding: '0 4px'
            }}
          >✕</button>
        </div>
        <div style={{ padding: '20px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
