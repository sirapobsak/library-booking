// ------------------------------------------------------------
// ข้อมูลห้องทำงาน — โครงสร้างอิงจากผังห้องจริง (ภาพมุมสูง)
// มี 3 โซนในห้องเดียว รวมทั้งหมด 30 ที่นั่ง (เลข 1–30)
//   • โซนโต๊ะบาร์ (Bar PC Counter)         ที่นั่ง 1–8
//   • โซนทำงานส่วนตัวขั้นสุด (Solo Focus Pods) ที่นั่ง 9–20
//   • โซนโต๊ะเดี่ยวสไตล์มินิมอล (Flex Solo Desks) ที่นั่ง 21–30
// พิกัด x,y เป็นเปอร์เซ็นต์บนผังห้อง (อิงตำแหน่งจากรูป)
// ------------------------------------------------------------

// โซน (พื้นที่) ต่าง ๆ ในห้อง
export const AREAS = [
  {
    id: 'bar',
    name: 'Working Space',
    nameTh: 'Working Space',
    description: 'เคาน์เตอร์ทำงานริมหน้าต่าง พร้อมคอมพิวเตอร์ บรรยากาศโปร่ง เหมาะกับงานเร็ว ๆ',
    seatCount: 8,
    range: [1, 8],
    emoji: '🖥️',
    gradient: 'from-slateblue-500 to-slateblue-700',
    accent: 'slateblue',
  },
  {
    id: 'pods',
    name: 'Solo Focus PC Pods',
    nameTh: 'โซนทำงานส่วนตัวขั้นสุด',
    description: 'ห้องเล็กส่วนตัวมีผนังกั้น พร้อมคอมพิวเตอร์ เหมาะกับงานที่ต้องโฟกัสสูง',
    seatCount: 12,
    range: [9, 20],
    emoji: '🧑‍💻',
    gradient: 'from-sage-500 to-sage-700',
    accent: 'sage',
  },
  {
    id: 'flex',
    name: 'Flex Solo Desks',
    nameTh: 'โซนโต๊ะเดี่ยวสไตล์มินิมอล',
    description: 'โต๊ะเดี่ยวยืดหยุ่น จัดเป็นกลุ่ม เหมาะกับการอ่านหนังสือหรือทำงานทั่วไป',
    seatCount: 10,
    range: [21, 30],
    emoji: '🪑',
    gradient: 'from-amber-500 to-orange-600',
    accent: 'amber',
  },
]

// ที่นั่งทั้งหมด 30 ตัว พร้อมพิกัดบนผังห้อง (x,y เป็น %)
export const SEATS = [
  // --- โซนโต๊ะบาร์ (แถวยาวด้านบน ริมหน้าต่าง) ---
  { id: 1, area: 'bar', x: 19, y: 30 },
  { id: 2, area: 'bar', x: 24.5, y: 30 },
  { id: 3, area: 'bar', x: 30, y: 30 },
  { id: 4, area: 'bar', x: 35.5, y: 30 },
  { id: 5, area: 'bar', x: 41, y: 30 },
  { id: 6, area: 'bar', x: 46.5, y: 30 },
  { id: 7, area: 'bar', x: 52, y: 30 },
  { id: 8, area: 'bar', x: 57.5, y: 30 },

  // --- โซน Focus Pods (2 แถว × 6 ช่อง) ---
  { id: 9, area: 'pods', x: 36, y: 41 },
  { id: 10, area: 'pods', x: 43, y: 41 },
  { id: 11, area: 'pods', x: 50, y: 41 },
  { id: 12, area: 'pods', x: 57, y: 41 },
  { id: 13, area: 'pods', x: 65.5, y: 41 },
  { id: 14, area: 'pods', x: 72.5, y: 41 },
  { id: 15, area: 'pods', x: 36, y: 62 },
  { id: 16, area: 'pods', x: 43, y: 62 },
  { id: 17, area: 'pods', x: 50, y: 62 },
  { id: 18, area: 'pods', x: 57, y: 62 },
  { id: 19, area: 'pods', x: 65.5, y: 62 },
  { id: 20, area: 'pods', x: 72.5, y: 62 },

  // --- โซน Flex Desks (กลุ่มโต๊ะด้านล่าง) ---
  { id: 21, area: 'flex', x: 30, y: 80 },
  { id: 22, area: 'flex', x: 39.5, y: 80 },
  { id: 23, area: 'flex', x: 30, y: 91 },
  { id: 24, area: 'flex', x: 39.5, y: 91 },
  { id: 25, area: 'flex', x: 54, y: 80 },
  { id: 26, area: 'flex', x: 64.5, y: 80 },
  { id: 27, area: 'flex', x: 54, y: 91 },
  { id: 28, area: 'flex', x: 64.5, y: 91 },
  { id: 29, area: 'flex', x: 81, y: 80 },
  { id: 30, area: 'flex', x: 81, y: 91 },
]

// หาโซนจาก id
export const getArea = (areaId) => AREAS.find((a) => a.id === areaId)

// ที่นั่งของโซนนั้น ๆ
export const seatsOfArea = (areaId) => SEATS.filter((s) => s.area === areaId)

// หาที่นั่งจากหมายเลข
export const getSeat = (seatId) => SEATS.find((s) => s.id === seatId)

// ป้ายชื่อที่นั่ง เช่น "ที่นั่ง 05"
export const seatLabel = (seatId) => `ที่นั่ง ${String(seatId).padStart(2, '0')}`

// ช่วงเวลาแนะนำ (กดเพื่อเติมเวลาให้เร็ว — แต่ผู้ใช้กรอกเองได้)
export const QUICK_TIMES = [
  { label: 'เช้า', start: '09:00', end: '12:00' },
  { label: 'บ่าย', start: '13:00', end: '16:00' },
  { label: 'เย็น', start: '17:00', end: '20:00' },
]
