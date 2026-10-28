-- Storage: one public-read bucket, admin-only writes.
-- Files are served by URL (public bucket). Object paths use random UUIDs, so unpublished
-- product images are not guessable, but they are not cryptographically private.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- No public SELECT policy on storage.objects: anonymous users cannot list the bucket.
create policy "admin reads media" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and public.is_admin());

create policy "admin uploads media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());

create policy "admin updates media" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

create policy "admin deletes media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
