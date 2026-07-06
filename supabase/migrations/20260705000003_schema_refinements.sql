-- 1. Alter workspace_role enum to add 'viewer' role
commit;
alter type public.workspace_role add value if not exists 'viewer';
begin;

-- 2. Add client_snapshot column to invoices
alter table public.invoices add column if not exists client_snapshot jsonb;

-- 3. Add uniqueness constraint on invoice numbers within a workspace
alter table public.invoices add constraint unique_invoice_number_per_workspace unique (workspace_id, invoice_number);

-- 4. Recreate RLS policies on clients to support Role-Based Access Control (RBAC)
drop policy if exists "Members can insert clients" on public.clients;
drop policy if exists "Members can update clients" on public.clients;
drop policy if exists "Members can delete clients" on public.clients;

create policy "Authorized members can insert clients" on public.clients
  for insert with check (
    exists (
      select 1 from public.workspace_users wu 
      where wu.workspace_id = clients.workspace_id 
      and wu.user_id = auth.uid() 
      and wu.role in ('owner', 'admin', 'member')
    )
  );

create policy "Authorized members can update clients" on public.clients
  for update using (
    exists (
      select 1 from public.workspace_users wu 
      where wu.workspace_id = clients.workspace_id 
      and wu.user_id = auth.uid() 
      and wu.role in ('owner', 'admin', 'member')
    )
  );

create policy "Owners and admins can delete clients" on public.clients
  for delete using (
    exists (
      select 1 from public.workspace_users wu 
      where wu.workspace_id = clients.workspace_id 
      and wu.user_id = auth.uid() 
      and wu.role in ('owner', 'admin')
    )
  );


-- 5. Recreate RLS policies on invoices to support Role-Based Access Control (RBAC)
drop policy if exists "Members can insert invoices" on public.invoices;
drop policy if exists "Members can update invoices" on public.invoices;
drop policy if exists "Members can delete invoices" on public.invoices;

create policy "Authorized members can insert invoices" on public.invoices
  for insert with check (
    exists (
      select 1 from public.workspace_users wu 
      where wu.workspace_id = invoices.workspace_id 
      and wu.user_id = auth.uid() 
      and wu.role in ('owner', 'admin', 'member')
    )
  );

create policy "Authorized members can update invoices" on public.invoices
  for update using (
    exists (
      select 1 from public.workspace_users wu 
      where wu.workspace_id = invoices.workspace_id 
      and wu.user_id = auth.uid() 
      and wu.role in ('owner', 'admin', 'member')
    )
  );

create policy "Owners and admins can delete invoices" on public.invoices
  for delete using (
    exists (
      select 1 from public.workspace_users wu 
      where wu.workspace_id = invoices.workspace_id 
      and wu.user_id = auth.uid() 
      and wu.role in ('owner', 'admin')
    )
  );


-- 6. Recreate RLS policies on invoice_items to support Role-Based Access Control (RBAC)
drop policy if exists "Members can insert invoice items" on public.invoice_items;
drop policy if exists "Members can update invoice items" on public.invoice_items;
drop policy if exists "Members can delete invoice items" on public.invoice_items;

create policy "Authorized members can insert invoice items" on public.invoice_items
  for insert with check (
    exists (
      select 1 from public.invoices i
      join public.workspace_users wu on i.workspace_id = wu.workspace_id
      where i.id = invoice_items.invoice_id 
      and wu.user_id = auth.uid() 
      and wu.role in ('owner', 'admin', 'member')
    )
  );

create policy "Authorized members can update invoice items" on public.invoice_items
  for update using (
    exists (
      select 1 from public.invoices i
      join public.workspace_users wu on i.workspace_id = wu.workspace_id
      where i.id = invoice_items.invoice_id 
      and wu.user_id = auth.uid() 
      and wu.role in ('owner', 'admin', 'member')
    )
  );

create policy "Owners and admins can delete invoice items" on public.invoice_items
  for delete using (
    exists (
      select 1 from public.invoices i
      join public.workspace_users wu on i.workspace_id = wu.workspace_id
      where i.id = invoice_items.invoice_id 
      and wu.user_id = auth.uid() 
      and wu.role in ('owner', 'admin')
    )
  );
