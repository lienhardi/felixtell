-- Create swipes table
create table if not exists public.swipes (
  id uuid default gen_random_uuid() primary key,
  brand_id uuid references auth.users(id) on delete cascade,
  model_name text not null,
  direction text check (direction in ('left', 'right')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.swipes enable row level security;

-- Create policies
create policy "Brands can view their own swipes"
  on public.swipes for select
  using (auth.uid() = brand_id);

create policy "Brands can insert their own swipes"
  on public.swipes for insert
  with check (auth.uid() = brand_id);

-- Create index for faster queries
create index swipes_brand_id_idx on public.swipes(brand_id);
create index swipes_created_at_idx on public.swipes(created_at);
