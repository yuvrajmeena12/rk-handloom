import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

/**
 * Runs the real migrations against an in-process Postgres (PGlite) and exercises
 * the Row Level Security policies and integrity triggers as the anon, a signed-in
 * non-admin, and the owner role. Storage policies (storage.objects) need Supabase's
 * storage schema and are covered by the manual checklist in the README.
 */

const ADMIN_ID = '11111111-1111-1111-1111-111111111111'
const USER_ID = '22222222-2222-2222-2222-222222222222'

const migration = (file: string) =>
  readFileSync(path.resolve(import.meta.dirname, '../supabase/migrations', file), 'utf8')

let db: PGlite

async function as<T>(role: 'anon' | 'authenticated', uid: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${role}`)
  await db.exec(`select set_config('request.jwt.claim.sub', '${uid ?? ''}', false)`)
  try {
    return await fn()
  } finally {
    await db.exec('reset role')
    await db.exec(`select set_config('request.jwt.claim.sub', '', false)`)
  }
}

const asAnon = <T>(fn: () => Promise<T>) => as('anon', null, fn)
const asUser = <T>(fn: () => Promise<T>) => as('authenticated', USER_ID, fn)
const asAdmin = <T>(fn: () => Promise<T>) => as('authenticated', ADMIN_ID, fn)

async function expectRejected(promise: Promise<unknown>, pattern: RegExp) {
  await expect(promise).rejects.toThrow(pattern)
}

beforeAll(async () => {
  db = new PGlite()
  // Minimal stand-ins for the Supabase environment.
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth to anon, authenticated;
    grant usage on schema public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    insert into auth.users (id, email) values
      ('${ADMIN_ID}', 'owner@example.com'),
      ('${USER_ID}', 'customer@example.com');
  `)
  await db.exec(migration('0001_schema.sql'))
  await db.exec(migration('0002_rls.sql'))
  await db.exec(migration('0004_seed.sql'))
  // Provision the owner the way the README describes (as the privileged role).
  await db.exec(`insert into public.admin_users (user_id) values ('${ADMIN_ID}')`)
})

async function createProduct(slug: string, categorySlug = 'handloom') {
  const res = await db.query<{ id: string }>(
    `insert into products (name, slug, category_id)
     values ($1, $2, (select id from categories where slug = $3)) returning id`,
    [slug.toUpperCase(), slug, categorySlug],
  )
  return res.rows[0].id
}

async function addImage(productId: string, name: string, main = false) {
  const res = await db.query<{ id: string }>(
    `insert into product_images (product_id, storage_path, position, is_main)
     values ($1, $2, 0, $3) returning id`,
    [productId, `products/${name}.webp`, main],
  )
  return res.rows[0].id
}

describe('public (anonymous) access', () => {
  it('can read business settings and published categories', async () => {
    const settings = await asAnon(() => db.query('select name_en, phone from business_settings'))
    expect(settings.rows).toHaveLength(1)
    const cats = await asAnon(() => db.query('select slug from categories order by display_order'))
    expect((cats.rows as Array<{ slug: string }>).map((r) => r.slug)).toEqual(['handloom', 'mattresses'])
  })

  it('cannot read admin_users', async () => {
    await expectRejected(asAnon(() => db.query('select * from admin_users')), /permission denied/i)
  })

  it('cannot create, edit or delete products and categories', async () => {
    await expectRejected(
      asAnon(() => db.query(`insert into products (name, slug) values ('x', 'x')`)),
      /permission denied/i,
    )
    await expectRejected(
      asAnon(() => db.query(`update categories set name = 'hacked'`)),
      /permission denied/i,
    )
    await expectRejected(asAnon(() => db.query('delete from products')), /permission denied/i)
  })

  it('cannot edit business settings', async () => {
    await expectRejected(
      asAnon(() => db.query(`update business_settings set phone = '000'`)),
      /permission denied/i,
    )
  })
})

describe('signed-in non-admin (e.g. a customer account)', () => {
  it('cannot write catalogue data', async () => {
    await expectRejected(
      asUser(() => db.query(`insert into products (name, slug) values ('x', 'x2')`)),
      /row-level security/i,
    )
  })

  it('updates to business settings and categories affect no rows', async () => {
    const before = await db.query<{ phone: string }>('select phone from business_settings')
    await asUser(() => db.query(`update business_settings set phone = '000'`))
    await asUser(() => db.query(`update categories set name = 'hacked'`))
    const after = await db.query<{ phone: string }>('select phone from business_settings')
    expect(after.rows[0].phone).toBe(before.rows[0].phone)
    const names = await db.query<{ name: string }>(`select name from categories where name = 'hacked'`)
    expect(names.rows).toHaveLength(0)
  })

  it('cannot grant themselves admin privileges', async () => {
    await expectRejected(
      asUser(() => db.query(`insert into admin_users (user_id) values ('${USER_ID}')`)),
      /permission denied/i,
    )
  })

  it('is_admin() is false for them and true for the owner', async () => {
    const user = await asUser(() => db.query<{ is_admin: boolean }>('select is_admin() as is_admin'))
    const admin = await asAdmin(() => db.query<{ is_admin: boolean }>('select is_admin() as is_admin'))
    expect(user.rows[0].is_admin).toBe(false)
    expect(admin.rows[0].is_admin).toBe(true)
  })
})

