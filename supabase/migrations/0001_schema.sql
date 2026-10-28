-- RK HANDLOOM catalogue schema
-- Run in order: 0001_schema, 0002_rls, 0003_storage, 0004_seed.

------------------------------------------------------------------
-- Owner authorization
------------------------------------------------------------------
-- Only rows inserted here (by the project owner via the SQL editor / service role)
-- make a user an administrator. Browsers can never write to this table.
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

------------------------------------------------------------------
-- Categories
------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 140),
  description text check (char_length(description) <= 2000),
  image_path text,
  display_order integer not null default 0,
  is_published boolean not null default false,
  is_archived boolean not null default false,
  is_featured boolean not null default false,
  featured_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_archived_not_published check (not (is_archived and is_published))
);

create unique index categories_slug_key on public.categories (slug);
create index categories_listing_idx on public.categories (is_published, is_archived, display_order);

create trigger categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

------------------------------------------------------------------
-- Products
------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 180),
  sku text check (sku is null or char_length(btrim(sku)) between 1 and 60),
  category_id uuid references public.categories (id) on delete restrict,
  product_type text not null default 'other'
    check (product_type in ('handloom_fabric', 'mattress', 'bedding', 'other')),
  short_description text check (char_length(short_description) <= 400),
  description text check (char_length(description) <= 8000),
  price numeric(12, 2) check (price is null or price >= 0),
  compare_at_price numeric(12, 2) check (compare_at_price is null or compare_at_price >= 0),
  price_label text check (char_length(price_label) <= 60),
  -- Structured, product-specific attributes
  specifications jsonb not null default '[]'::jsonb
    check (jsonb_typeof(specifications) = 'array'),
  materials text[] not null default '{}',
  sizes text[] not null default '{}',
  colours text[] not null default '{}',
  tags text[] not null default '{}',
  variants jsonb not null default '[]'::jsonb
    check (jsonb_typeof(variants) = 'array'),
  care_instructions text check (char_length(care_instructions) <= 3000),
  additional_notes text check (char_length(additional_notes) <= 3000),
  show_enquiry_button boolean not null default true,
  is_featured boolean not null default false,
  featured_order integer not null default 0,
  display_order integer not null default 0,
  is_published boolean not null default false,
  is_archived boolean not null default false,
  seo_title text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_archived_not_published check (not (is_archived and is_published)),
  constraint products_compare_price_valid
    check (compare_at_price is null or price is null or compare_at_price > price)
);

create unique index products_slug_key on public.products (slug);
create unique index products_sku_key on public.products (lower(sku)) where sku is not null;
create index products_category_idx on public.products (category_id);
create index products_listing_idx on public.products (is_published, is_archived, created_at desc);
create index products_featured_idx on public.products (is_featured, featured_order) where is_featured;

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

------------------------------------------------------------------
-- Product images
------------------------------------------------------------------
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  alt_text text check (char_length(alt_text) <= 300),
  position integer not null default 0,
  is_main boolean not null default false,
  created_at timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id, position);
create unique index product_images_one_main on public.product_images (product_id) where is_main;

