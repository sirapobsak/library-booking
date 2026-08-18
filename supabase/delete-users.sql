-- ============================================================
--  ลบผู้ใช้ที่ลงทะเบียนไว้ทั้งหมด (เริ่มต้นใหม่หมด)
--  ใช้เมื่ออยากล้างบัญชีเก่า ๆ ออก
--
--  วิธีใช้: Supabase > SQL Editor > วาง > Run
--  ⚠️ ลบบัญชีผู้ใช้ทุกคน + โปรไฟล์ + การจอง + ประวัติคะแนน (กู้คืนไม่ได้)
--     โซน/โต๊ะ (zones/tables) ไม่โดนลบ
-- ============================================================

-- auth.users ผูกกับ profiles / bookings / point_logs แบบ on delete cascade
-- ดังนั้นลบ users แล้วข้อมูลที่เกี่ยวข้องจะถูกลบตามอัตโนมัติ
delete from auth.users;

-- ตรวจผล — ควรได้ 0 ทุกช่อง
select
  (select count(*) from auth.users)      as users,
  (select count(*) from public.profiles) as profiles,
  (select count(*) from public.bookings) as bookings;
