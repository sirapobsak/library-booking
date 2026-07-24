import { createContext, useContext, useState, useCallback } from 'react'
import { ZONES } from './data.js'

const StoreContext = createContext(null)

// ฮุคสั้น ๆ ไว้เรียกใช้ store จากที่ไหนก็ได้
export const useStore = () => {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

// สร้างรหัสอ้างอิงการจอง เช่น LIB-8F3K2Q
const makeRef = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return `LIB-${code}`
}

// ผู้ใช้ตัวอย่าง (mock) ให้ล็อกอินได้ทันทีโดยไม่ต้องสมัคร
const DEMO_USERS = [
  {
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    phone: '0812345678',
    email: 'demo@library.ac.th',
    password: '123456',
  },
]

export function StoreProvider({ children }) {
  const [users, setUsers] = useState(DEMO_USERS)
  const [currentUser, setCurrentUser] = useState(null)
  const [bookings, setBookings] = useState([])
  const [toasts, setToasts] = useState([])

  // ---------- ระบบแจ้งเตือน (Toast) ----------
  const pushToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // ---------- Authentication ----------
  const register = useCallback(
    (data) => {
      const exists = users.some(
        (u) => u.email === data.email || u.phone === data.phone
      )
      if (exists) {
        return { ok: false, error: 'อีเมลหรือเบอร์โทรนี้ถูกใช้แล้ว' }
      }
      const newUser = { ...data }
      setUsers((prev) => [...prev, newUser])
      return { ok: true }
    },
    [users]
  )

  const login = useCallback(
    (identifier, password) => {
      const user = users.find(
        (u) =>
          (u.email === identifier || u.phone === identifier) &&
          u.password === password
      )
      if (!user) {
        return { ok: false, error: 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง' }
      }
      setCurrentUser(user)
      return { ok: true }
    },
    [users]
  )

  const logout = useCallback(() => setCurrentUser(null), [])

  // ---------- การจอง ----------
  // เช็คว่าโต๊ะนี้ในโซนนี้ ถูกจองไปแล้วหรือยัง (นับทั้ง seeded และการจองของผู้ใช้)
  const isTableOccupied = useCallback(
    (zoneId, tableId) => {
      const zone = ZONES.find((z) => z.id === zoneId)
      if (zone?.seededOccupied?.includes(tableId)) return true
      return bookings.some(
        (b) =>
          b.zoneId === zoneId &&
          b.tableId === tableId &&
          b.status === 'active'
      )
    },
    [bookings]
  )

  const createBooking = useCallback(
    ({ zoneId, table, date, slot }) => {
      const ref = makeRef()
      const booking = {
        ref,
        zoneId,
        tableId: table.id,
        tableLabel: table.label,
        date,
        slot,
        userName: currentUser
          ? `${currentUser.firstName} ${currentUser.lastName}`
          : 'ผู้ใช้',
        phone: currentUser?.phone ?? '-',
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      setBookings((prev) => [booking, ...prev])
      return booking
    },
    [currentUser]
  )

  const cancelBooking = useCallback(
    (ref) => {
      setBookings((prev) =>
        prev.map((b) => (b.ref === ref ? { ...b, status: 'cancelled' } : b))
      )
    },
    []
  )

  const value = {
    users,
    currentUser,
    bookings,
    activeBookings: bookings.filter((b) => b.status === 'active'),
    toasts,
    pushToast,
    dismissToast,
    register,
    login,
    logout,
    isTableOccupied,
    createBooking,
    cancelBooking,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
