-- 1. Alter users table to add new profile fields
alter table public.users add column if not exists display_name text;
alter table public.users add column if not exists timezone text default 'UTC';
alter table public.users add column if not exists language text default 'en';
alter table public.users add column if not exists currency_preference text default 'USD';

-- 2. Create the avatars storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, '{"image/png", "image/jpeg", "image/webp"}')
on conflict (id) do nothing;

-- 3. Set up RLS for avatars bucket
create policy "Public Access to avatars" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Authenticated users can upload avatars" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Authenticated users can update own avatars" on storage.objects
  for update using (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Authenticated users can delete own avatars" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- 4. Create postgres function to delete own account
create or replace function public.delete_own_account()
returns void as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$ language plpgsql security definer set search_path = auth, public;
