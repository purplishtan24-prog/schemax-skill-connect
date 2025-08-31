-- SchemaX Database Setup
-- 1) Enums
create type public.user_role as enum ('freelancer', 'client');
create type public.booking_status as enum ('pending','confirmed','completed','canceled');
create type public.payment_status as enum ('unpaid','paid','refunded','failed');
create type public.verification_status as enum ('pending','verified','rejected');

-- 2) Utility function for updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 3) Roles table and helper for admin checks (future-proofing)
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role text not null check (role in ('admin','moderator','user')),
  unique(user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  );
$$;

-- 4) Profiles (no FK to auth.users per guidelines)
create table if not exists public.profiles (
  id uuid primary key, -- should be auth.uid()
  role public.user_role not null,
  display_name text not null,
  avatar_url text,
  bio text,
  location text,
  hourly_rate integer,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create index if not exists idx_profiles_public_role on public.profiles(is_public, role);

create trigger trg_profiles_updated
before update on public.profiles
for each row execute function public.update_updated_at_column();

-- RLS policies for profiles
create policy "Public can view public freelancer profiles or owner can view own" on public.profiles
for select using (is_public = true or auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles
for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles
for update using (auth.uid() = id);

-- 5) Skills and relations
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.skills enable row level security;

-- Policies for skills
create policy "Anyone can view skills" on public.skills for select using (true);
create policy "Authenticated can insert skills" on public.skills for insert to authenticated with check (true);
create policy "Admins can update skills" on public.skills for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admins can delete skills" on public.skills for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table if not exists public.freelancer_skills (
  freelancer_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  primary key (freelancer_id, skill_id)
);

alter table public.freelancer_skills enable row level security;

create policy "Anyone can view freelancer skills" on public.freelancer_skills for select using (true);
create policy "Freelancer manages own skills" on public.freelancer_skills for insert with check (auth.uid() = freelancer_id);
create policy "Freelancer removes own skills" on public.freelancer_skills for delete using (auth.uid() = freelancer_id);

-- 6) Services offered by freelancers
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.services enable row level security;
create index if not exists idx_services_freelancer on public.services(freelancer_id, is_active);

create trigger trg_services_updated
before update on public.services
for each row execute function public.update_updated_at_column();

create policy "Anyone can view services" on public.services for select using (true);
create policy "Freelancer can insert own service" on public.services for insert with check (auth.uid() = freelancer_id);
create policy "Freelancer can update own service" on public.services for update using (auth.uid() = freelancer_id);
create policy "Freelancer can delete own service" on public.services for delete using (auth.uid() = freelancer_id);

-- 7) Availability slots
create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references public.profiles(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_booked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

alter table public.availability_slots enable row level security;
create index if not exists idx_availability_freelancer_time on public.availability_slots(freelancer_id, start_time);

create trigger trg_availability_updated
before update on public.availability_slots
for each row execute function public.update_updated_at_column();

create policy "Anyone can view availability" on public.availability_slots for select using (true);
create policy "Freelancer manages own availability" on public.availability_slots for insert with check (auth.uid() = freelancer_id);
create policy "Freelancer updates own availability" on public.availability_slots for update using (auth.uid() = freelancer_id);
create policy "Freelancer deletes own availability" on public.availability_slots for delete using (auth.uid() = freelancer_id);

-- 8) Bookings
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  freelancer_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status public.booking_status not null default 'pending',
  total_amount_cents integer check (total_amount_cents >= 0),
  currency text default 'usd',
  payment_status public.payment_status not null default 'unpaid',
  stripe_session_id text unique,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

alter table public.bookings enable row level security;
create index if not exists idx_bookings_freelancer_status on public.bookings(freelancer_id, status);
create index if not exists idx_bookings_client_status on public.bookings(client_id, status);

create trigger trg_bookings_updated
before update on public.bookings
for each row execute function public.update_updated_at_column();

-- RLS: participants can view & update; clients create bookings for themselves only
create policy "Participants can view bookings" on public.bookings
for select using (auth.uid() = client_id or auth.uid() = freelancer_id);
create policy "Client can create own booking" on public.bookings
for insert with check (auth.uid() = client_id);
create policy "Participants can update booking" on public.bookings
for update using (auth.uid() = client_id or auth.uid() = freelancer_id);

-- 9) Reviews (publicly visible)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  freelancer_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;
create index if not exists idx_reviews_freelancer on public.reviews(freelancer_id);

create policy "Anyone can view reviews" on public.reviews for select using (true);
create policy "Client can review completed booking" on public.reviews
for insert with check (
  auth.uid() = client_id and exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and b.client_id = auth.uid()
      and b.freelancer_id = reviews.freelancer_id
      and b.status = 'completed'
  )
);
create policy "Client can update own review" on public.reviews
for update using (auth.uid() = client_id);

-- 10) Verifications
create table if not exists public.verifications (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references public.profiles(id) on delete cascade,
  status public.verification_status not null default 'pending',
  document_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.verifications enable row level security;

create trigger trg_verifications_updated
before update on public.verifications
for each row execute function public.update_updated_at_column();

-- Public can see only verified status; owners can see their own
create policy "Public can see verified or owner sees own" on public.verifications
for select using (status = 'verified' or auth.uid() = freelancer_id);
create policy "Freelancer can create verification" on public.verifications
for insert with check (auth.uid() = freelancer_id);
create policy "Freelancer can update own verification" on public.verifications
for update using (auth.uid() = freelancer_id);

-- 11) Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  payload jsonb not null default '{}',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;
create index if not exists idx_notifications_user on public.notifications(user_id, read, created_at desc);

create policy "Users read own notifications" on public.notifications
for select using (auth.uid() = user_id);
create policy "Users insert own notifications" on public.notifications
for insert with check (auth.uid() = user_id);
create policy "Users update own notifications" on public.notifications
for update using (auth.uid() = user_id);

-- 12) Realtime configuration (bookings & notifications)
alter table public.bookings replica identity full;
alter table public.notifications replica identity full;

-- Add to realtime publication if not already added
alter publication supabase_realtime add table public.bookings;
alter publication supabase_realtime add table public.notifications;

-- 13) Storage buckets and policies
insert into storage.buckets (id, name, public) values ('avatars','avatars', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('documents','documents', false)
  on conflict (id) do nothing;

-- Avatars: public read, user-scoped write
create policy "Avatar images are publicly accessible" on storage.objects
for select using (bucket_id = 'avatars');

create policy "Users can upload their own avatar" on storage.objects
for insert with check (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update their own avatar" on storage.objects
for update using (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);

-- Documents: private read/write per user
create policy "Users can view their own documents" on storage.objects
for select using (
  bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can upload their own documents" on storage.objects
for insert with check (
  bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update their own documents" on storage.objects
for update using (
  bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
);
