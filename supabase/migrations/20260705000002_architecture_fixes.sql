-- Fix A: Resolve Infinite RLS Recursion & Missing Workspace Policies
-- 1. Create a security definer function to read user's workspaces safely without RLS
create or replace function public.get_user_workspaces()
returns setof uuid as $$
  select workspace_id from public.workspace_users where user_id = auth.uid();
$$ language sql security definer;

-- 2. Drop the recursive policy
drop policy if exists "Members can view workspace users" on public.workspace_users;

-- 3. Re-create the workspace_users policies
create policy "Members can view workspace users" on public.workspace_users
  for select using (workspace_id in (select public.get_user_workspaces()));

create policy "Owners and admins can manage workspace users" on public.workspace_users
  for all using (
    exists (
      select 1 from public.workspace_users wu 
      where wu.workspace_id = workspace_users.workspace_id 
      and wu.user_id = auth.uid() 
      and wu.role in ('owner', 'admin')
    )
  );

-- 4. Enable workspaces insertion
create policy "Users can insert workspaces" on public.workspaces
  for insert with check (true); -- Signup trigger or client API creates will work


-- Fix B: Lock Down Storage Buckets (Cross-Tenant Fix)
-- Drop insecure wildcard policies
drop policy if exists "Public Access to brand assets" on storage.objects;
drop policy if exists "Authenticated users can upload brand assets" on storage.objects;
drop policy if exists "Authenticated users can update own brand assets" on storage.objects;
drop policy if exists "Authenticated users can delete own brand assets" on storage.objects;
drop policy if exists "Authenticated users can access invoice attachments" on storage.objects;
drop policy if exists "Authenticated users can upload invoice attachments" on storage.objects;
drop policy if exists "Authenticated users can update own invoice attachments" on storage.objects;
drop policy if exists "Authenticated users can delete own invoice attachments" on storage.objects;

-- Extract workspace_id from the first folder segment: (storage.foldername(name))[1]

-- Brand Assets policies
create policy "Public Access to brand assets" on storage.objects
  for select using (bucket_id = 'brand-assets');

create policy "Workspace members can upload brand assets" on storage.objects
  for insert with check (
    bucket_id = 'brand-assets' 
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1]::uuid in (select public.get_user_workspaces())
  );

create policy "Workspace members can update brand assets" on storage.objects
  for update using (
    bucket_id = 'brand-assets' 
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1]::uuid in (select public.get_user_workspaces())
  );

create policy "Workspace members can delete brand assets" on storage.objects
  for delete using (
    bucket_id = 'brand-assets' 
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1]::uuid in (select public.get_user_workspaces())
  );

-- Invoice Attachments policies (Private)
create policy "Workspace members can access invoice attachments" on storage.objects
  for select using (
    bucket_id = 'invoice-attachments' 
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1]::uuid in (select public.get_user_workspaces())
  );

create policy "Workspace members can upload invoice attachments" on storage.objects
  for insert with check (
    bucket_id = 'invoice-attachments' 
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1]::uuid in (select public.get_user_workspaces())
  );

create policy "Workspace members can update invoice attachments" on storage.objects
  for update using (
    bucket_id = 'invoice-attachments' 
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1]::uuid in (select public.get_user_workspaces())
  );

create policy "Workspace members can delete invoice attachments" on storage.objects
  for delete using (
    bucket_id = 'invoice-attachments' 
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1]::uuid in (select public.get_user_workspaces())
  );


-- Fix C: Create Missing Foreign Key Indexes
create index if not exists idx_workspace_users_user_id on public.workspace_users(user_id);
create index if not exists idx_clients_workspace_id on public.clients(workspace_id);
create index if not exists idx_invoices_workspace_id on public.invoices(workspace_id);
create index if not exists idx_invoices_client_id on public.invoices(client_id);
create index if not exists idx_invoice_items_invoice_id on public.invoice_items(invoice_id);


-- Fix D: Enforce Cross-Tenant Client Constraints
-- 1. Create a composite unique constraint on clients
alter table public.clients add constraint unique_client_workspace unique (id, workspace_id);

-- 2. Drop the existing foreign key on invoices
alter table public.invoices drop constraint if exists invoices_client_id_fkey;

-- 3. Add composite foreign key constraint to invoices
alter table public.invoices 
  add constraint invoices_client_workspace_fkey 
  foreign key (client_id, workspace_id) 
  references public.clients (id, workspace_id) 
  on delete set null;


-- Fix E: Recalculate Invoice Amounts Trigger
create or replace function public.recalculate_invoice_amount()
returns trigger as $$
begin
  if tg_op = 'DELETE' or tg_op = 'UPDATE' then
    update public.invoices
    set amount = coalesce(
      (select sum(qty * rate) from public.invoice_items where invoice_id = old.invoice_id),
      0
    )
    where id = old.invoice_id;
  end if;

  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    update public.invoices
    set amount = coalesce(
      (select sum(qty * rate) from public.invoice_items where invoice_id = new.invoice_id),
      0
    )
    where id = new.invoice_id;
  end if;

  return null;
end;
$$ language plpgsql;

drop trigger if exists trigger_recalculate_invoice_amount on public.invoice_items;

create trigger trigger_recalculate_invoice_amount
  after insert or update or delete on public.invoice_items
  for each row execute procedure public.recalculate_invoice_amount();


-- Fix F: Teammate Profile Visibility
drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view workspace teammates" on public.users
  for select using (
    id = auth.uid()
    or exists (
      select 1 from public.workspace_users wu1
      join public.workspace_users wu2 on wu1.workspace_id = wu2.workspace_id
      where wu1.user_id = auth.uid() and wu2.user_id = public.users.id
    )
  );
