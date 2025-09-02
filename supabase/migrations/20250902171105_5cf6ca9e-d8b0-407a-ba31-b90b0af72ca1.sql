-- Storage policies for avatars bucket to allow authenticated users to manage their own files and public read access
-- Public read for avatars
create policy if not exists "Avatar images are publicly accessible"
on storage.objects
for select
using (bucket_id = 'avatars');

-- Allow authenticated users to upload files under a folder named with their user id
create policy if not exists "Users can upload their own avatar"
on storage.objects
for insert
with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (auth.uid()::text = (storage.foldername(name))[1])
);

-- Allow users to update their own files in avatars bucket
create policy if not exists "Users can update their own avatar"
on storage.objects
for update
using (
  bucket_id = 'avatars'
  and (auth.uid()::text = (storage.foldername(name))[1])
);

-- Allow users to delete their own files in avatars bucket
create policy if not exists "Users can delete their own avatar"
on storage.objects
for delete
using (
  bucket_id = 'avatars'
  and (auth.uid()::text = (storage.foldername(name))[1])
);
