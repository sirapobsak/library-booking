-- ============================================================
--  RESEED v2 — ปรับผังห้องเป็น 23 ที่นั่งตามรูปสเก็ตช์
--    • Working Space (เคาน์เตอร์บาร์)  ที่นั่ง 1–10
--    • Focus Pods (โต๊ะมีที่กั้น)      ที่นั่ง 11–20
--    • Meeting Rooms (ห้องประชุม)      ห้อง 21–23
--
--  วิธีใช้: วางทั้งไฟล์ใน Supabase > SQL Editor แล้วกด Run
--  ⚠️ ล้างข้อมูล zones/tables/bookings เดิมทั้งหมด (ปลอดภัยถ้ายังเป็นข้อมูลทดสอบ)
-- ============================================================

-- 1) ล้างของเดิม
truncate table public.tables, public.zones restart identity cascade;

-- 2) กันชื่อโซนซ้ำ (รันซ้ำได้)
do $$ begin
  alter table public.zones add constraint zones_name_key unique (name);
exception when duplicate_object then null; when duplicate_table then null; end $$;

-- 3) โซนใหม่ 3 โซน
insert into public.zones (name, description, type) values
  ('Working Space', 'เคาน์เตอร์ทำงานริมหน้าต่าง พร้อมคอมพิวเตอร์', 'coworking'),
  ('Focus Pods',    'โต๊ะทำงานมีที่กั้นเป็นส่วนตัว 2 แถว',         'reading'),
  ('Meeting Rooms', 'ห้องประชุมส่วนตัวขนาดใหญ่ 3 ห้อง',           'meeting')
on conflict (name) do nothing;

-- 4) ที่นั่ง/ห้อง (table_number = เลขที่นั่งใน frontend)
insert into public.tables (zone_id, table_number, capacity)
select (select id from public.zones where name = 'Working Space'), g, 1
from generate_series(1, 10) g
on conflict (zone_id, table_number) do nothing;

insert into public.tables (zone_id, table_number, capacity)
select (select id from public.zones where name = 'Focus Pods'), g, 1
from generate_series(11, 20) g
on conflict (zone_id, table_number) do nothing;

-- ห้องประชุมจุได้เยอะกว่า (capacity 8)
insert into public.tables (zone_id, table_number, capacity)
select (select id from public.zones where name = 'Meeting Rooms'), g, 8
from generate_series(21, 23) g
on conflict (zone_id, table_number) do nothing;

-- 5) ตรวจผล — ควรได้ zones = 3, tables = 23
select
  (select count(*) from public.zones)  as zones,
  (select count(*) from public.tables) as tables;
