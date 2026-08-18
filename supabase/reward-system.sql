-- ============================================================
--  ระบบคะแนนสะสม (Reward Points) — แยกจากคะแนนความประพฤติ
--    • เริ่มต้น 0, เพิ่ม/ลดได้, "ติดลบได้"
--    • ติดลบเกิน 50 (< -50) -> จองห้องประชุมไม่ได้
--    • ใช้แลกของรางวัลจากสปอนเซอร์ (คูปองส่วนลด ฯลฯ)
--
--  ต้องรัน points-system.sql มาก่อน (ใช้ trigger protect_points ร่วมกัน)
--  วิธีใช้: Supabase > SQL Editor > วาง > Run (รันซ้ำได้)
-- ============================================================

-- 1) คอลัมน์คะแนนสะสม (เริ่ม 0, ติดลบได้ = ไม่ clamp)
alter table public.profiles
  add column if not exists reward_points int not null default 0;

-- 2) ประวัติคะแนนสะสม
create table if not exists public.reward_logs (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  delta      int not null,
  reason     text,
  created_at timestamptz not null default now()
);
create index if not exists idx_reward_logs_user
  on public.reward_logs (user_id, created_at desc);

alter table public.reward_logs enable row level security;
drop policy if exists reward_logs_select_own on public.reward_logs;
create policy reward_logs_select_own on public.reward_logs
  for select to authenticated using (user_id = auth.uid());

-- 3) อัปเดต protect trigger ให้กัน "ทั้ง" points และ reward_points
--    (แก้ได้เฉพาะผ่านฟังก์ชันที่ตั้ง flag เท่านั้น)
create or replace function public.protect_points()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('app.allow_points_change', true), '') <> 'on' then
    if new.points is distinct from old.points then
      new.points := old.points;
    end if;
    if new.reward_points is distinct from old.reward_points then
      new.reward_points := old.reward_points;
    end if;
  end if;
  return new;
end;
$$;

-- 4) ปรับคะแนนสะสม (+/-) — ติดลบได้ ไม่ clamp
create or replace function public.adjust_reward_points(
  p_user_id uuid, p_delta int, p_reason text default null
)
returns int
language plpgsql security definer set search_path = ''
as $$
declare new_pts int;
begin
  perform set_config('app.allow_points_change', 'on', true);
  update public.profiles
     set reward_points = reward_points + p_delta
   where id = p_user_id
   returning reward_points into new_pts;
  if new_pts is null then raise exception 'ไม่พบผู้ใช้ %', p_user_id; end if;
  insert into public.reward_logs (user_id, delta, reason)
  values (p_user_id, p_delta, p_reason);
  return new_pts;
end;
$$;
grant execute on function public.adjust_reward_points(uuid, int, text) to authenticated;

-- 5) แลกของรางวัล — ต้องมีคะแนนพอ (ห้ามติดลบจากการแลก)
create or replace function public.redeem_reward(
  p_user_id uuid, p_cost int, p_item text
)
returns int
language plpgsql security definer set search_path = ''
as $$
declare cur int; new_pts int;
begin
  select reward_points into cur from public.profiles where id = p_user_id;
  if cur is null then raise exception 'ไม่พบผู้ใช้'; end if;
  if cur < p_cost then
    raise exception 'REDEEM_INSUFFICIENT: คะแนนสะสมไม่พอ (มี % ต้องใช้ %)', cur, p_cost;
  end if;
  perform set_config('app.allow_points_change', 'on', true);
  update public.profiles set reward_points = reward_points - p_cost
   where id = p_user_id returning reward_points into new_pts;
  insert into public.reward_logs (user_id, delta, reason)
  values (p_user_id, -p_cost, 'แลกของรางวัล: ' || p_item);
  return new_pts;
end;
$$;
grant execute on function public.redeem_reward(uuid, int, text) to authenticated;

-- 6) สิทธิพิเศษ: กันจองห้องประชุมถ้าคะแนนสะสมติดลบเกิน 50
create or replace function public.enforce_meeting_gate()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare is_meeting bool; pts int;
begin
  if new.status = 'confirmed' then
    select (z.type = 'meeting' or t.table_number between 21 and 23)
      into is_meeting
      from public.tables t
      join public.zones z on z.id = t.zone_id
     where t.id = new.table_id;

    if coalesce(is_meeting, false) then
      select reward_points into pts from public.profiles where id = new.user_id;
      if coalesce(pts, 0) < -50 then
        raise exception 'REWARD_GATE: คะแนนสะสมติดลบเกิน 50 ไม่สามารถจองห้องประชุมได้';
      end if;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_meeting_gate on public.bookings;
create trigger trg_meeting_gate
  before insert on public.bookings
  for each row execute function public.enforce_meeting_gate();
