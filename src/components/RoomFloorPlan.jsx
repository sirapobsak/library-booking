import { SEATS } from '../data.js'

// ------------------------------------------------------------
// ผังห้องมุมสูง (Top-down floor plan) — อิงจากรูปสเก็ตช์
//   • Working Space (เคาน์เตอร์บาร์) 1–10  ด้านบนริมหน้าต่าง
//   • Focus Pods (โต๊ะมีที่กั้น) 11–20     2 แถว × 5
//   • Meeting Rooms (ห้องประชุมกล่องใหญ่) 21–23  ด้านล่าง
// props: activeArea, selectedId, isSeatBooked(id), onSelect(seat)
// ------------------------------------------------------------
export default function RoomFloorPlan({ activeArea, selectedId, isSeatBooked, onSelect }) {
  const circleSeats = SEATS.filter((s) => s.kind !== 'room')
  const roomSeats = SEATS.filter((s) => s.kind === 'room')

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div
        className="relative w-full overflow-hidden rounded-[28px] border border-slate-300/70 shadow-xl"
        style={{ aspectRatio: '1.45' }}
      >
        {/* พื้นห้อง */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(130% 100% at 30% 12%, #efe9dd 0%, #e2dbcc 42%, #cdc4b2 100%)',
          }}
        />
        <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 90px 10px rgba(90,70,40,.16)' }} />

        {/* หน้าต่างกระจก ด้านซ้าย (ยาวเต็ม) */}
        <WindowStrip side="left" top="0" height="100%" />
        {/* หน้าต่างกระจก ด้านขวา (ช่วงกลาง) */}
        <WindowStrip side="right" top="28%" height="40%" label="หน้าต่าง" />

        {/* ประตู — ย้ายมาอยู่ช่องว่างด้านขวา (ระหว่างเคาน์เตอร์กับมุมพิมพ์) */}
        <div
          className="absolute flex items-center justify-center rounded-b-md border border-black/10 text-[7px] font-bold text-amber-50 sm:text-[9px]"
          style={{ left: '70%', top: '0', width: '11%', height: '5%', background: 'linear-gradient(180deg,#8a5a34,#6b4526)' }}
        >
          DOOR
        </div>

        {/* มุมพิมพ์ & สแกน (ขวาบน) */}
        <div
          className="absolute flex flex-col items-stretch gap-1 rounded-lg border border-black/10 p-1.5 shadow-md"
          style={{ left: '86%', top: '6%', width: '12%', height: '17%', background: 'linear-gradient(180deg,#8a6238,#6f4d2c)' }}
        >
          <span className="flex-1 rounded-sm bg-amber-50/90 text-center text-[6px] font-bold leading-[1.6] text-slate-700 sm:text-[8px]">Printer</span>
          <span className="flex-1 rounded-sm bg-amber-50/90 text-center text-[6px] font-bold leading-[1.6] text-slate-700 sm:text-[8px]">Scanner</span>
        </div>

        {/* เคาน์เตอร์ Working Space (หลังที่นั่ง 1–10) */}
        <div
          className="absolute rounded-lg border-2 shadow-md"
          style={{
            left: '4.5%', top: '7%', width: '58%', height: '11%',
            background: 'linear-gradient(180deg,#a4733f,#7d5530)',
            borderColor: activeArea === 'bar' ? '#4a6fae' : 'rgba(0,0,0,.1)',
          }}
        >
          <div className="flex h-full items-center justify-around px-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className="h-2.5 w-3.5 rounded-[2px]" style={{ background: 'linear-gradient(180deg,#2b3a55,#1e293b)', boxShadow: '0 0 4px rgba(120,170,255,.4)' }} />
            ))}
          </div>
        </div>

        {/* บล็อกโต๊ะมีที่กั้น (หลังที่นั่ง 11–20) — 5 คอลัมน์ × 2 แถว */}
        <div
          className="absolute grid grid-cols-5 grid-rows-2 gap-[4px] rounded-xl p-[5px] shadow-md"
          style={{
            left: '25%', top: '28%', width: '54%', height: '26%',
            background: activeArea === 'pods' ? '#8fb896' : '#b3b7ad',
            outline: activeArea === 'pods' ? '3px solid #548c5b' : 'none', outlineOffset: '2px',
          }}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-[4px] border border-black/10" style={{ background: 'linear-gradient(180deg,#a4733f,#7d5530)' }}>
              <span className="mx-auto mt-[3px] block h-1.5 w-3 rounded-[1px]" style={{ background: 'linear-gradient(180deg,#2b3a55,#1e293b)' }} />
            </div>
          ))}
        </div>

        {/* ต้นไม้ประดับ */}
        {PLANTS.map((p, i) => (
          <span key={i} className="absolute rounded-full" style={{
            left: `${p.x}%`, top: `${p.y}%`, width: `${p.s}%`, aspectRatio: '1', transform: 'translate(-50%,-50%)',
            background: 'radial-gradient(circle at 35% 28%, #8fd08f 0%, #4e9c58 45%, #2f6b3a 100%)',
            boxShadow: '0 3px 8px rgba(0,0,0,.28), inset 0 -3px 6px rgba(0,0,0,.25)',
          }} />
        ))}

        {/* ------- ห้องประชุมกล่องใหญ่ (21–23) : กดจองได้ ------- */}
        {roomSeats.map((seat) => {
          const booked = isSeatBooked(seat.id)
          const selected = selectedId === seat.id
          const dim = activeArea && seat.area !== activeArea
          let bg = 'linear-gradient(160deg,#5bbf6a,#2f8f45)'
          let label = 'ว่าง'
          if (booked) { bg = 'linear-gradient(160deg,#ef6b6b,#c92c2c)'; label = 'จองแล้ว' }
          if (selected) { bg = 'linear-gradient(160deg,#fcd34d,#f59e0b)'; label = 'กำลังเลือก' }
          return (
            <button
              key={seat.id}
              disabled={booked}
              onClick={() => onSelect(seat)}
              title={`Meeting Room ${seat.id} · ${booked ? 'จองแล้ว' : 'ว่าง — คลิกเพื่อจอง'}`}
              className={`absolute flex flex-col items-center justify-center rounded-2xl border-2 border-white/70 font-extrabold text-white shadow-lg transition-all duration-200 hover:brightness-105 ${
                !booked && !selected && !dim ? 'seat-pulse' : ''
              } ${dim ? 'opacity-40' : ''} ${booked ? 'cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'}`}
              style={{
                left: `${seat.x}%`, top: `${seat.y}%`, width: '25%', height: '30%',
                transform: 'translate(-50%,-50%)', background: bg,
              }}
            >
              <span className="text-2xl sm:text-4xl">{seat.id}</span>
              <span className="mt-1 text-[9px] font-semibold sm:text-xs">Meeting Room · {label}</span>
            </button>
          )
        })}

        {/* ------- ที่นั่งวงกลม (Working Space + Focus Pods) ------- */}
        {circleSeats.map((seat) => {
          const booked = isSeatBooked(seat.id)
          const selected = selectedId === seat.id
          const dim = activeArea && seat.area !== activeArea
          let inner = 'text-white ring-[3px] ring-white cursor-pointer hover:scale-125 hover:z-20'
          let bg = 'linear-gradient(160deg,#34d399,#059669)'
          let pulse = !dim
          if (booked) { inner = 'text-white ring-[3px] ring-white cursor-not-allowed'; bg = 'linear-gradient(160deg,#f87171,#dc2626)'; pulse = false }
          if (selected) { inner = 'text-amber-900 ring-4 ring-amber-200 scale-125 z-30 cursor-pointer'; bg = 'linear-gradient(160deg,#fcd34d,#f59e0b)'; pulse = false }
          return (
            <button
              key={seat.id}
              disabled={booked}
              onClick={() => onSelect(seat)}
              title={`ที่นั่ง ${seat.id} · ${booked ? 'จองแล้ว' : 'ว่าง — คลิกเพื่อจอง'}`}
              className={`absolute flex items-center justify-center rounded-full text-[11px] font-extrabold shadow-lg transition-all duration-200 sm:text-sm ${inner} ${pulse ? 'seat-pulse' : ''} ${dim ? 'opacity-40' : ''}`}
              style={{
                left: `${seat.x}%`, top: `${seat.y}%`,
                width: 'clamp(22px, 4.2%, 40px)', aspectRatio: '1', background: bg,
                transform: 'translate(-50%,-50%)',
              }}
            >
              {seat.id}
            </button>
          )
        })}

        {/* ป้ายชื่อโซน */}
        <AreaTag x={33} y={4} text="Counter Bar (10)" active={activeArea === 'bar'} />
        <AreaTag x={13} y={41} text="Computer Table (10)" active={activeArea === 'pods'} />
        <AreaTag x={11} y={63} text="Meeting Room (3)" active={activeArea === 'meeting'} />
      </div>

      {/* คำใบ้ใต้ผัง */}
      <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
        <span className="inline-flex h-4 w-4 animate-pulse items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white">✓</span>
        แตะที่นั่ง/ห้อง <b className="text-emerald-600">สีเขียว</b> ที่กระพริบเพื่อเลือกและจอง
      </p>
    </div>
  )
}