------------------------------------------------------------------
-- Business settings (single row) and homepage sections
------------------------------------------------------------------
create table public.business_settings (
  id integer primary key default 1 check (id = 1),
  name_en text not null default 'RK HANDLOOM' check (char_length(btrim(name_en)) between 1 and 120),
  name_hi text check (char_length(name_hi) <= 120),
  tagline text check (char_length(tagline) <= 160),
  short_description text check (char_length(short_description) <= 300),
  long_description text check (char_length(long_description) <= 4000),
  phone text check (char_length(phone) <= 30),
  whatsapp_number text check (whatsapp_number is null or whatsapp_number ~ '^[0-9]{8,15}$'),
  email text check (char_length(email) <= 200),
  address text check (char_length(address) <= 400),
  location_code text check (char_length(location_code) <= 80),
  maps_url text check (maps_url is null or maps_url ~* '^https://'),
  hours jsonb not null default '[]'::jsonb check (jsonb_typeof(hours) = 'array'),
  hours_note text check (char_length(hours_note) <= 300),
  social jsonb not null default '{}'::jsonb check (jsonb_typeof(social) = 'object'),
  logo_path text,
  -- Homepage
  hero_image_path text,
  hero_heading text check (char_length(hero_heading) <= 160),
  hero_subheading text check (char_length(hero_subheading) <= 400),
  hero_primary_label text check (char_length(hero_primary_label) <= 40),
  hero_primary_link text check (char_length(hero_primary_link) <= 300),
  hero_secondary_label text check (char_length(hero_secondary_label) <= 40),
  hero_secondary_link text check (char_length(hero_secondary_link) <= 300),
  craft_heading text check (char_length(craft_heading) <= 160),
  craft_body text check (char_length(craft_body) <= 2000),
  about_heading text check (char_length(about_heading) <= 160),
  about_body text check (char_length(about_body) <= 6000),
  contact_heading text check (char_length(contact_heading) <= 160),
  contact_body text check (char_length(contact_body) <= 1000),
  footer_text text check (char_length(footer_text) <= 500),
  announcement_enabled boolean not null default false,
  announcement_text text check (char_length(announcement_text) <= 200),
  announcement_link text check (char_length(announcement_link) <= 300),
  -- Appearance and display
  accent_theme text not null default 'olive' check (accent_theme in ('olive', 'earth', 'walnut')),
  call_label text check (char_length(call_label) <= 30),
  whatsapp_label text check (char_length(whatsapp_label) <= 30),
  directions_label text check (char_length(directions_label) <= 30),
  catalogue_page_size integer not null default 12 check (catalogue_page_size between 6 and 48),
  show_prices boolean not null default true,
  show_sku boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger business_settings_updated_at
  before update on public.business_settings
  for each row execute function public.set_updated_at();

create table public.homepage_sections (
  key text primary key check (key in (
    'featured_categories', 'featured_products', 'discovery', 'craft', 'store_info', 'contact'
  )),
  label text not null,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  heading text check (char_length(heading) <= 160),
  body text check (char_length(body) <= 1000),
  updated_at timestamptz not null default now()
);

create trigger homepage_sections_updated_at
  before update on public.homepage_sections
  for each row execute function public.set_updated_at();

------------------------------------------------------------------
-- Integrity guards
------------------------------------------------------------------
-- Publishing rules: products start as drafts; a product can be published only when
-- it has a category (that is not archived) and at least one image.
create or replace function public.products_publish_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.is_published then
    raise exception 'New products must be saved as drafts first, then published once images are added.'
      using errcode = '23514';
  end if;

  if new.is_published then
    if new.category_id is null then
      raise exception 'Choose a category before publishing this product.' using errcode = '23514';
    end if;
    if exists (select 1 from public.categories c where c.id = new.category_id and c.is_archived) then
      raise exception 'This product''s category is archived. Pick an active category before publishing.'
        using errcode = '23514';
    end if;
    if tg_op = 'UPDATE' and old.is_published is not true then
      if not exists (select 1 from public.product_images i where i.product_id = new.id) then
        raise exception 'Add at least one image before publishing this product.' using errcode = '23514';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger products_publish_guard
  before insert or update on public.products
  for each row execute function public.products_publish_guard();

-- A category cannot be archived while active (non-archived) products still use it.
create or replace function public.categories_archive_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_archived and not old.is_archived then
    if exists (
      select 1 from public.products p
      where p.category_id = new.id and not p.is_archived
    ) then
      raise exception 'Move or archive the products in this category before archiving it.'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger categories_archive_guard
  before update on public.categories
  for each row execute function public.categories_archive_guard();

-- Keep a main image: when the main image is removed, promote the next one.
create or replace function public.product_images_promote_main()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.is_main then
    update public.product_images
       set is_main = true
     where id = (
       select id from public.product_images
        where product_id = old.product_id
        order by position, created_at
        limit 1
     );
  end if;
  return null;
end;
$$;

create trigger product_images_promote_main
  after delete on public.product_images
  for each row execute function public.product_images_promote_main();

-- Atomic helpers used by the admin image manager (security invoker: RLS applies).
create or replace function public.set_main_product_image(p_image_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_product uuid;
begin
  select product_id into v_product from public.product_images where id = p_image_id;
  if v_product is null then
    raise exception 'Image not found.' using errcode = 'P0002';
  end if;
  update public.product_images set is_main = false
   where product_id = v_product and is_main and id <> p_image_id;
  update public.product_images set is_main = true where id = p_image_id;
end;
$$;

create or replace function public.reorder_product_images(p_product_id uuid, p_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.product_images i
     set position = o.ord
    from unnest(p_ids) with ordinality as o(id, ord)
   where i.id = o.id and i.product_id = p_product_id;
end;
$$;

revoke all on function public.set_main_product_image(uuid) from public;
revoke all on function public.reorder_product_images(uuid, uuid[]) from public;
grant execute on function public.set_main_product_image(uuid) to authenticated;
grant execute on function public.reorder_product_images(uuid, uuid[]) to authenticated;
