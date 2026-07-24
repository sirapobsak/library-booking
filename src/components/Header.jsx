import { Link, useNavigate } from 'react-router-dom'
import { BookMarked, LogOut, CalendarCheck, User } from 'lucide-react'
import { useStore } from '../store.jsx'

// แถบเมนูด้านบน แสดงข้อมูลผู้ใช้ + ปุ่มออกจากระบบ
export default function Header() {
  const { currentUser, logout, activeBookings } = useStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slateblue-500 to-slateblue-700 text-white shadow-md shadow-slateblue-500/30">
            <BookMarked className="h-5 w-5" />
          </span>
          <span className="hidden sm:block">
            <span className="block text-sm font-bold leading-tight text-slate-800">
              Library Booking
            </span>
            <span className="block text-xs text-slate-500">ระบบจองห้องสมุด</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/my-bookings"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <CalendarCheck className="h-4 w-4" />
            <span className="hidden sm:inline">การจองของฉัน</span>
            {activeBookings.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sage-500 px-1.5 text-xs font-bold text-white">
                {activeBookings.length}
              </span>
            )}
          </Link>

          <div className="hidden items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 md:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slateblue-100 text-slateblue-700">
              <User className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-800">
                {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'ผู้ใช้'}
              </p>
              <p className="text-xs text-slate-500">{currentUser?.phone}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </header>
  )
}
