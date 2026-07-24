import { SEATS } from '../data.js'

// ------------------------------------------------------------
// ผังห้องมุมสูง (Top-down floor plan)
// วาดเฟอร์นิเจอร์ + ที่นั่งตามตำแหน่งจริง เพื่อให้ผู้ใช้เห็นว่าตัวเองจะนั่งตรงไหน
// props:
//   activeArea  = โซนที่กำลังเลือก (ไฮไลต์)
//   selectedId  = ที่นั่งที่กำลังจะจอง
//   isSeatBooked(id) = ฟังก์ชันเช็คว่าจองแล้วไหม
//   onSelect(seat)   = คลิกที่นั่งว่าง
// ------------------------------------------------------------
export default function RoomFloorPlan({ activeArea, selectedId, isSeatBooked, onSelect }) {
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div
        className="relative w-full overflow-hidden rounded-3xl border border-slate-200 shadow-inner"
        style={{ aspectRatio: '782 / 517', background: '#cfcac1' }}
      >
        {/* พื้นห้อง (ลายไล่เฉด) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 90% at 30% 20%, #e7e2d8 0%, #d8d2c6 45%, #c7c1b5 100%)',
          }}
        />

        {/* หน้าต่างกระจกบานใหญ่ ด้านซ้าย */}
        <div
          className="absolute left-0 top-0 h-full w-[6%]"
          style={{
            background:
              'repeating-linear-gradient(180deg, #bfe0e6 0 22px, #a9d2d9 22px 24px)',
            boxShadow: 'inset -6px 0 10px -6px rgba(0,0,0,.25)',
          }}
        />

        {/* ประตูทางเข้า (ด้านบนกลางค่อนขวา) */}
        <div
          className="absolute rounded-sm"
          style={{ left: '61%', top: '0.5%', width: '9%', height: '5%', background: '#6b4b32' }}
          title="ทางเข้า–ออก"
        />

        {/* เคาน์เตอร์บาร์ (หลังที่นั่ง 1–8) */}
        <FurnitureBar active={activeArea === 'bar'} />

        {/* มุมพิมพ์เอกสาร & สแกน (ขวาบน) */}
        <div
          className="absolute flex flex-col items-center justify-center gap-1 rounded-md border border-black/10"
          style={{ left: '75%', top: '8%', width: '21%', height: '17%', background: '#7a5638' }}
        >
          <div className="flex gap-1">
            <span className="h-4 w-4 rounded-sm bg-slate-100" />
            <span className="h-4 w-4 rounded-sm bg-slate-300" />
          </div>
          <span className="text-[7px] font-semibold leading-none text-amber-50 sm:text-[9px]">
            Print & Scan
          </span>
        </div>

        {/* บล็อกห้อง Focus Pods (หลังที่นั่ง 9–20) */}
        <FurniturePods active={activeArea === 'pods'} />

        {/* กลุ่มโต๊ะ Flex Desks (หลังที่นั่ง 21–30) */}
        <FurnitureFlex active={activeArea === 'flex'} />

        {/* ต้นไม้ประดับ */}
        {PLANTS.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.s}%`,
              aspectRatio: '1',
              transform: 'translate(-50%,-50%)',
              background: 'radial-gradient(circle at 35% 30%, #7bbf7f, #2f6b3a 70%)',
              boxShadow: '0 2px 6px rgba(0,0,0,.25)',
            }}
          />
        ))}

        {/* ------- ที่นั่งทั้งหมด ------- */}
        {SEATS.map((seat) => {
          const booked = isSeatBooked(seat.id)
          const selected = selectedId === seat.id
          const dim = activeArea && seat.area !== activeArea

          let cls =
            'bg-emerald-500 ring-2 ring-white text-white hover:scale-110 hover:bg-emerald-600 cursor-pointer'
          if (booked)
            cls = 'bg-red-500 ring-2 ring-white text-white cursor-not-allowed'
          if (selected)
            cls =
              'bg-amber-400 ring-4 ring-amber-200 text-amber-900 scale-110 cursor-pointer z-20'

          return (
            <button
              key={seat.id}
              disabled={booked}
              onClick={() => onSelect(seat)}
              title={`${seatTitle(seat.id)} · ${booked ? 'จองแล้ว' : 'ว่าง'}`}
              className={`absolute flex items-center justify-center rounded-full text-[9px] font-bold shadow-md transition-all sm:text-xs ${cls} ${
                dim ? 'opacity-45' : ''
              }`}
              style={{
                left: `${seat.x}%`,
                top: `${seat.y}%`,
                width: 'clamp(18px, 3.4%, 30px)',
                height: 'clamp(18px, 3.4%, 30px)',
                transform: 'translate(-50%,-50%)',
              }}
            >
              {seat.id}
            </button>
          )
        })}

        {/* ป้ายชื่อโซนลอยบนผัง */}
        <AreaTag x={26} y={13} text="โซนโต๊ะบาร์ · Bar Counter (8)" active={activeArea === 'bar'} />
        <AreaTag x={13} y={51} text="Focus Pods (12)" active={activeArea === 'pods'} />
        <AreaTag x={13} y={73} text="Flex Desks (10)" active={activeArea === 'flex'} />
      </div>
    </div>
  )
}

// ชื่อที่นั่ง + โซน สำหรับ tooltip
function seatTitle(id) {
  const seat = SEATS.find((s) => s.id === id)
  const names = { bar: 'โซนโต๊ะบาร์', pods: 'Focus Pods', flex: 'Flex Desks' }
  return `ที่นั่ง ${id} (${names[seat.area]})`
}

// ---------- เฟอร์นิเจอร์ ----------
function FurnitureBar({ active }) {
  return (
    <div
      className="absolute rounded-lg border border-black/10"
      style={{
        left: '15%',
        top: '19%',
        width: '48%',
        height: '10%',
        background: active
          ? 'linear-gradient(180deg,#b98a56,#8a6440)'
          : 'linear-gradient(180deg,#8a6440,#6f4e30)',
        boxShadow: active ? '0 0 0 2px #4a6fae inset' : 'none',
      }}
    >
      {/* จอคอมบนเคาน์เตอร์ */}
      <div className="flex h-full items-center justify-around px-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="h-2.5 w-3 rounded-[1px] bg-slate-800/80 sm:h-3 sm:w-4" />
        ))}
      </div>
    </div>
  )
}

function FurniturePods({ active }) {
  return (
    <div
      className="absolute grid grid-cols-6 grid-rows-2 gap-[3px] rounded-lg p-[3px]"
      style={{
        left: '32%',
        top: '33%',
        width: '46%',
        height: '37%',
        background: active ? '#7fa886' : '#9aa19a',
        boxShadow: active ? '0 0 0 2px #548c5b inset' : 'none',
      }}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[3px] border border-black/10"
          style={{ background: '#8a6440' }}
        >
          <span className="mx-auto mt-[3px] block h-1.5 w-3 rounded-[1px] bg-slate-800/70" />
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
          className="absolute rounded-lg border border-black/10"
          style={{
            left: g.left,
            top: '75%',
            width: g.width,
            height: '21%',
            background: active ? '#a97b4d' : '#7a5638',
            boxShadow: active ? '0 0 0 2px #b45309 inset' : 'none',
          }}
        />
      ))}
    </>
  )
}

function AreaTag({ x, y, text, active }) {
  return (
    <span
      className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[7px] font-semibold shadow sm:text-[10px] ${
        active ? 'bg-slate-800 text-white' : 'bg-white/85 text-slate-600'
      }`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {text}
    </span>
  )
}

// ตำแหน่งต้นไม้ (x,y,size %)
const PLANTS = [
  { x: 45, y: 12, s: 4 },
  { x: 27, y: 44, s: 5 },
  { x: 79, y: 45, s: 4 },
  { x: 46, y: 51, s: 3.5 },
  { x: 12, y: 88, s: 5 },
  { x: 47, y: 85, s: 4 },
  { x: 72, y: 86, s: 4 },
]
