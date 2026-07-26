import { useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import {
  ArrowLeft,
  X,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  BadgeCheck,
  Copy,
  MapPin,
} from 'lucide-react'
import Header from '../components/Header.jsx'
import RoomFloorPlan from '../components/RoomFloorPlan.jsx'
import { useStore } from '../store.jsx'
import { getArea, getSeat, seatLabel, QUICK_TIMES } from '../data.js'

// วันที่วันนี้ (เวลาท้องถิ่น)
const localToday = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}
const AREA_NAMES = { bar: 'Counter Bar', pods: 'Computer Table', meeting: 'Meeting Room' }

export default function ZonePage() {
  const { zoneId } = useParams()
  const navigate = useNavigate()
  const { currentUser, isSeatBooked, createBooking, pushToast } = useStore()

  const area = getArea(zoneId)
  const [selected, setSelected] = useState(null) // ที่นั่งที่กำลังเลือก
  const [date, setDate] = useState(localToday())
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('12:00')
  const [timeError, setTimeError] = useState('')
  const [receipt, setReceipt] = useState(null)

  if (!area) return <Navigate to="/dashboard" replace />

  const openBooking = (seat) => {
    setSelected(seat)
    setDate(localToday())
    setStartTime('09:00')
    setEndTime('12:00')
    setTimeError('')
  }

  const [saving, setSaving] = useState(false)

  const confirmBooking = async () => {
    // ตรวจสอบเวลา: ต้องกรอกครบ และเวลาสิ้นสุดต้องหลังเวลาเริ่ม
    if (!date) return setTimeError('กรุณาเลือกวันที่')
    if (!startTime || !endTime) return setTimeError('กรุณากรอกเวลาเริ่มและเวลาสิ้นสุด')
    if (endTime <= startTime) return setTimeError('เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม')

    setSaving(true)
    try {
      const booking = await createBooking({
        areaId: getSeat(selected.id).area,
        seatId: selected.id,
        date,
        startTime,
        endTime,
      })
      setSelected(null)
      setReceipt(booking)
      pushToast(`จอง ${booking.seatLabel} สำเร็จแล้ว!`, 'success')
    } catch (err) {
      // เช่น จองซ้ำ / เกินโควตา — แสดงข้อความ ไม่ปิด modal
      setTimeError(err.message)
      pushToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const copyRef = (ref) => {
    navigator.clipboard?.writeText(ref)
    pushToast('คัดลอกรหัสอ้างอิงแล้ว', 'info')
  }

  const selectedArea = selected ? getSeat(selected.id).area : null

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slateblue-600"
        >
          <ArrowLeft className="h-4 w-4" /> กลับไปหน้าเลือกโซน
        </button>

        {/* หัวข้อโซน + legend */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${area.gradient} text-3xl`}
            >
              {area.emoji}
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">{area.nameTh}</h1>
              <p className="text-sm text-slate-500">
                {area.name} · {area.seatCount} ที่นั่ง
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
            <Legend color="bg-emerald-500" label="ว่าง" en="Available" />
            <Legend color="bg-amber-400" label="กำลังเลือก" en="Selected" />
            <Legend color="bg-red-500" label="จองแล้ว" en="Occupied" />
          </div>
        </div>

        {/* คำอธิบาย + ผังห้อง */}
        <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-slateblue-50 px-4 py-2.5 text-sm text-slateblue-700">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>
              นี่คือผังห้องจริงแบบมุมสูง — โซน <b>{area.nameTh}</b> ถูกไฮไลต์ไว้
              คลิกที่นั่งสีเขียวเพื่อจอง (คลิกที่นั่งโซนอื่นก็จองได้)
            </span>
          </div>

          <RoomFloorPlan
            activeArea={zoneId}
            selectedId={selected?.id}
            isSeatBooked={isSeatBooked}
            onSelect={openBooking}
          />
        </div>
      </main>

      {/* ---------- Modal ยืนยันการจอง ---------- */}
      {selected && (
        <Overlay onClose={() => setSelected(null)}>
          <div className="animate-pop w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div
              className={`bg-gradient-to-br ${getArea(selectedArea).gradient} px-6 py-5 text-white`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium opacity-90">{AREA_NAMES[selectedArea]}</p>
                  <h3 className="text-xl font-bold">{seatLabel(selected.id)}</h3>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-lg p-1 transition hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-6">
              {/* วันที่ */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Calendar className="h-4 w-4 text-slateblue-500" /> เลือกวันที่
                </label>
                <input
                  type="date"
                  min={localToday()}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value)
                    setTimeError('')
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slateblue-400 focus:ring-2 focus:ring-slateblue-100"
                />
              </div>

              {/* เวลาเริ่ม–สิ้นสุด (กรอกเองได้) */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Clock className="h-4 w-4 text-slateblue-500" /> ระบุเวลาที่จะใช้งาน
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value)
                      setTimeError('')
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slateblue-400 focus:ring-2 focus:ring-slateblue-100"
                  />
                  <span className="text-slate-400">–</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value)
                      setTimeError('')
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slateblue-400 focus:ring-2 focus:ring-slateblue-100"
                  />
                </div>

                {/* ปุ่มลัดเติมเวลา */}
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs text-slate-400">เลือกเร็ว:</span>
                  {QUICK_TIMES.map((q) => (
                    <button
                      key={q.label}
                      onClick={() => {
                        setStartTime(q.start)
                        setEndTime(q.end)
                        setTimeError('')
                      }}
                      className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600 transition hover:border-slateblue-300 hover:bg-slateblue-50"
                    >
                      {q.label} {q.start}-{q.end}
                    </button>
                  ))}
                </div>

                {timeError && (
                  <p className="mt-2 text-xs font-medium text-red-500">{timeError}</p>
                )}
              </div>

              {/* ข้อมูลผู้จอง */}
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  ข้อมูลผู้จอง
                </p>
                <div className="space-y-1.5 text-sm text-slate-700">
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    {currentUser?.firstName} {currentUser?.lastName}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {currentUser?.phone}
                  </p>
                </div>
              </div>

              <button
                onClick={confirmBooking}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-sage-500 to-sage-700 py-3 text-sm font-semibold text-white shadow-lg shadow-sage-500/30 transition hover:from-sage-600 hover:to-sage-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  'กำลังบันทึก...'
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> ยืนยันการจอง
                  </>
                )}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ---------- Modal ใบเสร็จ ---------- */}
      {receipt && (
        <Overlay onClose={() => setReceipt(null)}>
          <div className="animate-slide-up w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex flex-col items-center bg-gradient-to-br from-sage-500 to-sage-700 px-6 py-8 text-center text-white">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <BadgeCheck className="h-9 w-9" />
              </span>
              <h3 className="mt-3 text-xl font-bold">จองสำเร็จแล้ว!</h3>
              <p className="text-sm opacity-90">บันทึกการจองของคุณเรียบร้อย</p>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between rounded-2xl border-2 border-dashed border-sage-300 bg-sage-50 px-4 py-3">
                <div>
                  <p className="text-xs text-sage-600">รหัสอ้างอิงการจอง</p>
                  <p className="font-mono text-lg font-bold tracking-wider text-sage-800">
                    {receipt.ref}
                  </p>
                </div>
                <button
                  onClick={() => copyRef(receipt.ref)}
                  className="flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-sage-700 shadow-sm transition hover:bg-sage-100"
                >
                  <Copy className="h-3.5 w-3.5" /> คัดลอก
                </button>
              </div>

              <dl className="mt-4 space-y-2.5 text-sm">
                <Row label="โซน" value={AREA_NAMES[receipt.areaId]} />
                <Row label="ที่นั่ง" value={receipt.seatLabel} />
                <Row label="วันที่" value={receipt.date} />
                <Row label="เวลา" value={receipt.timeLabel} />
                <Row label="ผู้จอง" value={receipt.userName} />
                <Row label="เบอร์ติดต่อ" value={receipt.phone} />
              </dl>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setReceipt(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  จองต่อ
                </button>
                <button
                  onClick={() => navigate('/my-bookings')}
                  className="flex-1 rounded-xl bg-slate-800 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
                >
                  ดูการจองของฉัน
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  )
}

// ---------- ชิ้นส่วนย่อย ----------
function Legend({ color, label, en }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className="text-xs font-medium text-slate-600">
        {label} <span className="text-slate-400">({en})</span>
      </span>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-slate-100 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-800">{value}</dd>
    </div>
  )
}

function Overlay({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  )
}
