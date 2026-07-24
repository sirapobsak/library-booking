import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarCheck,
  CalendarX,
  MapPin,
  Clock,
  Calendar,
  Hash,
  Trash2,
  ArrowLeft,
  Inbox,
  X,
  AlertTriangle,
} from 'lucide-react'
import Header from '../components/Header.jsx'
import { useStore } from '../store.jsx'
import { getZone } from '../data.js'

export default function MyBookings() {
  const navigate = useNavigate()
  const { bookings, cancelBooking, pushToast } = useStore()
  const [confirmRef, setConfirmRef] = useState(null) // การจองที่กำลังจะยกเลิก

  const active = bookings.filter((b) => b.status === 'active')
  const cancelled = bookings.filter((b) => b.status === 'cancelled')

  const doCancel = () => {
    const b = bookings.find((x) => x.ref === confirmRef)
    cancelBooking(confirmRef)
    setConfirmRef(null)
    pushToast(`ยกเลิกการจอง ${b?.tableLabel} แล้ว`, 'info')
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slateblue-600"
        >
          <ArrowLeft className="h-4 w-4" /> กลับหน้าหลัก
        </button>

        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slateblue-500 to-slateblue-700 text-white">
            <CalendarCheck className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">การจองของฉัน</h1>
            <p className="text-sm text-slate-500">
              จัดการและยกเลิกการจองของคุณได้ที่นี่
            </p>
          </div>
        </div>

        {/* รายการที่ยังใช้งานอยู่ */}
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            <span className="h-2 w-2 rounded-full bg-sage-500" />
            กำลังใช้งาน ({active.length})
          </h2>

          {active.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white py-14 text-center">
              <Inbox className="h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">ยังไม่มีการจอง</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="rounded-xl bg-slateblue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slateblue-700"
              >
                เริ่มจองที่นั่ง
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {active.map((b) => {
                const zone = getZone(b.zoneId)
                return (
                  <div
                    key={b.ref}
                    className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                  >
                    <div
                      className={`flex items-center justify-between bg-gradient-to-br ${zone?.gradient} px-4 py-3 text-white`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{zone?.emoji}</span>
                        <div>
                          <p className="text-sm font-bold leading-tight">{b.tableLabel}</p>
                          <p className="text-xs opacity-90">{zone?.nameTh}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
                        ยืนยันแล้ว
                      </span>
                    </div>

                    <div className="space-y-2 p-4 text-sm">
                      <Detail icon={Calendar} label="วันที่" value={b.date} />
                      <Detail icon={Clock} label="เวลา" value={b.slot} />
                      <Detail icon={Hash} label="รหัสอ้างอิง" value={b.ref} mono />

                      <button
                        onClick={() => setConfirmRef(b.ref)}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" /> ยกเลิกการจอง
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ประวัติที่ยกเลิกแล้ว */}
        {cancelled.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400">
              <CalendarX className="h-4 w-4" />
              ยกเลิกแล้ว ({cancelled.length})
            </h2>
            <div className="space-y-2">
              {cancelled.map((b) => {
                const zone = getZone(b.zoneId)
                return (
                  <div
                    key={b.ref}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm"
                  >
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium text-slate-500 line-through">
                        {b.tableLabel} · {zone?.nameTh}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-slate-400">{b.ref}</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>

      {/* ---------- Modal ยืนยันการยกเลิก ---------- */}
      {confirmRef && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setConfirmRef(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-pop w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl"
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-slate-800">ยืนยันการยกเลิก?</h3>
            <p className="mt-1 text-sm text-slate-500">
              การจองนี้จะถูกยกเลิก และที่นั่งจะกลับมาว่างให้คนอื่นจองได้
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirmRef(null)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" /> ไม่ยกเลิก
              </button>
              <button
                onClick={doCancel}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                <Trash2 className="h-4 w-4" /> ยืนยันยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Detail({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-slate-500">
        <Icon className="h-4 w-4 text-slate-400" /> {label}
      </span>
      <span className={`font-semibold text-slate-800 ${mono ? 'font-mono tracking-wide' : ''}`}>
        {value}
      </span>
    </div>
  )
}