describe('owner access and publishing rules', () => {
  it('can create a draft, which stays hidden from the public', async () => {
    const id = await asAdmin(async () => {
      const r = await db.query<{ id: string }>(
        `insert into products (name, slug, category_id)
         values ('Draft Throw', 'draft-throw', (select id from categories where slug = 'handloom'))
         returning id`,
      )
      return r.rows[0].id
    })
    const visible = await asAnon(() => db.query('select id from products where id = $1', [id]))
    expect(visible.rows).toHaveLength(0)
    const asOwner = await asAdmin(() => db.query('select id from products where id = $1', [id]))
    expect(asOwner.rows).toHaveLength(1)
  })

  it('rejects inserting a product that is already published', async () => {
    await expectRejected(
      asAdmin(() =>
        db.query(
          `insert into products (name, slug, category_id, is_published)
           values ('Eager', 'eager', (select id from categories where slug = 'handloom'), true)`,
        ),
      ),
      /saved as drafts first/i,
    )
  })

  it('rejects publishing without an image or without a category', async () => {
    const noImage = await createProduct('no-image')
    await expectRejected(
      asAdmin(() => db.query('update products set is_published = true where id = $1', [noImage])),
      /at least one image/i,
    )
    const noCat = await db.query<{ id: string }>(
      `insert into products (name, slug) values ('Uncategorised', 'uncategorised') returning id`,
    )
    await addImage(noCat.rows[0].id, 'uncat', true)
    await expectRejected(
      asAdmin(() => db.query('update products set is_published = true where id = $1', [noCat.rows[0].id])),
      /choose a category/i,
    )
  })

  it('publishing makes a product and its images public; unpublishing hides them again', async () => {
    const id = await createProduct('cotton-dari')
    await addImage(id, 'dari-1', true)

    // Hidden while draft: product, image, and via category listing
    expect((await asAnon(() => db.query('select 1 from products where id = $1', [id]))).rows).toHaveLength(0)
    expect((await asAnon(() => db.query('select 1 from product_images where product_id = $1', [id]))).rows).toHaveLength(0)

    await asAdmin(() => db.query('update products set is_published = true where id = $1', [id]))
    expect((await asAnon(() => db.query('select 1 from products where slug = $1', ['cotton-dari']))).rows).toHaveLength(1)
    expect((await asAnon(() => db.query('select 1 from product_images where product_id = $1', [id]))).rows).toHaveLength(1)

    await asAdmin(() => db.query('update products set is_published = false where id = $1', [id]))
    expect((await asAnon(() => db.query('select 1 from products where id = $1', [id]))).rows).toHaveLength(0)
    expect((await asAnon(() => db.query('select 1 from product_images where product_id = $1', [id]))).rows).toHaveLength(0)
  })

  it('hides products whose category is hidden, and archived products', async () => {
    const id = await createProduct('foam-mattress', 'mattresses')
    await addImage(id, 'foam-1', true)
    await asAdmin(() => db.query('update products set is_published = true where id = $1', [id]))
    expect((await asAnon(() => db.query('select 1 from products where id = $1', [id]))).rows).toHaveLength(1)

    await asAdmin(() => db.query(`update categories set is_published = false where slug = 'mattresses'`))
    expect((await asAnon(() => db.query('select 1 from products where id = $1', [id]))).rows).toHaveLength(0)
    await asAdmin(() => db.query(`update categories set is_published = true where slug = 'mattresses'`))
    expect((await asAnon(() => db.query('select 1 from products where id = $1', [id]))).rows).toHaveLength(1)

    // An archived product cannot stay published.
    await expectRejected(
      asAdmin(() => db.query('update products set is_archived = true where id = $1', [id])),
      /archived_not_published/i,
    )
    await asAdmin(() => db.query('update products set is_published = false, is_archived = true where id = $1', [id]))
    expect((await asAnon(() => db.query('select 1 from products where id = $1', [id]))).rows).toHaveLength(0)
  })

  it('enforces unique slugs and SKUs', async () => {
    await createProduct('unique-slug')
    await expectRejected(createProduct('unique-slug'), /products_slug_key|duplicate key/i)
    await db.query(`update products set sku = 'RK-001' where slug = 'unique-slug'`)
    await expectRejected(
      db.query(`insert into products (name, slug, sku) values ('Other', 'other-sku', 'rk-001')`),
      /products_sku_key|duplicate key/i,
    )
  })

  it('protects categories from deletion and archiving while products use them', async () => {
    await expectRejected(
      asAdmin(() => db.query(`delete from categories where slug = 'handloom'`)),
      /foreign key|violates/i,
    )
    await expectRejected(
      asAdmin(() => db.query(`update categories set is_archived = true, is_published = false where slug = 'handloom'`)),
      /move or archive the products/i,
    )
    const empty = await asAdmin(() =>
      db.query<{ id: string }>(`insert into categories (name, slug) values ('Empty', 'empty') returning id`),
    )
    await asAdmin(() => db.query('update categories set is_archived = true where id = $1', [empty.rows[0].id]))
    expect((await asAnon(() => db.query(`select 1 from categories where slug = 'empty'`))).rows).toHaveLength(0)
  })

  it('manages the main image: switching, and promotion when the main is removed', async () => {
    const id = await createProduct('image-product')
    const a = await addImage(id, 'a', true)
    const b = await addImage(id, 'b', false)

    await asAdmin(() => db.query('select set_main_product_image($1)', [b]))
    const afterSwitch = await db.query<{ id: string; is_main: boolean }>(
      'select id, is_main from product_images where product_id = $1', [id],
    )
    expect(afterSwitch.rows.filter((r) => r.is_main).map((r) => r.id)).toEqual([b])

    await asAdmin(() => db.query('delete from product_images where id = $1', [b]))
    const afterDelete = await db.query<{ id: string; is_main: boolean }>(
      'select id, is_main from product_images where product_id = $1', [id],
    )
    expect(afterDelete.rows).toEqual([{ id: a, is_main: true }])
  })

  it('reorders images atomically, and non-admins cannot', async () => {
    const id = await createProduct('reorder-product')
    const x = await addImage(id, 'x', true)
    const y = await addImage(id, 'y')
    const z = await addImage(id, 'z')
    await asAdmin(() => db.query('select reorder_product_images($1, $2)', [id, [z, x, y]]))
    const rows = await db.query<{ id: string }>(
      'select id from product_images where product_id = $1 order by position', [id],
    )
    expect(rows.rows.map((r) => r.id)).toEqual([z, x, y])

    await asUser(() => db.query('select reorder_product_images($1, $2)', [id, [y, x, z]]))
    const unchanged = await db.query<{ id: string }>(
      'select id from product_images where product_id = $1 order by position', [id],
    )
    expect(unchanged.rows.map((r) => r.id)).toEqual([z, x, y])
  })

  it('lets the owner edit business settings and homepage sections', async () => {
    await asAdmin(() => db.query(`update business_settings set tagline = 'Updated tagline'`))
    await asAdmin(() => db.query(`update homepage_sections set is_visible = false where key = 'craft'`))
    const s = await asAnon(() => db.query<{ tagline: string }>('select tagline from business_settings'))
    expect(s.rows[0].tagline).toBe('Updated tagline')
    const h = await asAnon(() => db.query<{ is_visible: boolean }>(`select is_visible from homepage_sections where key = 'craft'`))
    expect(h.rows[0].is_visible).toBe(false)
  })

  it('validates business settings constraints', async () => {
    await expectRejected(
      asAdmin(() => db.query(`update business_settings set whatsapp_number = '+91 98291'`)),
      /whatsapp_number/i,
    )
    await expectRejected(
      asAdmin(() => db.query(`update business_settings set maps_url = 'javascript:alert(1)'`)),
      /maps_url/i,
    )
  })
})

describe('seed data', () => {
  it('contains the verified business details and no invented claims', async () => {
    const { rows } = await db.query<Record<string, string>>(
      'select name_en, name_hi, phone, whatsapp_number, address, location_code from business_settings',
    )
    expect(rows[0].name_en).toBe('RK HANDLOOM')
    expect(rows[0].name_hi).toBe('आरके हैंडलूम')
    expect(rows[0].phone).toBe('+91 98291 08112')
    expect(rows[0].whatsapp_number).toBe('919829108112')
    expect(rows[0].address).toContain('Sendra Road')
    expect(rows[0].location_code).toBe('38X4+JR Beawar, Rajasthan')
    const products = await db.query(`select count(*)::int as n from products where name ilike '%test%'`)
    expect((products.rows[0] as { n: number }).n).toBe(0)
  })
})
