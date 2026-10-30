-- کافی‌نت آنلاین: ساختار امن سفارش‌ها در Supabase
-- این فایل را کامل در SQL Editor پروژه Supabase اجرا کنید.
create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  phone text not null check (char_length(phone) between 10 and 15),
  service text not null check (char_length(service) between 2 and 100),
  details text not null default '' check (char_length(details) <= 2000),
  tracking_code text not null unique,
  status text not null default 'received' check (status in ('received','reviewing','in_progress','completed','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;
grant select on public.orders to authenticated;
grant update(status) on public.orders to authenticated;

-- هر کاربر فقط سفارش‌های خودش را می‌بیند؛ مدیر با app_metadata.role=admin همه را می‌بیند.
drop policy if exists "read own orders or admin" on public.orders;
create policy "read own orders or admin" on public.orders for select to authenticated
using (auth.uid() = user_id or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "admin updates orders" on public.orders;
create policy "admin updates orders" on public.orders for update to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ثبت سفارش از طریق تابع کنترل‌شده؛ کاربر نمی‌تواند user_id یا وضعیت سفارش را جعل کند.
create or replace function public.create_order(
  p_name text, p_phone text, p_service text, p_details text default ''
) returns table(tracking_code text)
language plpgsql security definer set search_path = public
as $$
declare v_code text;
begin
  if auth.uid() is null then raise exception 'برای ثبت سفارش ابتدا وارد حساب شوید.'; end if;
  if char_length(trim(p_name)) < 2 or char_length(trim(p_name)) > 100 then raise exception 'نام واردشده معتبر نیست.'; end if;
  if char_length(trim(p_phone)) < 10 or char_length(trim(p_phone)) > 15 then raise exception 'شماره تماس معتبر نیست.'; end if;
  if char_length(trim(p_service)) < 2 or char_length(trim(p_service)) > 100 then raise exception 'نوع خدمت معتبر نیست.'; end if;
  if char_length(coalesce(p_details,'')) > 2000 then raise exception 'توضیحات بیش از حد طولانی است.'; end if;
  v_code := upper(substr(encode(gen_random_bytes(8),'hex'),1,10));
  insert into public.orders(user_id,customer_name,phone,service,details,tracking_code)
  values(auth.uid(),trim(p_name),trim(p_phone),trim(p_service),coalesce(trim(p_details),''),v_code);
  return query select v_code;
end;
$$;
revoke all on function public.create_order(text,text,text,text) from public;
grant execute on function public.create_order(text,text,text,text) to authenticated;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
for each row execute function public.touch_updated_at();
