// ============================================================
//  ตัวอย่างการต่อ Supabase กับ frontend (React) ของแอปนี้
//  ติดตั้งก่อน:  npm install @supabase/supabase-js
//  ใส่ค่า ENV ใน .env :
//    VITE_SUPABASE_URL=https://xxxx.supabase.co
//    VITE_SUPABASE_ANON_KEY=eyJ....
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState, useCallback } from 'react'

// ---------- 1) สร้าง client (ไฟล์ src/supabase.js) ----------
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// ============================================================
//  2) Hook: ติดตามสถานะที่นั่งแบบเรียลไทม์
//     คืนค่า bookedTableIds = Set ของ table_id ที่ถูกจอง "วันนี้/วันที่เลือก"
// ============================================================
export function useLiveTableStatus(date) {
  const [bookedTableIds, setBookedTableIds] = useState(new Set())

  useEffect(() => {
    let active = true

    // 2.1 โหลดสถานะเริ่มต้น: การจองที่ยังใช้งานอยู่ของวันนั้น
    const loadInitial = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('table_id')
        .eq('date', date)
        .eq('status', 'confirmed')
      if (!error && active) {
        setBookedTableIds(new Set(data.map((b) => b.table_id)))
      }
    }
    loadInitial()

    // 2.2 subscribe การเปลี่ยนแปลงแบบเรียลไทม์บนตาราง bookings
    const channel = supabase
      .channel('bookings-realtime')
      // มีการจองใหม่ -> ทำเครื่องหมายที่นั่งเป็น 🔴 จองแล้ว
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload) => {
          const b = payload.new
          if (b.date === date && b.status === 'confirmed') {
            setBookedTableIds((prev) => new Set(prev).add(b.table_id))
          }
        }
      )
      // มีการอัปเดต (ยกเลิก) -> คืนที่นั่งเป็น 🟢 ว่าง
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings' },
        (payload) => {
          const b = payload.new
          if (b.date !== date) return
          setBookedTableIds((prev) => {
            const next = new Set(prev)
            if (b.status === 'cancelled') next.delete(b.table_id)
            else if (b.status === 'confirmed') next.add(b.table_id)
            return next
          })
        }
      )
      .subscribe()

    // 2.3 cleanup ตอน component unmount
    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [date])

  return bookedTableIds
}

// ============================================================
//  3) จองที่นั่ง — user_id ถูกเติมอัตโนมัติจาก default auth.uid()
//     constraint ในฐานข้อมูลจะกันจองซ้ำ/เกินโควตาให้เอง
// ============================================================
export async function bookTable({ tableId, date, startTime, endTime }) {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      table_id: tableId,
      date,
      start_time: startTime,
      end_time: endTime,
      // ไม่ต้องส่ง user_id / status — ใช้ default (auth.uid() / 'confirmed')
    })
    .select()
    .single()

  if (error) {
    // แปลง error code ของ Postgres เป็นข้อความไทยที่เข้าใจง่าย
    throw new Error(friendlyBookingError(error))
  }
  return data
}

// ============================================================
//  4) ยกเลิกการจอง — RLS + trigger อนุญาตเฉพาะการจองของตัวเอง
// ============================================================
export async function cancelBooking(bookingId) {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)

  if (error) throw new Error('ยกเลิกไม่สำเร็จ: ' + error.message)
}

// ============================================================
//  5) แปลงรหัส error เป็นข้อความที่ผู้ใช้อ่านรู้เรื่อง
// ============================================================
function friendlyBookingError(error) {
  switch (error.code) {
    case '23P01': // exclusion_violation — ช่วงเวลาทับกัน
      return 'ที่นั่งนี้ถูกจองในช่วงเวลาดังกล่าวแล้ว กรุณาเลือกที่นั่งหรือเวลาอื่น'
    case '23505': // unique_violation — เกินโควตาวันละ 1
      return 'คุณจองได้สูงสุดวันละ 1 ที่นั่งเท่านั้น'
    case '23514': // check_violation — เวลาไม่ถูกต้อง
      return 'เวลาที่เลือกไม่ถูกต้อง (เวลาสิ้นสุดต้องหลังเวลาเริ่ม)'
    case '42501': // insufficient_privilege — RLS block
      return 'ไม่มีสิทธิ์ทำรายการนี้'
    default:
      return error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่'
  }
}

// ============================================================
//  6) ตัวอย่างการใช้งานในคอมโพเนนต์ผังห้อง
// ============================================================
export function ExampleUsage({ date }) {
  const bookedTableIds = useLiveTableStatus(date) // อัปเดตเองแบบเรียลไทม์

  const handleBook = useCallback(
    async (tableId) => {
      try {
        await bookTable({ tableId, date, startTime: '09:00', endTime: '12:00' })
        // ไม่ต้อง setState เอง — event realtime จะทำให้ที่นั่งกลายเป็นแดงให้อัตโนมัติ
      } catch (e) {
        alert(e.message)
      }
    },
    [date]
  )

  return (
    <div>
      {[/* seats 1..30 */].map((seat) => (
        <button
          key={seat.id}
          disabled={bookedTableIds.has(seat.table_id)}
          onClick={() => handleBook(seat.table_id)}
        >
          {seat.id} {bookedTableIds.has(seat.table_id) ? '🔴' : '🟢'}
        </button>
      ))}
    </div>
  )
}
