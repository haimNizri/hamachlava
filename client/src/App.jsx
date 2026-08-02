import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AdminLogin from './pages/AdminLogin'
import AdminsManager from './pages/AdminsManager'
import AdminDashboard from './pages/AdminDashboard'
import AdminEventDetail from './pages/AdminEventDetail'
import AdminCreateEvent from './pages/AdminCreateEvent'
import AdminMonthlyReport from './pages/AdminMonthlyReport'
import CustomerEvent from './pages/CustomerEvent'
import CustomerCharges from './pages/CustomerCharges'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('hamachlava_admin_token')
  if (!token) return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={
          <ProtectedRoute><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/events/new" element={
          <ProtectedRoute><AdminCreateEvent /></ProtectedRoute>
        } />
        <Route path="/admin/events/:id" element={
          <ProtectedRoute><AdminEventDetail /></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute><AdminsManager /></ProtectedRoute>
        } />
        <Route path="/admin/reports/monthly" element={
          <ProtectedRoute><AdminMonthlyReport /></ProtectedRoute>
        } />
        <Route path="/event/:id" element={<CustomerEvent />} />
        <Route path="/my-charges" element={<CustomerCharges />} />
      </Routes>
    </BrowserRouter>
  )
}
