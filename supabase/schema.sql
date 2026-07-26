-- ============================================================
--  Library Desk & Meeting Room Booking System — Supabase Schema
--  วางสคริปต์นี้ทั้งไฟล์ใน Supabase Dashboard > SQL Editor แล้วกด Run
--  (รันซ้ำได้ปลอดภัย — ใช้ IF NOT EXISTS / OR REPLACE / DROP ... IF EXISTS)
-- ============================================================

-- ------------------------------------------------------------
-- 0) Extensions
-- ------------------------------------------------------------
create extension if not exists pgcrypto;      -- gen_random_uuid()
create extension if not exists btree_gist;     -- ใช้ทำ EXCLUDE กันจองเวลาทับกัน

-- ------------------------------------------------------------
-- 1) Enums (ประเภทข้อมูลแบบกำหนดค่าได้)
-- ------------------------------------------------------------
do $$ begin
  create type public.zone_type as enum ('coworking', 'reading', 'meeting');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.booking_status as enum ('confirmed', 'cancelled');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- 2) Tables (โครงสร้างตาราง)
-- ------------------------------------------------------------

-- 2.1 profiles : ข้อมูลผู้ใช้ ผูกกับ auth.users ของ Supabase
--     points = คะแนนความประพฤติ (ระบบเต็มอยู่ใน points-system.sql)
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  first_name   text not null default '',
  last_name    text not null default '',
  phone_number text not null default '',
  email        text,
  points       int not null default 100,
  created_at   timestamptz not null default now()
);

-- 2.2 zones : โซนในห้องสมุด
create table if not exists public.zones (
  id          bigint generated always as identity primary key,
  name        text not null unique,   -- unique กันโซนชื่อซ้ำ + ทำให้ seed รันซ้ำได้
  description text,
  type        public.zone_type not null
);

-- เผื่อกรณีเคยสร้างตารางไว้ก่อนหน้าโดยยังไม่มี unique(name) — เพิ่มให้ (รันซ้ำได้)
do $$ begin
  alter table public.zones add constraint zones_name_key unique (name);
exception when duplicate_object then null; when duplicate_table then null; end $$;

-- 2.3 tables : โต๊ะ/ที่นั่งในแต่ละโซน
create table if not exists public.tables (
  id           bigint generated always as identity primary key,
  zone_id      bigint not null references public.zones (id) on delete cascade,
  table_number int not null,
  capacity     int not null default 1 check (capacity > 0),
  unique (zone_id, table_number)
);

-- 2.4 bookings : การจอง (หัวใจของระบบ)
create table if not exists public.bookings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  table_id   bigint not null references public.tables (id) on delete cascade,
  date       date not null,
  start_time time not null,
  end_time   time not null,
  status     public.booking_status not null default 'confirmed',
  created_at timestamptz not null default now(),

  -- เวลาสิ้นสุดต้องหลังเวลาเริ่ม
  constraint chk_time_order check (end_time > start_time),

  -- ► GUARDRAIL 1: กันจองซ้ำ (Anti-Double-Booking)
  --   โต๊ะเดียวกัน + วันเดียวกัน ห้ามมีช่วงเวลา "ที่ยืนยันแล้ว" ทับกัน
  --   (นับเฉพาะ status = 'confirmed' — ที่ยกเลิกแล้วไม่นับ)
  constraint no_overlapping_bookings
    exclude using gist (
      table_id with =,
      tsrange((date + start_time), (date + end_time)) with &&
    ) where (status = 'confirmed')
);

-- ► GUARDRAIL 2: โควตาวันละ 1 การจองที่ใช้งานอยู่ ต่อผู้ใช้
--   partial unique index — นับเฉพาะ confirmed (ยกเลิกแล้วจองใหม่วันเดิมได้)
create unique index if not exists one_active_booking_per_day
  on public.bookings (user_id, date)
  where (status = 'confirmed');

-- index ช่วยให้ query ผังที่นั่ง/การจองของฉัน เร็วขึ้น
create index if not exists idx_bookings_table_date on public.bookings (table_id, date);
create index if not exists idx_bookings_user        on public.bookings (user_id);
create index if not exists idx_bookings_status      on public.bookings (status);

-- ------------------------------------------------------------
-- 3) Triggers (ลอจิกอัตโนมัติ)
-- ------------------------------------------------------------

-- 3.1 สร้าง profile อัตโนมัติเมื่อมีผู้ใช้สมัครใหม่ใน auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, phone_number, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone_number', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3.2 คุมการแก้ไข booking ให้ "ยกเลิกได้อย่างเดียว"
--     - แก้ได้เฉพาะ status (คอลัมน์อื่นห้ามเปลี่ยน)
--     - อนุญาตเฉพาะ confirmed -> cancelled (กันการปลดล็อกที่ยกเลิกไปแล้ว)
create or replace function public.enforce_booking_update()
returns trigger
language plpgsql
as $$
begin
  if (new.user_id, new.table_id, new.date, new.start_time, new.end_time)
       is distinct from
     (old.user_id, old.table_id, old.date, old.start_time, old.end_time) then
    raise exception 'แก้ไขได้เฉพาะการยกเลิก (status) เท่านั้น ห้ามเปลี่ยนข้อมูลการจอง';
  end if;

  if not (old.status = 'confirmed' and new.status = 'cancelled') then
    raise exception 'อนุญาตเฉพาะการเปลี่ยนสถานะจาก confirmed เป็น cancelled';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_booking_update on public.bookings;
