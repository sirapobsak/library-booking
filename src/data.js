// ------------------------------------------------------------
// ข้อมูลห้องทำงาน — โครงสร้างอิงจากผังห้องจริง (ภาพมุมสูง)
// รวมทั้งหมด 23 ที่นั่ง (เลข 1–23)
//   • Working Space (เคาน์เตอร์บาร์)        ที่นั่ง 1–10
//   • Focus Pods (โต๊ะมีที่กั้น)            ที่นั่ง 11–20 (2 แถว × 5)
//   • Meeting Rooms (ห้องประชุม)           ห้อง 21–23
// พิกัด x,y เป็นเปอร์เซ็นต์บนผังห้อง (อิงตำแหน่งจากรูป)
// ------------------------------------------------------------

export const AREAS = [
  {
    id: 'bar',
    name: 'Counter Bar',
    nameTh: 'Counter Bar',
    description: 'เคาน์เตอร์ทำงานริมหน้าต่าง พร้อมคอมพิวเตอร์ บรรยากาศโปร่ง เหมาะกับงานเร็ว ๆ',
    seatCount: 10,
    range: [1, 10],
    emoji: '🖥️',
    gradient: 'from-slateblue-500 to-slateblue-700',
    accent: 'slateblue',
  },
  {
    id: 'pods',
    name: 'Computer Table',
    nameTh: 'Computer Table',
    description: 'โต๊ะคอมพิวเตอร์มีที่กั้นเป็นส่วนตัว 2 แถว เหมาะกับงานที่ต้องโฟกัสสูง',
    seatCount: 10,
    range: [11, 20],
    emoji: '🧑‍💻',
    gradient: 'from-sage-500 to-sage-700',
    accent: 'sage',
  },
  {
    id: 'meeting',
    name: 'Meeting Room',
    nameTh: 'Meeting Room',
    description: 'ห้องประชุมส่วนตัวขนาดใหญ่ 3 ห้อง เหมาะกับการประชุมกลุ่ม',
    seatCount: 3,
    range: [21, 23],
    emoji: '🧑‍🤝‍🧑',
    gradient: 'from-amber-500 to-orange-600',
    accent: 'amber',
  },
]

// ที่นั่งทั้งหมด 23 ตัว พร้อมพิกัดบนผังห้อง (x,y เป็น %)
// kind: 'room' = ห้องประชุมกล่องใหญ่ (กดจองได้เหมือนกัน)
export const SEATS = [
  // --- Working Space (เคาน์เตอร์บาร์ยาวด้านบน ริมหน้าต่าง) 1–10 ---
  { id: 1, area: 'bar', x: 8, y: 13 },
  { id: 2, area: 'bar', x: 13.6, y: 13 },
  { id: 3, area: 'bar', x: 19.2, y: 13 },
  { id: 4, area: 'bar', x: 24.8, y: 13 },
  { id: 5, area: 'bar', x: 30.4, y: 13 },
  { id: 6, area: 'bar', x: 36, y: 13 },
  { id: 7, area: 'bar', x: 41.6, y: 13 },
  { id: 8, area: 'bar', x: 47.2, y: 13 },
  { id: 9, area: 'bar', x: 52.8, y: 13 },
  { id: 10, area: 'bar', x: 58.4, y: 13 },

  // --- Focus Pods (โต๊ะมีที่กั้น 2 แถว × 5) 11–20 ---
  { id: 11, area: 'pods', x: 31, y: 35 },
  { id: 12, area: 'pods', x: 41.5, y: 35 },
  { id: 13, area: 'pods', x: 52, y: 35 },
  { id: 14, area: 'pods', x: 62.5, y: 35 },
  { id: 15, area: 'pods', x: 73, y: 35 },
  { id: 16, area: 'pods', x: 31, y: 47 },
  { id: 17, area: 'pods', x: 41.5, y: 47 },
  { id: 18, area: 'pods', x: 52, y: 47 },
  { id: 19, area: 'pods', x: 62.5, y: 47 },
  { id: 20, area: 'pods', x: 73, y: 47 },

  // --- Meeting Rooms (ห้องประชุมกล่องใหญ่) 21–23 ---
  { id: 21, area: 'meeting', kind: 'room', x: 18, y: 80 },
  { id: 22, area: 'meeting', kind: 'room', x: 46, y: 80 },
  { id: 23, area: 'meeting', kind: 'room', x: 74, y: 80 },
]

// หาโซนจาก id
export const getArea = (areaId) => AREAS.find((a) => a.id === areaId)

// ที่นั่งของโซนนั้น ๆ
export const seatsOfArea = (areaId) => SEATS.filter((s) => s.area === areaId)

// หาที่นั่งจากหมายเลข
export const getSeat = (seatId) => SEATS.find((s) => s.id === seatId)

// ป้ายชื่อที่นั่ง เช่น "ที่นั่ง 05" / ห้องประชุมใช้คำว่า "ห้อง"
export const seatLabel = (seatId) => {
  const seat = getSeat(seatId)
  const prefix = seat?.kind === 'room' ? 'Meeting Room' : 'ที่นั่ง'
  return `${prefix} ${String(seatId).padStart(2, '0')}`
}

// ช่วงเวลาแนะนำ (กดเพื่อเติมเวลาให้เร็ว — แต่ผู้ใช้กรอกเองได้)
export const QUICK_TIMES = [
  { label: 'เช้า', start: '09:00', end: '12:00' },
  { label: 'บ่าย', start: '13:00', end: '16:00' },
  { label: 'เย็น', start: '17:00', end: '20:00' },
]
