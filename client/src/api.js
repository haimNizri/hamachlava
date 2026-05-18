const BASE = '/api'

function getAdminToken() {
  return localStorage.getItem('hamachlava_admin_token')
}

function getCustomerToken() {
  const data = localStorage.getItem('hamachlava_customer')
  if (!data) return null
  try {
    return JSON.parse(data).token
  } catch {
    return null
  }
}

async function request(path, options = {}, tokenType = 'admin') {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }

  const token = tokenType === 'admin' ? getAdminToken() : getCustomerToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers
  })

  if (!res.ok) {
    let err
    try { err = await res.json() } catch { err = { error: 'שגיאה בשרת' } }
    throw new Error(err.error || 'שגיאה לא ידועה')
  }

  // Handle blob response (Excel download)
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('spreadsheetml') || contentType.includes('octet-stream')) {
    return res.blob()
  }

  return res.json()
}

// Auth
export const authApi = {
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }, 'none'),
  verify: () => request('/auth/verify')
}

// Events
export const eventsApi = {
  list: () => request('/events'),
  create: (data) => request('/events', { method: 'POST', body: JSON.stringify(data) }),
  get: (id) => request(`/events/${id}`),
  update: (id, data) => request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/events/${id}`, { method: 'DELETE' }),
  getQR: (id, baseUrl) => request(`/events/${id}/qr?base_url=${encodeURIComponent(baseUrl)}`),
  export: async (id) => {
    const token = getAdminToken()
    const res = await fetch(`${BASE}/events/${id}/export`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error('שגיאה בייצוא')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `event_${id}_export.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  },
  exportCustomers: async (id, eventName) => {
    const token = getAdminToken()
    const res = await fetch(`${BASE}/events/${id}/export-customers`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error('שגיאה בייצוא לקוחות')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customers_${id}_${eventName || ''}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }
}

// Products
export const productsApi = {
  add: (eventId, data) =>
    request(`/events/${eventId}/products`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    request(`/products/${id}`, { method: 'DELETE' })
}

// Customers
export const customersApi = {
  register: (data) =>
    request('/customers/register', { method: 'POST', body: JSON.stringify(data) }, 'none'),
  check: (deviceId) =>
    request(`/customers/check/${deviceId}`, {}, 'none')
}

// Purchases
export const purchasesApi = {
  list: (eventId) => request(`/events/${eventId}/purchases`),
  add: (data, tokenType = 'customer') =>
    request('/purchases', { method: 'POST', body: JSON.stringify(data) }, tokenType),
  addAsAdmin: (data) =>
    request('/purchases', { method: 'POST', body: JSON.stringify(data) }, 'admin'),
  delete: (id) => request(`/purchases/${id}`, { method: 'DELETE' })
}

// Admins management (superadmin only + self profile)
export const adminsApi = {
  list: () => request('/admins'),
  create: (data) => request('/admins', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/admins/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/admins/${id}`, { method: 'DELETE' }),
  updateProfile: (data) => request('/admins/me/profile', { method: 'PUT', body: JSON.stringify(data) }),
}

// Public event (no auth needed, but pass customer token)
export const publicApi = {
  getEvent: async (id) => {
    const res = await fetch(`${BASE}/events/${id}/public`)
    if (!res.ok) {
      // fallback: try with customer token
      const token = getCustomerToken()
      const headers = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res2 = await fetch(`${BASE}/events/${id}/public`, { headers })
      if (!res2.ok) throw new Error('אירוע לא נמצא')
      return res2.json()
    }
    return res.json()
  }
}
