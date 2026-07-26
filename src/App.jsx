import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useStore } from './store.jsx'
import Toasts from './components/Toasts.jsx'
import AuthPage from './pages/AuthPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ZonePage from './pages/ZonePage.jsx'
import MyBookings from './pages/MyBookings.jsx'
import MyPoints from './pages/MyPoints.jsx'

// กันไม่ให้เข้าหน้าที่ต้องล็อกอินก่อน ถ้ายังไม่ล็อกอินให้เด้งไป /login
function Protected({ children }) {
  const { currentUser, authReady } = useStore()
  const location = useLocation()

  // โหมด Supabase: รอกู้คืน session ให้เสร็จก่อน (กันหน้าเด้งไป login ตอนรีเฟรช)
  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        กำลังโหลด...
      </div>
    )
  }
  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route
          path="/dashboard"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/zone/:zoneId"
          element={
            <Protected>
              <ZonePage />
            </Protected>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <Protected>
              <MyBookings />
            </Protected>
          }
        />
        <Route
          path="/points"
          element={
            <Protected>
              <MyPoints />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toasts />
    </>
  )
}
