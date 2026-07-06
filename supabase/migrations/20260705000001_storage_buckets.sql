-- Insert into storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  ('brand-assets', 'brand-assets', true, 5242880, '{"image/png", "image/jpeg", "image/svg+xml"}'),
  ('invoice-attachments', 'invoice-attachments', false, 10485760, '{"application/pdf", "image/png", "image/jpeg"}')
on conflict (id) do nothing;

-- Set up RLS for Storage
create policy "Public Access to brand assets" on storage.objects
  for select using (bucket_id = 'brand-assets');

create policy "Authenticated users can upload brand assets" on storage.objects
  for insert with check (bucket_id = 'brand-assets' and auth.role() = 'authenticated');

create policy "Authenticated users can update own brand assets" on storage.objects
  for update using (bucket_id = 'brand-assets' and auth.role() = 'authenticated');

create policy "Authenticated users can delete own brand assets" on storage.objects
  for delete using (bucket_id = 'brand-assets' and auth.role() = 'authenticated');

-- Invoice attachments policies
create policy "Authenticated users can access invoice attachments" on storage.objects
  for select using (bucket_id = 'invoice-attachments' and auth.role() = 'authenticated');

create policy "Authenticated users can upload invoice attachments" on storage.objects
  for insert with check (bucket_id = 'invoice-attachments' and auth.role() = 'authenticated');

create policy "Authenticated users can update own invoice attachments" on storage.objects
  for update using (bucket_id = 'invoice-attachments' and auth.role() = 'authenticated');

create policy "Authenticated users can delete own invoice attachments" on storage.objects
  for delete using (bucket_id = 'invoice-attachments' and auth.role() = 'authenticated');
