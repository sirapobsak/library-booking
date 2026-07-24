import { SEATS } from '../data.js'

// ------------------------------------------------------------
// ผังห้องมุมสูง (Top-down floor plan) — ปรับให้สวย + ที่นั่งใหญ่ชัด
// props:
//   activeArea  = โซนที่กำลังเลือก (ไฮไลต์)
//   selectedId  = ที่นั่งที่กำลังจะจอง
//   isSeatBooked(id) = ฟังก์ชันเช็คว่าจองแล้วไหม
//   onSelect(seat)   = คลิกที่นั่งว่าง
// ------------------------------------------------------------
export default function RoomFloorPlan({ activeArea, selectedId, isSeatBooked, onSelect }) {
  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div
        className="relative w-full overflow-hidden rounded-[28px] border border-slate-300/70 shadow-xl"
        style={{ aspectRatio: '782 / 517' }}
      >
        {/* พื้นห้อง (ไม้อ่อน + แสงนุ่ม) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(130% 100% at 28% 15%, #efe9dd 0%, #e2dbcc 40%, #cdc4b2 100%)',
          }}
        />
        {/* เงามุมห้องให้ดูมีมิติ */}
        <div
          className="absolute inset-0"
          style={{ boxShadow: 'inset 0 0 90px 10px rgba(90,70,40,.18)' }}
        />

        {/* หน้าต่างกระจกบานใหญ่ ด้านซ้าย */}
        <div
          className="absolute left-0 top-0 h-full w-[6.5%]"
          style={{
            background:
              'linear-gradient(90deg,#a9d2d9,#c3e3e8), repeating-linear-gradient(180deg, rgba(255,255,255,.55) 0 2px, transparent 2px 30px)',
            borderRight: '3px solid #8a6440',
            boxShadow: 'inset -8px 0 14px -8px rgba(0,0,0,.3)',
          }}
        />
        {/* คานหน้าต่างแนวนอน */}
        {[20, 45, 70].map((t) => (
          <div
            key={t}
            className="absolute left-0 w-[6.5%]"
            style={{ top: `${t}%`, height: '3px', background: '#8a6440', opacity: 0.7 }}
          />
        ))}

        {/* ประตูทางเข้า (บนกลางค่อนขวา) */}
        <div
          className="absolute rounded-b-md border border-black/10"
          style={{
            left: '61%',
            top: '0',
            width: '9%',
            height: '5.5%',
            background: 'linear-gradient(180deg,#8a5a34,#6b4526)',
          }}
          title="ทางเข้า–ออก"
        />

        {/* เคาน์เตอร์ Working Space (หลังที่นั่ง 1–8) */}
        <FurnitureBar active={activeArea === 'bar'} />

        {/* มุมพิมพ์เอกสาร & สแกน (ขวาบน) */}
        <div
          className="absolute flex flex-col items-center justify-center gap-1 rounded-lg border border-black/10 shadow-md"
          style={{
            left: '75%',
            top: '8%',
            width: '21%',
            height: '17%',
            background: 'linear-gradient(180deg,#8a6238,#6f4d2c)',
          }}
        >
          <div className="flex gap-1">
            <span className="h-4 w-4 rounded-sm bg-slate-100 shadow-inner" />
            <span className="h-4 w-4 rounded-sm bg-slate-300 shadow-inner" />
          </div>
          <span className="text-[7px] font-semibold leading-none text-amber-50 sm:text-[9px]">
            Print &amp; Scan
          </span>
        </div>

        {/* บล็อกห้อง Focus Pods (หลังที่นั่ง 9–20) */}
        <FurniturePods active={activeArea === 'pods'} />

        {/* กลุ่มโต๊ะ Flex Desks (หลังที่นั่ง 21–30) */}
        <FurnitureFlex active={activeArea === 'flex'} />

        {/* ต้นไม้ประดับ (มีกระถาง + เงา) */}
        {PLANTS.map((p, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.s}%`,
              aspectRatio: '1',
              transform: 'translate(-50%,-50%)',
            }}
          >
            <span
              className="block h-full w-full rounded-full"
              style={{
                background:
                  'radial-gradient(circle at 35% 28%, #8fd08f 0%, #4e9c58 45%, #2f6b3a 100%)',
                boxShadow: '0 3px 8px rgba(0,0,0,.28), inset 0 -3px 6px rgba(0,0,0,.25)',
              }}
            />
          </div>
        ))}

        {/* ------- ที่นั่งทั้งหมด (ปุ่มจอง) ------- */}
        {SEATS.map((seat) => {
          const booked = isSeatBooked(seat.id)
          const selected = selectedId === seat.id
          const dim = activeArea && seat.area !== activeArea

          let inner =
            'text-white ring-[3px] ring-white cursor-pointer hover:scale-125 hover:z-20'
          let bg = 'linear-gradient(160deg,#34d399,#059669)' // ว่าง = เขียว
          let pulse = !dim // ที่นั่งว่างในโซนที่เลือก = กระเพื่อม
          if (booked) {
            inner = 'text-white ring-[3px] ring-white cursor-not-allowed'
            bg = 'linear-gradient(160deg,#f87171,#dc2626)'
            pulse = false
          }
          if (selected) {
            inner = 'text-amber-900 ring-4 ring-amber-200 scale-125 z-30 cursor-pointer'
            bg = 'linear-gradient(160deg,#fcd34d,#f59e0b)'
            pulse = false
          }

          return (
            <button
              key={seat.id}
              disabled={booked}
              onClick={() => onSelect(seat)}
              title={`${seatTitle(seat.id)} · ${booked ? 'จองแล้ว' : 'ว่าง — คลิกเพื่อจอง'}`}
              className={`absolute flex items-center justify-center rounded-full text-[11px] font-extrabold shadow-lg transition-all duration-200 sm:text-sm ${inner} ${
                pulse ? 'seat-pulse' : ''
              } ${dim ? 'opacity-40' : ''}`}
              style={{
                left: `${seat.x}%`,
                top: `${seat.y}%`,
                width: 'clamp(24px, 4.6%, 42px)',
                aspectRatio: '1', // ให้เป็นวงกลมเสมอ (สูง = กว้าง)
                background: bg,
                transform: 'translate(-50%,-50%)',
              }}
            >
              {seat.id}
            </button>
          )
        })}

        {/* ป้ายชื่อโซนลอยบนผัง */}
        <AreaTag x={25} y={13} text="Working Space (8)" active={activeArea === 'bar'} />
        <AreaTag x={13} y={51} text="Focus Pods (12)" active={activeArea === 'pods'} />
        <AreaTag x={13} y={73} text="Flex Desks (10)" active={activeArea === 'flex'} />
      </div>

      {/* คำใบ้ใต้ผัง */}
      <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
        <span className="inline-flex h-4 w-4 animate-pulse items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white">
          ✓
        </span>
        แตะที่นั่ง <b className="text-emerald-600">สีเขียว</b> ที่กระพริบเพื่อเลือกและจอง
      </p>
    </div>
  )
}

// ชื่อที่นั่ง + โซน สำหรับ tooltip
function seatTitle(id) {
  const seat = SEATS.find((s) => s.id === id)
  const names = { bar: 'Working Space', pods: 'Focus Pods', flex: 'Flex Desks' }
  return `ที่นั่ง ${id} (${names[seat.area]})`
}

// ---------- เฟอร์นิเจอร์ ----------
function FurnitureBar({ active }) {
  return (
    <div
      className="absolute rounded-xl border border-black/10 shadow-md"
      style={{
        left: '15%',
        top: '18.5%',
        width: '48%',
        height: '10.5%',
        background: 'linear-gradient(180deg,#a4733f,#7d5530)',
        outline: active ? '3px solid #4a6fae' : 'none',
        outlineOffset: '2px',
      }}
    >
      {/* จอคอมบนเคาน์เตอร์ */}
      <div className="flex h-full items-center justify-around px-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className="h-3 w-4 rounded-[2px] sm:h-3.5 sm:w-5"
            style={{
              background: 'linear-gradient(180deg,#2b3a55,#1e293b)',
              boxShadow: '0 0 4px rgba(120,170,255,.4)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

function FurniturePods({ active }) {
  return (
    <div
      className="absolute grid grid-cols-6 grid-rows-2 gap-[4px] rounded-xl p-[4px] shadow-md"
      style={{
        left: '32%',
        top: '33%',
        width: '46%',
        height: '37%',
        background: active
          ? 'linear-gradient(180deg,#8fb896,#6f9a77)'
          : 'linear-gradient(180deg,#b3b7ad,#9aa093)',
        outline: active ? '3px solid #548c5b' : 'none',
        outlineOffset: '2px',
      }}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="rounded-md border border-black/10"
          style={{ background: 'linear-gradient(180deg,#a4733f,#7d5530)' }}
        >
          <span
            className="mx-auto mt-[4px] block h-2 w-3.5 rounded-[2px]"
            style={{ background: 'linear-gradient(180deg,#2b3a55,#1e293b)' }}
          />
        </div>
      ))}
    </div>
  )
}

function FurnitureFlex({ active }) {
  // กลุ่มโต๊ะ 3 กลุ่ม ตามรูป (ซ้าย / กลาง / ขวา)
  const groups = [
    { left: '27%', width: '16%' },
    { left: '50%', width: '18%' },
    { left: '77.5%', width: '7%' },
  ]
  return (
    <>
      {groups.map((g, i) => (
        <div
          key={i}
          className="absolute rounded-xl border border-black/10 shadow-md"
          style={{
            left: g.left,
            top: '75%',
            width: g.width,
            height: '21%',
            background: 'linear-gradient(180deg,#a4733f,#7d5530)',
            outline: active ? '3px solid #b45309' : 'none',
            outlineOffset: '2px',
          }}
        />
      ))}
    </>
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
  { x: 45, y: 12, s: 4.5 },
  { x: 27, y: 44, s: 5.5 },
  { x: 79, y: 45, s: 4.5 },
  { x: 46, y: 51, s: 3.8 },
  { x: 12, y: 88, s: 5.5 },
  { x: 47, y: 85, s: 4.5 },
  { x: 72, y: 86, s: 4.5 },
]
