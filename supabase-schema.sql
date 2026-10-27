-- Run this in the Supabase SQL Editor for your FruitDex project.
create table if not exists public.fruitdex_records (
  id text primary key,
  category text not null check (category in ('fruit','island','boss','npc','material','raid','requirement')),
  name text not null,
  description text not null default '',
  notes text not null default '',
  source_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.fruitdex_trade_items (
  id text primary key,
  name text not null,
  market bigint not null default 0 check (market >= 0),
  beli bigint check (beli is null or beli >= 0),
  image text not null,
  kind text not null check (kind in ('fruit','skin')),
  updated_at timestamptz not null default now()
);

alter table public.fruitdex_records enable row level security;
alter table public.fruitdex_trade_items enable row level security;

revoke all on public.fruitdex_records from anon, authenticated;
revoke all on public.fruitdex_trade_items from anon, authenticated;
grant select on public.fruitdex_records to anon, authenticated;
grant select on public.fruitdex_trade_items to anon, authenticated;
grant insert, update, delete on public.fruitdex_records to authenticated;
grant insert, update, delete on public.fruitdex_trade_items to authenticated;

drop policy if exists "Anyone can read FruitDex guide" on public.fruitdex_records;
create policy "Anyone can read FruitDex guide"
  on public.fruitdex_records for select to anon, authenticated using (true);
drop policy if exists "Only FruitDex owner can edit guide" on public.fruitdex_records;
create policy "Only FruitDex owner can edit guide"
  on public.fruitdex_records for all to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'mciverernest1@gmail.com')
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'mciverernest1@gmail.com');

drop policy if exists "Anyone can read FruitDex trade values" on public.fruitdex_trade_items;
create policy "Anyone can read FruitDex trade values"
  on public.fruitdex_trade_items for select to anon, authenticated using (true);
drop policy if exists "Only FruitDex owner can edit trade values" on public.fruitdex_trade_items;
create policy "Only FruitDex owner can edit trade values"
  on public.fruitdex_trade_items for all to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'mciverernest1@gmail.com')
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'mciverernest1@gmail.com');
