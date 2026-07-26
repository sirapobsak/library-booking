-- ============================================================
--  FIX: ล้างโซน/ที่นั่งที่ซ้ำ แล้ว seed ใหม่ให้ถูกต้อง
--  ใช้เมื่อเจอ error: "more than one row returned by a subquery"
--  (เกิดจากรัน schema.sql ซ้ำตอนที่ zones ยังไม่มี unique(name))
--
--  วิธีใช้: วางทั้งไฟล์ใน Supabase > SQL Editor แล้วกด Run
--  ⚠️ จะลบข้อมูลในตาราง zones/tables/bookings ทั้งหมด
--     (ปลอดภัยถ้ายังเป็นโปรเจกต์ใหม่ที่ยังไม่มีข้อมูลจริง)
-- ============================================================

-- 1) ล้างข้อมูลเดิมทั้งหมด (cascade ไปลบ bookings ที่อ้างถึงด้วย)
truncate table public.tables, public.zones restart identity cascade;

-- 2) เพิ่ม unique(name) กันโซนชื่อซ้ำในอนาคต (รันซ้ำได้)
do $$ begin
  alter table public.zones add constraint zones_name_key unique (name);
exception when duplicate_object then null; when duplicate_table then null; end $$;

-- 3) seed โซนใหม่ (3 โซน)
insert into public.zones (name, description, type) values
  ('Working Space', 'เคาน์เตอร์ทำงานริมหน้าต่าง พร้อมคอมพิวเตอร์', 'coworking'),
  ('Focus Pods',    'ห้องส่วนตัวมีผนังกั้น เหมาะกับงานที่ต้องโฟกัส', 'reading'),
  ('Flex Desks',    'โต๊ะเดี่ยวยืดหยุ่น เหมาะกับการอ่านหนังสือ',     'reading')
on conflict (name) do nothing;

-- 4) seed ที่นั่ง 1–30 (Working 1–8, Focus 9–20, Flex 21–30)
insert into public.tables (zone_id, table_number, capacity)
select (select id from public.zones where name = 'Working Space'), g, 1
from generate_series(1, 8) g
on conflict (zone_id, table_number) do nothing;

insert into public.tables (zone_id, table_number, capacity)
select (select id from public.zones where name = 'Focus Pods'), g, 1
from generate_series(9, 20) g
on conflict (zone_id, table_number) do nothing;

insert into public.tables (zone_id, table_number, capacity)
select (select id from public.zones where name = 'Flex Desks'), g, 1
from generate_series(21, 30) g
on conflict (zone_id, table_number) do nothing;

-- 5) ตรวจผล — ควรได้ zones = 3, tables = 30
select
  (select count(*) from public.zones)  as zones,
  (select count(*) from public.tables) as tables;
