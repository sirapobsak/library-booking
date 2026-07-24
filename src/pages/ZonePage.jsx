import { useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import {
  ArrowLeft,
  Armchair,
  DoorOpen,
  X,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  BadgeCheck,
  Copy,
  Sofa,
} from 'lucide-react'
import Header from '../components/Header.jsx'
import { useStore } from '../store.jsx'
import { getZone, buildTables, TIME_SLOTS } from '../data.js'

// วันที่ต่ำสุดที่จองได้ = วันนี้ (ใช้เวลาท้องถิ่น ไม่ใช่ UTC เพื่อไม่ให้เพี้ยนข้ามวัน)
const today = (() => {
  const d = new Date()
  const offsetMs = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offsetMs).toISOString().split('T')[0]
})()

export default function ZonePage() {
  const { zoneId } = useParams()
  const navigate = useNavigate()
  const { currentUser, isTableOccupied, createBooking, pushToast } = useStore()

  const zone = getZone(zoneId)
  const [selected, setSelected] = useState(null) // โต๊ะที่กำลังเลือก (สำหรับ modal จอง)
  const [date, setDate] = useState(today)
  const [slotId, setSlotId] = useState(TIME_SLOTS[0].id)
  const [receipt, setReceipt] = useState(null) // ใบเสร็จหลังจองสำเร็จ

  if (!zone) return <Navigate to="/dashboard" replace />

  const tables = buildTables(zone)
  const isRoom = zone.kind === 'room'

  const openBooking = (table) => {
    setSelected(table)
    setDate(today)
    setSlotId(TIME_SLOTS[0].id)
  }

  const confirmBooking = () => {
    const slot = TIME_SLOTS.find((s) => s.id === slotId)
    const booking = createBooking({ zoneId, table: selected, date, slot: slot.label })
    setSelected(null)
    setReceipt(booking)
    pushToast(`จอง ${booking.tableLabel} สำเร็จแล้ว!`, 'success')
  }

  const copyRef = (ref) => {
    navigator.clipboard?.writeText(ref)
    pushToast('คัดลอกรหัสอ้างอิงแล้ว', 'info')
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* ปุ่มย้อนกลับ + หัวข้อโซน */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slateblue-600"
        >
          <ArrowLeft className="h-4 w-4" /> กลับไปหน้าเลือกโซน
        </button>

        <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${zone.gradient} text-3xl`}
            >
              {zone.emoji}
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">{zone.nameTh}</h1>
              <p className="text-sm text-slate-500">
                {zone.name} · {zone.capacity}
              </p>
            </div>
          </div>

          {/* คำอธิบายสถานะ (Legend) */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
            <Legend color="bg-sage-400" label="ว่าง" en="Available" />
            <Legend color="bg-amber-400" label="กำลังเลือก" en="Selected" />
            <Legend color="bg-red-400" label="จองแล้ว" en="Occupied" />
          </div>
        </div>

        {/* ผังที่นั่ง */}
        <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-slateblue-50 py-2 text-sm font-medium text-slateblue-700">
            <DoorOpen className="h-4 w-4" /> ทางเข้า–ออก / Entrance
          </div>

          <div
            className="grid gap-3 sm:gap-4"
            style={{
              gridTemplateColumns: `repeat(${isRoom ? 2 : zone.columns}, minmax(0, 1fr))`,
            }}
          >
            {tables.map((table) => {
              const occupied = isTableOccupied(zoneId, table.id)
              const isSelected = selected?.id === table.id

              // สีตามสถานะ
              let cls =
                'border-sage-200 bg-sage-50 text-sage-700 hover:border-sage-400 hover:bg-sage-100 hover:shadow-md cursor-pointer'
              if (occupied)
                cls =
                  'border-red-100 bg-red-50 text-red-300 cursor-not-allowed opacity-70'
              if (isSelected)
                cls = 'border-amber-400 bg-amber-100 text-amber-700 ring-2 ring-amber-200'

              const Icon = isRoom ? Sofa : Armchair

              return (
                <button
                  key={table.id}
                  disabled={occupied}
                  onClick={() => openBooking(table)}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 transition ${cls} ${
                    isRoom ? 'py-8' : 'py-5'
                  }`}
                  title={occupied ? `${table.label} · จองแล้ว` : `${table.label} · ว่าง`}
                >
                  <Icon className={isRoom ? 'h-8 w-8' : 'h-5 w-5'} />
                  <span className={`font-semibold ${isRoom ? 'text-sm' : 'text-xs'}`}>
                    {table.label}
                  </span>
                  {occupied && <span className="text-[10px] font-medium">จองแล้ว</span>}
                </button>
              )
            })}
          </div>
        </div>
      </main>

      {/* ---------- Modal ยืนยันการจอง ---------- */}
      {selected && (
        <Overlay onClose={() => setSelected(null)}>
          <div className="animate-pop w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className={`bg-gradient-to-br ${zone.gradient} px-6 py-5 text-white`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium opacity-90">{zone.nameTh}</p>
                  <h3 className="text-xl font-bold">{selected.label}</h3>
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
              {/* เลือกวันที่ */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Calendar className="h-4 w-4 text-slateblue-500" /> เลือกวันที่
                </label>
                <input
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slateblue-400 focus:ring-2 focus:ring-slateblue-100"
                />
              </div>

              {/* เลือกช่วงเวลา */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Clock className="h-4 w-4 text-slateblue-500" /> เลือกช่วงเวลา
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSlotId(s.id)}
                      className={`rounded-xl border px-2 py-2.5 text-center transition ${
                        slotId === s.id
                          ? 'border-slateblue-400 bg-slateblue-50 text-slateblue-700 ring-2 ring-slateblue-100'
                          : 'border-slate-200 text-slate-600 hover:border-slateblue-300'
                      }`}
                    >
                      <span className="block text-xs font-bold">{s.label}</span>
                      <span className="block text-[10px] text-slate-400">{s.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ข้อมูลผู้จอง (เติมจากล็อกอินอัตโนมัติ) */}
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-sage-500 to-sage-700 py-3 text-sm font-semibold text-white shadow-lg shadow-sage-500/30 transition hover:from-sage-600 hover:to-sage-800 active:scale-[0.99]"
              >
                <CheckCircle2 className="h-4 w-4" /> ยืนยันการจอง
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ---------- Modal ใบเสร็จ (สำเร็จ) ---------- */}
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
              {/* รหัสอ้างอิง */}
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

              {/* รายละเอียด */}
              <dl className="mt-4 space-y-2.5 text-sm">
                <Row label="โซน" value={zone.nameTh} />
                <Row label="ที่นั่ง" value={receipt.tableLabel} />
                <Row label="วันที่" value={receipt.date} />
                <Row label="เวลา" value={receipt.slot} />
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

// ฉากหลังทึบสำหรับ modal — คลิกนอกกล่องเพื่อปิด
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
