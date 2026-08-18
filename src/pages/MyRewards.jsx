import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Coins,
  Gift,
  Plus,
  Minus,
  History,
  Info,
  Lock,
  CheckCircle2,
  DoorClosed,
  RotateCcw,
} from 'lucide-react'
import Header from '../components/Header.jsx'
import { useStore } from '../store.jsx'
import { SPONSOR_REWARDS, MEETING_GATE_MIN } from '../data.js'

export default function MyRewards() {
  const navigate = useNavigate()
  const { currentUser, rewardLogs, adjustRewardPoints, redeemReward, pushToast } = useStore()
  const [busy, setBusy] = useState(false)

  const points = currentUser?.rewardPoints ?? 0
  const meetingLocked = points < MEETING_GATE_MIN

  const run = async (fn, okMsg) => {
    setBusy(true)
    try {
      await fn()
      if (okMsg) pushToast(okMsg, 'success')
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

        {/* การ์ดคะแนนสะสม */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className={`flex flex-col items-center px-6 py-8 text-center text-white ${points < 0 ? 'bg-gradient-to-br from-red-500 to-rose-700' : 'bg-gradient-to-br from-slateblue-500 to-slateblue-700'}`}>
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide opacity-90">
              <Coins className="h-4 w-4" /> คะแนนสะสม
            </span>
            <p className="mt-3 text-6xl font-extrabold leading-none">{points}</p>
            <p className="mt-2 text-sm opacity-90">
              {currentUser?.firstName} {currentUser?.lastName}
            </p>
          </div>

          {/* สถานะสิทธิพิเศษ: จองห้องประชุม */}
          <div className={`mx-6 mt-5 flex items-center gap-3 rounded-2xl p-4 ${meetingLocked ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meetingLocked ? 'bg-red-500' : 'bg-emerald-500'} text-white`}>
              {meetingLocked ? <Lock className="h-5 w-5" /> : <DoorClosed className="h-5 w-5" />}
            </span>
            <div className="text-sm">
              <p className="font-bold">
                {meetingLocked ? 'จองห้องประชุมไม่ได้' : 'จองห้องประชุมได้ปกติ'}
              </p>
              <p className="text-xs opacity-90">
                {meetingLocked
                  ? `คะแนนสะสมติดลบเกิน ${-MEETING_GATE_MIN} — เพิ่มคะแนนให้มากกว่า ${MEETING_GATE_MIN} เพื่อปลดล็อก`
                  : `ถ้าคะแนนต่ำกว่า ${MEETING_GATE_MIN} จะจองห้องประชุมไม่ได้`}
              </p>
            </div>
          </div>

          {/* แผงทดสอบ */}
          <div className="p-6">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Info className="h-4 w-4" /> ทดสอบระบบ (เพิ่ม/ลดคะแนน — ติดลบได้)
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button disabled={busy} onClick={() => run(() => adjustRewardPoints(10, 'รับคะแนนสะสม'), '+10 คะแนน')} className="flex flex-col items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50">
                <Plus className="h-4 w-4" /> +10
              </button>
              <button disabled={busy} onClick={() => run(() => adjustRewardPoints(50, 'รับคะแนนสะสม'), '+50 คะแนน')} className="flex flex-col items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50">
                <Plus className="h-4 w-4" /> +50
              </button>
              <button disabled={busy} onClick={() => run(() => adjustRewardPoints(-10, 'หักคะแนนสะสม'), '−10 คะแนน')} className="flex flex-col items-center gap-1 rounded-xl border border-red-200 bg-red-50 py-3 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50">
                <Minus className="h-4 w-4" /> −10
              </button>
              <button disabled={busy} onClick={() => run(() => adjustRewardPoints(-60, 'หักคะแนนสะสม'), '−60 คะแนน')} className="flex flex-col items-center gap-1 rounded-xl border border-red-200 bg-red-50 py-3 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50">
                <Minus className="h-4 w-4" /> −60
              </button>
            </div>
          </div>
        </div>

        {/* ของรางวัลจากสปอนเซอร์ */}
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            <Gift className="h-4 w-4" /> แลกของรางวัลจากสปอนเซอร์
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {SPONSOR_REWARDS.map((r) => {
              const canRedeem = points >= r.cost && !busy
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-2xl">
                    {r.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{r.name}</p>
                    <p className="text-xs text-slate-400">โดย {r.sponsor}</p>
                    <p className="mt-0.5 text-xs font-bold text-slateblue-600">{r.cost} คะแนน</p>
                  </div>
                  <button
                    disabled={!canRedeem}
                    onClick={() =>
                      run(async () => {
                        await redeemReward(r.cost, r.name)
                        pushToast(`แลก "${r.name}" สำเร็จ! 🎉`, 'success')
                      })
                    }
                    className="shrink-0 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    แลก
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* ประวัติคะแนนสะสม */}
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            <History className="h-4 w-4" /> ประวัติคะแนนสะสม ({rewardLogs.length})
          </h2>
          {rewardLogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-slate-400">
              ยังไม่มีการเปลี่ยนแปลงคะแนนสะสม
            </div>
          ) : (
            <div className="space-y-2">
              {rewardLogs.map((log) => {
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