create trigger trg_enforce_booking_update
  before update on public.bookings
  for each row execute function public.enforce_booking_update();

-- 3.3 RPC: หา email จากเบอร์โทร (ให้ล็อกอินด้วย "เบอร์โทร + รหัสผ่าน" ได้)
--     Supabase Auth ล็อกอินด้วย email — ฟังก์ชันนี้ช่วยแปลงเบอร์ -> email ก่อน sign in
--     security definer + คืนค่าทีละ 1 แถว (จำกัดการ query ให้ปลอดภัย)
create or replace function public.get_email_by_phone(p_phone text)
returns text
language sql
security definer
set search_path = ''
stable
as $$
  select email from public.profiles where phone_number = p_phone limit 1;
$$;

grant execute on function public.get_email_by_phone(text) to anon, authenticated;

-- ------------------------------------------------------------
-- 4) Row Level Security (RLS)
-- ------------------------------------------------------------

-- 4.1 profiles : เห็น/แก้ได้เฉพาะของตัวเอง
alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = auth.uid());

-- 4.2 zones / tables : เป็นข้อมูลอ้างอิง อ่านได้อย่างเดียว (เขียนผ่าน service role/dashboard)
alter table public.zones enable row level security;
drop policy if exists zones_read on public.zones;
create policy zones_read on public.zones
  for select to authenticated using (true);

alter table public.tables enable row level security;
drop policy if exists tables_read on public.tables;
create policy tables_read on public.tables
  for select to authenticated using (true);

-- 4.3 bookings : หัวใจของการคุมสิทธิ์
alter table public.bookings enable row level security;

-- อ่านได้ทุกการจอง — จำเป็นเพื่อให้ผังที่นั่ง + Realtime อัปเดตสถานะให้ผู้ใช้ทุกคน
-- (ดูหมายเหตุความเป็นส่วนตัวใน README หากต้องการซ่อน user_id)
drop policy if exists bookings_select_all on public.bookings;
create policy bookings_select_all on public.bookings
  for select to authenticated using (true);

-- สร้างได้เฉพาะการจองของตัวเอง ต้องเป็น confirmed และจองล่วงหน้า (ไม่ย้อนหลัง)
drop policy if exists bookings_insert_own on public.bookings;
create policy bookings_insert_own on public.bookings
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'confirmed'
    and date >= current_date
  );

-- อัปเดต (ยกเลิก) ได้เฉพาะการจองของตัวเอง — รายละเอียดคุมด้วย trigger ข้อ 3.2
drop policy if exists bookings_update_own on public.bookings;
create policy bookings_update_own on public.bookings
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- *** ไม่มี policy สำหรับ DELETE โดยตั้งใจ ***
-- => การลบทุกกรณีถูกบล็อกอัตโนมัติ (ยกเลิกทำได้แค่เปลี่ยน status เท่านั้น)

-- ------------------------------------------------------------
-- 5) Realtime (เปิด subscription บนตาราง bookings)
-- ------------------------------------------------------------
-- replica identity full => payload ของ event UPDATE/DELETE จะมี old_record ครบ
alter table public.bookings replica identity full;

-- เพิ่มตาราง bookings เข้า publication ของ Realtime (กันซ้ำด้วย DO block)
do $$
begin
  alter publication supabase_realtime add table public.bookings;
exception
  when duplicate_object then null;   -- เพิ่มไว้แล้ว
end $$;

-- ------------------------------------------------------------
-- 6) Seed data (โซน + ที่นั่ง 1–23 ให้ตรงกับ frontend)
--    Working Space 1–10, Focus Pods 11–20, Meeting Rooms 21–23
-- ------------------------------------------------------------
insert into public.zones (name, description, type) values
  ('Working Space', 'เคาน์เตอร์ทำงานริมหน้าต่าง พร้อมคอมพิวเตอร์', 'coworking'),
  ('Focus Pods',    'โต๊ะทำงานมีที่กั้นเป็นส่วนตัว 2 แถว',         'reading'),
  ('Meeting Rooms', 'ห้องประชุมส่วนตัวขนาดใหญ่ 3 ห้อง',           'meeting')
on conflict (name) do nothing;

-- สร้างที่นั่งตามหมายเลข global (ตรงกับ seat.id ใน frontend)
insert into public.tables (zone_id, table_number, capacity)
select (select id from public.zones where name = 'Working Space'), g, 1
from generate_series(1, 10) as g
on conflict (zone_id, table_number) do nothing;

insert into public.tables (zone_id, table_number, capacity)
select (select id from public.zones where name = 'Focus Pods'), g, 1
from generate_series(11, 20) as g
on conflict (zone_id, table_number) do nothing;

insert into public.tables (zone_id, table_number, capacity)
select (select id from public.zones where name = 'Meeting Rooms'), g, 8
from generate_series(21, 23) as g
on conflict (zone_id, table_number) do nothing;

-- ============================================================
--  เสร็จสิ้น — ระบบพร้อมใช้งาน
-- ============================================================
