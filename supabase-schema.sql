-- =============================================
-- Huugs – Supabase Schema
-- Run this in the Supabase SQL editor
-- =============================================

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text,
  bio         text,
  age         int,
  gender      text,
  looking_for text,
  location    text,
  avatar_url  text,
  photos      text[] default '{}',
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view all profiles"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Swipes
create table if not exists public.swipes (
  id          uuid primary key default gen_random_uuid(),
  swiper_id   uuid references public.profiles(id) on delete cascade,
  swiped_id   uuid references public.profiles(id) on delete cascade,
  direction   text not null check (direction in ('left','right','super')),
  created_at  timestamptz default now(),
  unique(swiper_id, swiped_id)
);

alter table public.swipes enable row level security;

create policy "Users can insert own swipes"
  on public.swipes for insert with check (auth.uid() = swiper_id);

create policy "Users can view own swipes"
  on public.swipes for select using (auth.uid() = swiper_id or auth.uid() = swiped_id);

-- Matches (mutual right-swipes)
create table if not exists public.matches (
  id         uuid primary key default gen_random_uuid(),
  user1_id   uuid references public.profiles(id) on delete cascade,
  user2_id   uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user1_id, user2_id)
);

alter table public.matches enable row level security;

create policy "Users can view own matches"
  on public.matches for select using (auth.uid() = user1_id or auth.uid() = user2_id);

-- Messages
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid references public.matches(id) on delete cascade,
  sender_id  uuid references public.profiles(id) on delete cascade,
  content    text not null,
  read       boolean default false,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Match participants can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.matches
      where id = messages.match_id
        and (user1_id = auth.uid() or user2_id = auth.uid())
    )
  );

create policy "Match participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.matches
      where id = messages.match_id
        and (user1_id = auth.uid() or user2_id = auth.uid())
    )
  );

-- Enable Realtime for messages
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.matches;
