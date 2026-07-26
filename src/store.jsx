import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { seatLabel } from './data.js'
import { supabase, isSupabaseEnabled } from './supabase.js'

const StoreContext = createContext(null)

export const useStore = () => {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

// สร้างรหัสอ้างอิงสำหรับโหมด mock เช่น LIB-8F3K2Q
const makeRef = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return `LIB-${code}`
}

// รหัสอ้างอิงสำหรับโหมด Supabase (ทำจาก uuid ให้อ่านง่าย)
const refFromId = (id) => 'LIB-' + String(id).replace(/-/g, '').slice(0, 6).toUpperCase()

// ผู้ใช้ตัวอย่างสำหรับโหมด mock เท่านั้น
const DEMO_USERS = [
  { firstName: 'สมชาย', lastName: 'ใจดี', phone: '0812345678', email: 'demo@library.ac.th', password: '123456' },
]

export function StoreProvider({ children }) {
  const [users, setUsers] = useState(DEMO_USERS)
  const [currentUser, setCurrentUser] = useState(null)
  const [bookings, setBookings] = useState([]) // การจองของผู้ใช้คนปัจจุบัน (ไว้โชว์ในหน้า "การจองของฉัน")
  const [toasts, setToasts] = useState([])
  const [remoteBookedSeatIds, setRemoteBookedSeatIds] = useState(new Set()) // ที่นั่งที่ถูกจอง (โหมด Supabase)
  const [authReady, setAuthReady] = useState(!isSupabaseEnabled)

  // maps สำหรับแปลง seatId <-> table_id (โหมด Supabase)
  const seatToTable = useRef(new Map())
  const tableToSeat = useRef(new Map())
  const currentUserRef = useRef(null)
  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  // ---------- ระบบแจ้งเตือน (Toast) ----------
  const pushToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // แปลง booking row จาก DB -> รูปแบบที่ UI ใช้
  const rowToBooking = useCallback((row) => {
    const seatId = tableToSeat.current.get(row.table_id) ?? row.table_id
    return {
      id: row.id,
      ref: refFromId(row.id),
      areaId: seatAreaOf(seatId),
      seatId,
      seatLabel: seatLabel(seatId),
      date: row.date,
      startTime: (row.start_time || '').slice(0, 5),
      endTime: (row.end_time || '').slice(0, 5),
      timeLabel: `${(row.start_time || '').slice(0, 5)} - ${(row.end_time || '').slice(0, 5)}`,
      userName: currentUserRef.current
        ? `${currentUserRef.current.firstName} ${currentUserRef.current.lastName}`
        : 'ผู้ใช้',
      phone: currentUserRef.current?.phone ?? '-',
      status: row.status === 'cancelled' ? 'cancelled' : 'active',
      createdAt: row.created_at,
    }
  }, [])

  // ==========================================================
  //  โหมด Supabase: โหลด session, tables, การจอง + realtime
  // ==========================================================
  const loadProfile = useCallback(async (authUser) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
    setCurrentUser({
      id: authUser.id,
      firstName: data?.first_name ?? '',
      lastName: data?.last_name ?? '',
      phone: data?.phone_number ?? '',
      email: data?.email ?? authUser.email,
    })
  }, [])

  const refreshMyBookings = useCallback(async (userId) => {
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setBookings(data.map(rowToBooking))
  }, [rowToBooking])

  // 1) session + auth state
  useEffect(() => {
    if (!isSupabaseEnabled) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) loadProfile(data.session.user)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadProfile(session.user)
      else setCurrentUser(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  // 2) โหลด tables (สร้าง map) + สถานะที่นั่งเริ่มต้น + subscribe realtime
  useEffect(() => {
    if (!isSupabaseEnabled) return
    let channel

    const init = async () => {
      // สร้าง map seatId <-> table_id จากตาราง tables (table_number = seatId)
      const { data: tables } = await supabase.from('tables').select('id, table_number')
      if (tables) {
        seatToTable.current = new Map(tables.map((t) => [t.table_number, t.id]))
        tableToSeat.current = new Map(tables.map((t) => [t.id, t.table_number]))
      }

      // สถานะที่นั่งเริ่มต้น: การจองที่ยัง confirmed ทั้งหมด
      const { data: active } = await supabase
        .from('bookings')
        .select('table_id')
        .eq('status', 'confirmed')
      if (active) {
        setRemoteBookedSeatIds(new Set(active.map((b) => tableToSeat.current.get(b.table_id) ?? b.table_id)))
      }

      // realtime: ฟังการเปลี่ยนแปลงบน bookings
      channel = supabase
        .channel('bookings-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
          const row = payload.new?.id ? payload.new : payload.old
          if (!row) return
          const seatId = tableToSeat.current.get(row.table_id) ?? row.table_id
          const confirmed = row.status === 'confirmed'

          // อัปเดตสถานะที่นั่งบนผังห้อง (ทุกคนเห็นตรงกัน)
          setRemoteBookedSeatIds((prev) => {
            const next = new Set(prev)
            if (confirmed) next.add(seatId)
            else next.delete(seatId)
            return next
          })

          // ถ้าเป็นการจองของเราเอง -> อัปเดตรายการ "การจองของฉัน"
          const me = currentUserRef.current
          if (me && row.user_id === me.id) {
            setBookings((prev) => {
              const mapped = rowToBooking(row)
              const idx = prev.findIndex((b) => b.id === row.id)
              if (idx === -1) return [mapped, ...prev]
              const copy = [...prev]
              copy[idx] = mapped
              return copy
            })
          }
        })
        .subscribe()
    }

    init()
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [rowToBooking])

  // โหลดการจองของฉันเมื่อล็อกอิน (โหมด Supabase)
  useEffect(() => {
    if (!isSupabaseEnabled) return
    if (currentUser?.id) refreshMyBookings(currentUser.id)
    else setBookings([])
  }, [currentUser?.id, refreshMyBookings])

  // ==========================================================
  //  Authentication (รองรับทั้ง mock และ Supabase)
  // ==========================================================
  const register = useCallback(
    async (data) => {
      if (isSupabaseEnabled) {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              first_name: data.firstName,
              last_name: data.lastName,
              phone_number: data.phone,
            },
          },
        })
        if (error) return { ok: false, error: translateAuthError(error) }
        return { ok: true }
      }
      // ----- mock -----
      const exists = users.some((u) => u.email === data.email || u.phone === data.phone)
      if (exists) return { ok: false, error: 'อีเมลหรือเบอร์โทรนี้ถูกใช้แล้ว' }
      setUsers((prev) => [...prev, { ...data }])
      return { ok: true }
    },
    [users]
  )

  const login = useCallback(
    async (identifier, password) => {
      if (isSupabaseEnabled) {
        // ล็อกอินด้วยอีเมล หรือ เบอร์โทร (เบอร์ -> หา email ก่อนผ่าน RPC)
        let email = identifier
        if (!identifier.includes('@')) {
          const { data: found } = await supabase.rpc('get_email_by_phone', { p_phone: identifier })
          if (!found) return { ok: false, error: 'ไม่พบผู้ใช้จากเบอร์นี้' }
          email = found
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return { ok: false, error: translateAuthError(error) }
        return { ok: true }
      }
      // ----- mock -----
      const user = users.find(
        (u) => (u.email === identifier || u.phone === identifier) && u.password === password
      )
      if (!user) return { ok: false, error: 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง' }
      setCurrentUser(user)
      return { ok: true }
    },
    [users]
  )

  const logout = useCallback(async () => {
    if (isSupabaseEnabled) await supabase.auth.signOut()
    setCurrentUser(null)
  }, [])

  // ==========================================================
  //  การจอง
  // ==========================================================
  const createBooking = useCallback(
    async ({ areaId, seatId, date, startTime, endTime }) => {
      if (isSupabaseEnabled) {
        const table_id = seatToTable.current.get(seatId)
        const { data, error } = await supabase
          .from('bookings')
          .insert({ table_id, date, start_time: startTime, end_time: endTime })
          .select()
          .single()
        if (error) throw new Error(translateBookingError(error))
        // อัปเดต local ทันที (realtime จะตามมาและ dedupe ด้วย id)
        setRemoteBookedSeatIds((prev) => new Set(prev).add(seatId))
        const booking = rowToBooking(data)
        setBookings((prev) => (prev.some((b) => b.id === booking.id) ? prev : [booking, ...prev]))
        return booking
      }
      // ----- mock -----
      const ref = makeRef()
      const booking = {
        id: ref,
        ref,
        areaId,
        seatId,
        seatLabel: seatLabel(seatId),
        date,
        startTime,
        endTime,
        timeLabel: `${startTime} - ${endTime}`,
        userName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'ผู้ใช้',
        phone: currentUser?.phone ?? '-',
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      setBookings((prev) => [booking, ...prev])
      return booking
    },
    [currentUser, rowToBooking]
  )

  const cancelBooking = useCallback(async (id) => {
    if (isSupabaseEnabled) {
      const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
      if (error) throw new Error(error.message)
      // อัปเดต local ทันที
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)))
      setBookings((prev) => {
        const b = prev.find((x) => x.id === id)
        if (b) setRemoteBookedSeatIds((s) => { const n = new Set(s); n.delete(b.seatId); return n })
        return prev
      })
      return
    }
    // ----- mock -----
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)))
  }, [])

  // ที่นั่งที่ถูกจอง: โหมด mock คำนวณจาก bookings, โหมด Supabase ใช้ remoteBookedSeatIds
  const bookedForMock = useMemo(
    () => new Set(bookings.filter((b) => b.status === 'active').map((b) => b.seatId)),
    [bookings]
  )
  const isSeatBookedFinal = useCallback(
    (seatId) => (isSupabaseEnabled ? remoteBookedSeatIds.has(seatId) : bookedForMock.has(seatId)),
    [remoteBookedSeatIds, bookedForMock]
  )

  const value = {
    cloud: isSupabaseEnabled,
    authReady,
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
    isSeatBooked: isSeatBookedFinal,
    createBooking,
    cancelBooking,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// ---------- helpers ----------
// หาโซนจาก seatId (ตามช่วงเลขที่ frontend ใช้)
function seatAreaOf(seatId) {
  if (seatId >= 1 && seatId <= 8) return 'bar'
  if (seatId >= 9 && seatId <= 20) return 'pods'
  return 'flex'
}

function translateAuthError(error) {
  const msg = (error?.message || '').toLowerCase()
  if (msg.includes('invalid login')) return 'อีเมล/เบอร์ หรือรหัสผ่านไม่ถูกต้อง'
  if (msg.includes('already registered') || msg.includes('already been registered'))
    return 'อีเมลนี้ถูกใช้สมัครแล้ว'
  if (msg.includes('email not confirmed')) return 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ'
  if (msg.includes('password')) return 'รหัสผ่านไม่ถูกต้องหรือสั้นเกินไป'
  return error?.message || 'เกิดข้อผิดพลาดในการยืนยันตัวตน'
}

function translateBookingError(error) {
  switch (error.code) {
    case '23P01':
      return 'ที่นั่งนี้ถูกจองในช่วงเวลาดังกล่าวแล้ว กรุณาเลือกที่นั่งหรือเวลาอื่น'
    case '23505':
      return 'คุณจองได้สูงสุดวันละ 1 ที่นั่งเท่านั้น'
    case '23514':
      return 'เวลาที่เลือกไม่ถูกต้อง (เวลาสิ้นสุดต้องหลังเวลาเริ่ม)'
    case '42501':
      return 'ไม่มีสิทธิ์ทำรายการนี้'
    default:
      return error.message || 'จองไม่สำเร็จ กรุณาลองใหม่'
  }
}
