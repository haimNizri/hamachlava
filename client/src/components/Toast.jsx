import { useState, useEffect } from 'react'

let toastFn = null

export function showToast(message, type = 'info') {
  if (toastFn) toastFn({ message, type })
}

export default function ToastContainer() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    toastFn = setToast
    return () => { toastFn = null }
  }, [])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  if (!toast) return null

  return (
    <div className={`toast ${toast.type}`}>
      {toast.message}
    </div>
  )
}
