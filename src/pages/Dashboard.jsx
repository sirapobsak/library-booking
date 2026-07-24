import { useNavigate } from 'react-router-dom'
import { ArrowRight, Users, LayoutGrid, CalendarCheck } from 'lucide-react'
import Header from '../components/Header.jsx'
import { useStore } from '../store.jsx'
import { ZONES } from '../data.js'

export default function Dashboard() {
  const navigate = useNavigate()
  const { currentUser, activeBookings, isTableOccupied } = useStore()

  // นับที่นั่งว่างของแต่ละโซนแบบเรียลไทม์
  const zoneStats = ZONES.map((zone) => {
    let occupied = 0
    for (let i = 1; i <= zone.tableCount; i++) {
      if (isTableOccupied(zone.id, i)) occupied++
    }
    return { ...zone, occupied, available: zone.tableCount - occupied }
  })

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* ส่วนต้อนรับ */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slateblue-600">
              สวัสดี, {currentUser?.firstName} 👋
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-800 sm:text-3xl">
              เลือกโซนที่ต้องการจอง
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              เลือกพื้นที่ที่เหมาะกับคุณ แล้วดูผังที่นั่งเพื่อจองได้ทันที
            </p>
          </div>

          <button
            onClick={() => navigate('/my-bookings')}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slateblue-300 hover:bg-slateblue-50"
          >
            <CalendarCheck className="h-4 w-4 text-slateblue-600" />
            การจองของฉัน
            {activeBookings.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sage-500 px-1.5 text-xs font-bold text-white">
                {activeBookings.length}
              </span>
            )}
          </button>
        </div>

        {/* การ์ดโซน */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {zoneStats.map((zone) => (
            <div
              key={zone.id}
              className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5"
            >
              {/* หัวการ์ดแบบ gradient */}
              <div
                className={`relative flex h-36 items-center justify-center bg-gradient-to-br ${zone.gradient}`}
              >
                <span className="text-5xl drop-shadow-sm">{zone.emoji}</span>
                <span className="absolute right-3 top-3 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  {zone.kind === 'room' ? `${zone.tableCount} ห้อง` : `${zone.tableCount} โต๊ะ`}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-bold text-slate-800">{zone.nameTh}</h3>
                <p className="text-xs font-medium text-slate-400">{zone.name}</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
                  {zone.description}
                </p>

                {/* สถิติ */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-sage-50 px-3 py-2">
                    <p className="text-lg font-bold text-sage-700">{zone.available}</p>
                    <p className="text-xs text-sage-600">ว่าง</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="flex items-center gap-1 text-sm font-semibold text-slate-600">
                      <Users className="h-3.5 w-3.5" /> {zone.capacity}
                    </p>
                    <p className="text-xs text-slate-400">ความจุ</p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/zone/${zone.id}`)}
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 group-hover:gap-3"
                >
                  <LayoutGrid className="h-4 w-4" />
                  เลือกโซนนี้
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
