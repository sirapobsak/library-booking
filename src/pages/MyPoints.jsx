import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Star,
  Volume2,
  Plus,
  Minus,
  ShieldCheck,
  History,
  Info,
  RotateCcw,
} from 'lucide-react'
import Header from '../components/Header.jsx'
import { useStore } from '../store.jsx'

// ระดับความประพฤติจากคะแนน
function level(points) {
  if (points >= 90) return { label: 'ดีเยี่ยม', color: 'emerald', ring: 'ring-emerald-200', text: 'text-emerald-600', bar: 'bg-emerald-500' }
  if (points >= 70) return { label: 'ดี', color: 'sage', ring: 'ring-sage-200', text: 'text-sage-600', bar: 'bg-sage-500' }
  if (points >= 50) return { label: 'พอใช้', color: 'amber', ring: 'ring-amber-200', text: 'text-amber-600', bar: 'bg-amber-500' }
  return { label: 'ต้องปรับปรุง', color: 'red', ring: 'ring-red-200', text: 'text-red-600', bar: 'bg-red-500' }
}

export default function MyPoints() {
  const navigate = useNavigate()
  const { currentUser, pointLogs, adjustPoints, pushToast } = useStore()
  const [busy, setBusy] = useState(false)

  const points = currentUser?.points ?? 100
  const lv = level(points)

  const run = async (delta, reason) => {
    setBusy(true)
    try {
      await adjustPoints(delta, reason)
      pushToast(delta < 0 ? `หัก ${-delta} คะแนน` : `เพิ่ม ${delta} คะแนน`, delta < 0 ? 'error' : 'success')
    } catch (e) {
      pushToast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slateblue-600"
        >
          <ArrowLeft className="h-4 w-4" /> กลับหน้าหลัก
        </button>

        {/* การ์ดคะแนนหลัก */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col items-center bg-gradient-to-br from-slateblue-500 to-slateblue-700 px-6 py-8 text-center text-white">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide opacity-90">
              <ShieldCheck className="h-4 w-4" /> คะแนนความประพฤติ
            </span>
            <div className={`mt-3 flex h-28 w-28 items-center justify-center rounded-full bg-white/15 ring-4 ${lv.ring}`}>
              <span className="text-5xl font-extrabold">{points}</span>
            </div>
            <p className="mt-3 text-lg font-bold">{lv.label}</p>
            <p className="text-sm opacity-90">
              {currentUser?.firstName} {currentUser?.lastName}
            </p>
          </div>

          {/* แถบระดับ */}
          <div className="px-6 pt-5">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${lv.bar} transition-all`} style={{ width: `${points}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-slate-400">
              <span>0</span><span>50</span><span>100</span>
            </div>
          </div>

          {/* คำอธิบายระบบ */}
          <div className="mx-6 mt-5 flex items-start gap-2.5 rounded-2xl bg-slateblue-50 p-4 text-sm text-slateblue-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slateblue-500" />
            <p className="leading-relaxed">
              ระบบจะ <b>หักคะแนนอัตโนมัติ</b> เมื่อเซนเซอร์ที่โต๊ะตรวจพบว่าคุณส่งเสียงดังเกินกำหนด
              ในช่วงเวลาที่จอง — รักษาคะแนนไว้เพื่อสิทธิ์การจองที่ดีขึ้น
              <span className="mt-1 block text-xs text-slateblue-500">
                (ตอนนี้ยังไม่ได้เชื่อมเซนเซอร์จริง — ใช้ปุ่มด้านล่างเพื่อทดสอบระบบได้)
              </span>
            </p>
          </div>

          {/* แผงทดสอบ (จำลอง) */}
          <div className="p-6">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Volume2 className="h-4 w-4" /> ทดสอบระบบ (จำลอง)
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button disabled={busy} onClick={() => run(-5, 'เสียงดังเกินกำหนด')} className="flex flex-col items-center gap-1 rounded-xl border border-red-200 bg-red-50 py-3 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50">
                <Volume2 className="h-4 w-4" /> เสียงดัง −5
              </button>
              <button disabled={busy} onClick={() => run(-10, 'เสียงดังมาก')} className="flex flex-col items-center gap-1 rounded-xl border border-red-200 bg-red-50 py-3 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50">
                <Minus className="h-4 w-4" /> ดังมาก −10
              </button>
              <button disabled={busy} onClick={() => run(5, 'ประพฤติดี')} className="flex flex-col items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50">
                <Plus className="h-4 w-4" /> คืน +5
              </button>
              <button disabled={busy} onClick={() => run(100 - points, 'รีเซ็ตคะแนน')} className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50">
                <RotateCcw className="h-4 w-4" /> รีเซ็ต 100
              </button>
            </div>
          </div>
        </div>

        {/* ประวัติคะแนน */}
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            <History className="h-4 w-4" /> ประวัติคะแนน ({pointLogs.length})
          </h2>
          {pointLogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-slate-400">
              ยังไม่มีการเปลี่ยนแปลงคะแนน
            </div>
          ) : (
            <div className="space-y-2">
              {pointLogs.map((log) => {
                const positive = log.delta >= 0
                return (
                  <div key={log.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full ${positive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {positive ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{log.reason || 'ปรับคะแนน'}</p>
                        <p className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString('th-TH')}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${positive ? 'text-emerald-600' : 'text-red-600'}`}>
                      {positive ? '+' : ''}{log.delta}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
