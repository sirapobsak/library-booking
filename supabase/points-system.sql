-- ============================================================
--  ระบบคะแนนความประพฤติของลูกค้า (Behavior Points)
--  แนวคิด: เซนเซอร์ที่โต๊ะตรวจจับเสียงดัง -> รู้ว่าใครจองโต๊ะนั้น
--          -> เรียก adjust_points() เพื่อหักคะแนน
--  (ตอนนี้ยังไม่เชื่อมเซนเซอร์ — แค่วางระบบให้ +/- คะแนนได้)
--
--  วิธีใช้: วางทั้งไฟล์ใน Supabase > SQL Editor แล้วกด Run (รันซ้ำได้)
-- ============================================================

-- 1) คอลัมน์คะแนนบนโปรไฟล์ลูกค้า (เริ่มต้น 100 คะแนน)
alter table public.profiles
  add column if not exists points int not null default 100;

update public.profiles set points = 100 where points is null;

-- 2) ตารางบันทึกประวัติการเปลี่ยนคะแนน (+/- พร้อมเหตุผล)
create table if not exists public.point_logs (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  delta      int not null,          -- + เพิ่ม / - หัก
  reason     text,                  -- เช่น "เสียงดังเกินกำหนด (โต๊ะ 05)"
  created_at timestamptz not null default now()
);
create index if not exists idx_point_logs_user
  on public.point_logs (user_id, created_at desc);

alter table public.point_logs enable row level security;
drop policy if exists point_logs_select_own on public.point_logs;
create policy point_logs_select_own on public.point_logs
  for select to authenticated using (user_id = auth.uid());
-- ไม่มี policy insert/update/delete => เขียนได้ผ่านฟังก์ชัน adjust_points เท่านั้น

-- 3) กันไม่ให้ผู้ใช้แก้ "คะแนน" ตัวเองผ่าน update โปรไฟล์ปกติ
--    (คะแนนเปลี่ยนได้เฉพาะผ่าน adjust_points ซึ่งตั้ง flag ก่อน)
create or replace function public.protect_points()
returns trigger
language plpgsql
as $$
begin
  if new.points is distinct from old.points
     and coalesce(current_setting('app.allow_points_change', true), '') <> 'on' then
    new.points := old.points;  -- คืนค่าเดิมเงียบ ๆ
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_points on public.profiles;
create trigger trg_protect_points
  before update on public.profiles
  for each row execute function public.protect_points();

-- 4) ฟังก์ชันปรับคะแนน — จุดเชื่อมต่อสำหรับเซนเซอร์/แอดมิน/แบ็กเอนด์
--    เรียก: select adjust_points('<user_uuid>', -5, 'เสียงดังเกินกำหนด');
create or replace function public.adjust_points(
  p_user_id uuid,
  p_delta   int,
  p_reason  text default null
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_points int;
begin
  perform set_config('app.allow_points_change', 'on', true); -- อนุญาตแก้คะแนนในทรานแซกชันนี้
  update public.profiles
     set points = greatest(0, points + p_delta)  -- ไม่ให้ต่ำกว่า 0
   where id = p_user_id
   returning points into new_points;

  if new_points is null then
    raise exception 'ไม่พบผู้ใช้ %', p_user_id;
  end if;

  insert into public.point_logs (user_id, delta, reason)
  values (p_user_id, p_delta, p_reason);

  return new_points;
end;
$$;

-- ⚠️ หมายเหตุความปลอดภัย:
--   ให้สิทธิ์ authenticated เรียกได้ เพื่อ "ทดสอบ" ระบบจากหน้าเว็บ
--   ในงานจริง ควรถอด grant นี้ออก แล้วให้เฉพาะ backend เซนเซอร์ (service_role) เรียก
--   ป้องกันไม่ให้ลูกค้าปั๊มคะแนนตัวเอง
grant execute on function public.adjust_points(uuid, int, text) to authenticated;
