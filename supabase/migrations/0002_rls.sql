-- Row Level Security. Anonymous visitors can read published catalogue content only.
-- Only users listed in public.admin_users can write.

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.business_settings enable row level security;
alter table public.homepage_sections enable row level security;

-- Explicit grants (RLS then narrows them).
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

grant select on public.categories, public.products, public.product_images,
  public.business_settings, public.homepage_sections to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.product_images
  to authenticated;
grant update on public.business_settings, public.homepage_sections to authenticated;

-- admin_users: a signed-in user may only see their own row (lets the UI check access).
-- No insert/update/delete policy exists, so owners can only be provisioned server-side.
create policy "own admin row" on public.admin_users
  for select to authenticated
  using (user_id = auth.uid());

-- Categories
create policy "public reads published categories" on public.categories
  for select to anon, authenticated
  using (is_published and not is_archived);

create policy "admin manages categories" on public.categories
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Products
create policy "public reads published products" on public.products
  for select to anon, authenticated
  using (
    is_published
    and not is_archived
    and exists (
      select 1 from public.categories c
      where c.id = products.category_id and c.is_published and not c.is_archived
    )
  );

create policy "admin manages products" on public.products
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Product images: visible only when the parent product is visible to the caller.
create policy "public reads images of visible products" on public.product_images
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_images.product_id));

create policy "admin manages product images" on public.product_images
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Business settings and homepage sections: public information, admin-only edits.
create policy "public reads business settings" on public.business_settings
  for select to anon, authenticated
  using (true);

create policy "admin updates business settings" on public.business_settings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "public reads homepage sections" on public.homepage_sections
  for select to anon, authenticated
  using (true);

create policy "admin updates homepage sections" on public.homepage_sections
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
