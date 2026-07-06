-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Workspaces
create table public.workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  billing_email text,
  phone text,
  website text,
  address text,
  tax_id text,
  brand_kit jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Users (extending auth.users)
-- Supabase handles auth.users, but we might want a public profile table.
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Workspace Users (RBAC)
create type public.workspace_role as enum ('owner', 'admin', 'member');

create table public.workspace_users (
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role workspace_role not null default 'member',
  created_at timestamptz default now(),
  primary key (workspace_id, user_id)
);

-- 4. Clients
create table public.clients (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  display_name text not null,
  company_name text,
  contact_person text,
  email text,
  phone text,
  website text,
  billing_address text,
  tax_id text,
  currency text default 'USD',
  payment_terms text default 'Net 30',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Invoices
create type public.invoice_status as enum ('Draft', 'Pending', 'Paid', 'Overdue');

create table public.invoices (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  invoice_number text not null,
  date date not null,
  due_date date not null,
  amount numeric(15,2) not null default 0,
  currency text not null default 'USD',
  status invoice_status not null default 'Draft',
  tax_rate numeric(5,2) default 0,
  discount_rate numeric(5,2) default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. Invoice Items
create table public.invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  qty numeric(10,2) not null default 1,
  rate numeric(15,2) not null default 0,
  sort_order int not null default 0
);

-- Updated_at triggers
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.workspaces
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at
  before update on public.users
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at
  before update on public.clients
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at
  before update on public.invoices
  for each row execute procedure public.handle_updated_at();

-- Setup RLS
alter table public.workspaces enable row level security;
alter table public.users enable row level security;
alter table public.workspace_users enable row level security;
alter table public.clients enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

-- Workspace Policies
create policy "Users can view own workspaces" on public.workspaces
  for select using (
    exists (
      select 1 from public.workspace_users wu 
      where wu.workspace_id = id and wu.user_id = auth.uid()
    )
  );

create policy "Admins can update workspaces" on public.workspaces
  for update using (
    exists (
      select 1 from public.workspace_users wu 
      where wu.workspace_id = id and wu.user_id = auth.uid() and wu.role in ('owner', 'admin')
    )
  );

-- Users Table Policies
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Workspace Users Policies
create policy "Members can view workspace users" on public.workspace_users
  for select using (
    exists (
      select 1 from public.workspace_users wu 
      where wu.workspace_id = workspace_users.workspace_id and wu.user_id = auth.uid()
    )
  );

-- Clients Policies
create policy "Members can view clients" on public.clients
  for select using (
    exists (
      select 1 from public.workspace_users wu 
      where wu.workspace_id = clients.workspace_id and wu.user_id = auth.uid()
    )
  );

create policy "Members can insert clients" on public.clients
  for insert with check (
    exists (
      select 1 from public.workspace_users wu 
      where wu.workspace_id = clients.workspace_id and wu.user_id = auth.uid()
    )
  );

create policy "Members can update clients" on public.clients
  for update using (
    exists (
      select 1 from public.workspace_users wu 
      where wu.workspace_id = clients.workspace_id and wu.user_id = auth.uid()
    )
  );

create policy "Members can delete clients" on public.clients
  for delete using (
    exists (
      select 1 from public.workspace_users wu 
      where wu.workspace_id = clients.workspace_id and wu.user_id = auth.uid()
    )
  );

-- Invoices Policies
create policy "Members can view invoices" on public.invoices
  for select using (
    exists (
      select 1 from public.workspace_users wu 
      where wu.workspace_id = invoices.workspace_id and wu.user_id = auth.uid()
    )
  );

create policy "Members can insert invoices" on public.invoices
  for insert with check (
    exists (
      select 1 from public.workspace_users wu 
      where wu.workspace_id = invoices.workspace_id and wu.user_id = auth.uid()
    )
  );

create policy "Members can update invoices" on public.invoices
  for update using (
    exists (
      select 1 from public.workspace_users wu 
      where wu.workspace_id = invoices.workspace_id and wu.user_id = auth.uid()
    )
  );

create policy "Members can delete invoices" on public.invoices
  for delete using (
    exists (
      select 1 from public.workspace_users wu 
      where wu.workspace_id = invoices.workspace_id and wu.user_id = auth.uid()
    )
  );

-- Invoice Items Policies
create policy "Members can view invoice items" on public.invoice_items
  for select using (
    exists (
      select 1 from public.invoices i
      join public.workspace_users wu on i.workspace_id = wu.workspace_id
      where i.id = invoice_items.invoice_id and wu.user_id = auth.uid()
    )
  );

create policy "Members can insert invoice items" on public.invoice_items
  for insert with check (
    exists (
      select 1 from public.invoices i
      join public.workspace_users wu on i.workspace_id = wu.workspace_id
      where i.id = invoice_items.invoice_id and wu.user_id = auth.uid()
    )
  );

create policy "Members can update invoice items" on public.invoice_items
  for update using (
    exists (
      select 1 from public.invoices i
      join public.workspace_users wu on i.workspace_id = wu.workspace_id
      where i.id = invoice_items.invoice_id and wu.user_id = auth.uid()
    )
  );

create policy "Members can delete invoice items" on public.invoice_items
  for delete using (
    exists (
      select 1 from public.invoices i
      join public.workspace_users wu on i.workspace_id = wu.workspace_id
      where i.id = invoice_items.invoice_id and wu.user_id = auth.uid()
    )
  );

-- Trigger to create user on signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_workspace_id uuid;
begin
  -- Insert into public.users
  insert into public.users (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');

  -- Create a default workspace for the user
  insert into public.workspaces (name)
  values (coalesce(new.raw_user_meta_data->>'full_name', 'My Workspace'))
  returning id into new_workspace_id;

  -- Add user as owner of the workspace
  insert into public.workspace_users (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
