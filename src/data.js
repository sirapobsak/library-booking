// ------------------------------------------------------------
// ข้อมูลจำลอง (Mock Data) สำหรับระบบจองห้องสมุด
// แก้ตรงนี้ได้เลยถ้าอยากเปลี่ยนจำนวนโต๊ะ / โซน / ช่วงเวลา
// ------------------------------------------------------------

// ช่วงเวลาที่ให้จอง
export const TIME_SLOTS = [
  { id: 'morning', label: '09:00 - 12:00', sub: 'ช่วงเช้า' },
  { id: 'afternoon', label: '13:00 - 16:00', sub: 'ช่วงบ่าย' },
  { id: 'evening', label: '17:00 - 20:00', sub: 'ช่วงเย็น' },
]

// รายละเอียดของแต่ละโซน
export const ZONES = [
  {
    id: 'working',
    name: 'Working Zone',
    nameTh: 'โซนทำงาน',
    description: 'พื้นที่ทำงานความจุสูง เหมาะกับการทำงานกลุ่มและงานที่ต้องใช้สมาธิแบบยืดหยุ่น',
    tableCount: 30,
    capacity: 'นั่งได้ 1 ที่/โต๊ะ',
    kind: 'desk', // desk = โต๊ะเดี่ยว
    columns: 6, // จำนวนคอลัมน์ตอนวาดผัง
    accent: 'slateblue',
    gradient: 'from-slateblue-500 to-slateblue-700',
    emoji: '💻',
    // โต๊ะที่ "มีคนจองอยู่แล้ว" ตั้งแต่เริ่ม (จำลอง)
    seededOccupied: [2, 5, 9, 14, 18, 23, 27],
  },
  {
    id: 'quiet',
    name: 'Quiet Reading Zone',
    nameTh: 'โซนอ่านหนังสือ',
    description: 'พื้นที่เงียบสงบสำหรับอ่านหนังสือและงานที่ต้องใช้สมาธิสูงแบบเต็มที่',
    tableCount: 24,
    capacity: 'นั่งได้ 1 ที่/โต๊ะ',
    kind: 'desk',
    columns: 6,
    accent: 'sage',
    gradient: 'from-sage-500 to-sage-700',
    emoji: '📚',
    seededOccupied: [3, 7, 11, 16, 20],
  },
  {
    id: 'meeting',
    name: 'Meeting Room Zone',
    nameTh: 'โซนห้องประชุม',
    description: 'ห้องประชุมส่วนตัวสำหรับการประชุมกลุ่ม จำนวนน้อยแต่จุคนได้มากต่อห้อง',
    tableCount: 6,
    capacity: 'จุได้ 6-10 คน/ห้อง',
    kind: 'room', // room = ห้องประชุมกล่องใหญ่
    columns: 3,
    accent: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    emoji: '🧑‍🤝‍🧑',
    seededOccupied: [2, 5],
  },
]

// หาโซนจาก id
export const getZone = (zoneId) => ZONES.find((z) => z.id === zoneId)

// สร้างรายการโต๊ะ/ห้องของโซน (เลข 1..tableCount)
export const buildTables = (zone) => {
  const prefix = zone.kind === 'room' ? 'ห้อง' : 'โต๊ะ'
  return Array.from({ length: zone.tableCount }, (_, i) => {
    const num = i + 1
    return {
      id: num,
      label: `${prefix} ${String(num).padStart(2, '0')}`,
      shortLabel: zone.kind === 'room' ? `R${num}` : `${num}`,
    }
  })
}
