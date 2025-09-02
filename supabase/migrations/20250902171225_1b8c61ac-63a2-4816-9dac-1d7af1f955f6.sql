-- Storage policies for avatars bucket to allow authenticated users to manage their own files
-- Public read for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload files under a folder named with their user id
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (auth.uid()::text = (storage.foldername(name))[1])
);

-- Allow users to update their own files in avatars bucket
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND (auth.uid()::text = (storage.foldername(name))[1])
);

-- Allow users to delete their own files in avatars bucket
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars'
  AND (auth.uid()::text = (storage.foldername(name))[1])
);