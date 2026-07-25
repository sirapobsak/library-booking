# 🗄️ Supabase Backend — Library Booking System

สถาปัตยกรรมฐานข้อมูลแบบเรียลไทม์สำหรับระบบจองโต๊ะ/ห้องประชุมในห้องสมุด

## 📦 ไฟล์ในโฟลเดอร์นี้

| ไฟล์ | หน้าที่ |
|------|---------|
| [`schema.sql`](schema.sql) | สคริปต์สร้างทั้งระบบ — ตาราง, constraint, trigger, RLS, realtime, seed |
| [`client-example.jsx`](client-example.jsx) | ตัวอย่างต่อ frontend (React) — subscribe realtime, จอง, ยกเลิก |

---

## 🚀 วิธีติดตั้ง (3 ขั้น)

1. สร้างโปรเจกต์ที่ [supabase.com](https://supabase.com) → เปิดเมนู **SQL Editor**
2. เปิด [`schema.sql`](schema.sql) → คัดลอกทั้งไฟล์ → วาง → กด **Run** (รันซ้ำได้ปลอดภัย)
3. ที่ **Database → Replication** ตรวจว่า `bookings` อยู่ใน publication `supabase_realtime` แล้ว (สคริปต์เพิ่มให้อัตโนมัติ)

เอา `Project URL` และ `anon key` จาก **Project Settings → API** ไปใส่ `.env` ของ frontend

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## 1️⃣ Schema (โครงสร้าง)

```
auth.users (ของ Supabase)
   │ 1:1
   ▼
profiles ── id, first_name, last_name, phone_number, email, created_at
zones ───── id, name, description, type(coworking|reading|meeting)
   │ 1:N
   ▼
tables ──── id, zone_id→zones, table_number, capacity   (unique: zone_id+table_number)
   │ 1:N
   ▼
bookings ── id, user_id→users, table_id→tables, date, start_time, end_time,
            status(confirmed|cancelled), created_at
```

- `profiles` ถูกสร้างอัตโนมัติเมื่อสมัครสมาชิก (trigger `on_auth_user_created`)
- `bookings.user_id` มี `default auth.uid()` — frontend ไม่ต้องส่ง user_id เอง

---

## 2️⃣ Realtime — ผังที่นั่งอัปเดตทันที

เปิด subscription บนตาราง `bookings` (RLS `select` แบบ `using(true)` จำเป็น เพื่อให้ทุก client รับ event ได้)

```js
supabase.channel('bookings-realtime')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, (p) => {
    if (p.new.status === 'confirmed') markBooked(p.new.table_id)      // 🔴
  })
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, (p) => {
    if (p.new.status === 'cancelled') markAvailable(p.new.table_id)   // 🟢
  })
  .subscribe()
```

> โค้ดพร้อมใช้ (มี hook `useLiveTableStatus`, `bookTable`, `cancelBooking`) อยู่ใน [`client-example.jsx`](client-example.jsx)

`replica identity full` ถูกตั้งให้แล้ว → payload ของ event มีข้อมูลครบ (รวม `old_record`)

---

## 3️⃣ Row Level Security (สรุปนโยบาย)

| ตาราง | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | ตัวเอง | ตัวเอง | ตัวเอง | ✗ |
| `zones` / `tables` | ทุกคน (login) | ✗ | ✗ | ✗ |
| `bookings` | ทุกคน (login) | **เฉพาะของตัวเอง** + `confirmed` + ไม่ย้อนหลัง | **เฉพาะของตัวเอง** | **✗ (บล็อกทุกคน)** |

**Self-Service Cancellation** ถูกบังคับ 2 ชั้น:
1. **RLS** `bookings_update_own` → แก้ได้เฉพาะแถวที่ `user_id = auth.uid()`
2. **Trigger** `enforce_booking_update` → แก้ได้เฉพาะ `status` และเปลี่ยนได้แค่ `confirmed → cancelled` เท่านั้น (คอลัมน์อื่นห้ามแตะ, ห้ามปลดล็อกที่ยกเลิกไปแล้ว)

การ **ลบ** ถูกบล็อกโดยสมบูรณ์ เพราะ *ไม่มี* policy สำหรับ `DELETE` (RLS ปฏิเสธเป็น default)

---

## 4️⃣ Guardrails (กติกาทางธุรกิจ ระดับฐานข้อมูล)

### กันจองซ้ำ (Anti-Double-Booking)
ใช้ **EXCLUDE constraint + GiST** — โต๊ะเดียวกัน วันเดียวกัน ช่วงเวลาที่ `confirmed` ห้ามทับกัน

```sql
exclude using gist (
  table_id with =,
  tsrange((date + start_time), (date + end_time)) with &&
) where (status = 'confirmed')
```

รับประกันที่ระดับฐานข้อมูล → แม้ผู้ใช้สองคนกดจองพร้อมกัน (race condition) ก็มีคนเดียวที่สำเร็จ อีกคนได้ error `23P01`

### โควตาวันละ 1 ที่ (Daily Quota)
ใช้ **partial unique index**

```sql
create unique index one_active_booking_per_day
  on bookings (user_id, date) where (status = 'confirmed');
```

ผู้ใช้มีการจองที่ `confirmed` ได้ 1 รายการต่อวัน (ยกเลิกแล้วจองใหม่วันเดิมได้) เกินโควตาได้ error `23505`

> frontend แปลง error code เป็นข้อความไทยแล้วใน `friendlyBookingError()`

---

## 🔧 ทางเลือก: Node.js / Express

ถ้าอยากมี backend เป็นของตัวเอง ใช้ schema เดียวกันนี้ได้เลย (ต่อ PostgreSQL ตรง ๆ):
- แทน `auth.uid()` ด้วย `user_id` ที่ decode จาก JWT ใน middleware
- Realtime: ใช้ `LISTEN/NOTIFY` ของ Postgres + WebSocket (`ws`) แทน Supabase Realtime
  ```sql
  -- ตัวอย่าง trigger ยิง NOTIFY เมื่อ bookings เปลี่ยน
  create function notify_booking() returns trigger language plpgsql as $$
  begin
    perform pg_notify('bookings', json_build_object(
      'op', tg_op, 'table_id', new.table_id, 'status', new.status, 'date', new.date
    )::text);
    return new;
  end $$;
  create trigger trg_notify_booking after insert or update on bookings
    for each row execute function notify_booking();
  ```
- constraint/guardrail ทั้งหมดทำงานเหมือนเดิม (เป็น PostgreSQL ล้วน)

---

## 🔒 หมายเหตุความเป็นส่วนตัว (optional)

policy `bookings_select_all` เปิดให้ผู้ใช้ที่ล็อกอินเห็นทุกแถว รวม `user_id` (จำเป็นเพื่อให้ realtime กระจายสถานะให้ทุกคน)

ถ้าต้องการ **ซ่อนตัวตนผู้จอง** ให้ใช้ **Broadcast from Database** ของ Supabase แทน: เปลี่ยน `bookings_select_all` ให้เห็นเฉพาะของตัวเอง แล้วเพิ่ม trigger ที่ยิงเฉพาะ `table_id` + `status` ผ่าน `realtime.broadcast_changes(...)` → หน้าผังรับสถานะได้โดยไม่เห็นข้อมูลส่วนตัวของคนอื่น