// ---------- ชิ้นส่วนย่อย ----------
function WindowStrip({ side, top, height, label }) {
  return (
    <div
      className="absolute"
      style={{
        [side]: 0, top, height, width: '5%',
        background:
          'linear-gradient(90deg,#a9d2d9,#c3e3e8), repeating-linear-gradient(180deg, rgba(255,255,255,.55) 0 2px, transparent 2px 30px)',
        [side === 'left' ? 'borderRight' : 'borderLeft']: '3px solid #8a6440',
        boxShadow: side === 'left' ? 'inset -8px 0 14px -8px rgba(0,0,0,.3)' : 'inset 8px 0 14px -8px rgba(0,0,0,.3)',
      }}
    >
      {label && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap text-[8px] font-semibold text-slate-500 sm:text-[10px]">
          {label}
        </span>
      )}
    </div>
  )
}

function AreaTag({ x, y, text, active }) {
  return (
    <span
      className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg px-2 py-1 text-[8px] font-bold shadow-md transition sm:text-[11px] ${
        active ? 'scale-105 bg-slate-800 text-white' : 'bg-white/90 text-slate-600'
      }`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {text}
    </span>
  )
}

// ตำแหน่งต้นไม้ (x,y,size %)
const PLANTS = [
  { x: 65, y: 12, s: 4.5 },
  { x: 19, y: 40, s: 5 },
  { x: 82, y: 40, s: 4.5 },
]
