-- Initial content. Everything here is editable from the admin panel.
-- Only the supplied, verified business details are stated as fact. Descriptive copy is a
-- neutral starting point and makes no claims about history, certifications or ratings.

insert into public.business_settings (
  id, name_en, name_hi, tagline, short_description, long_description,
  phone, whatsapp_number, address, location_code, hours, hours_note,
  hero_heading, hero_subheading,
  hero_primary_label, hero_primary_link, hero_secondary_label, hero_secondary_link,
  craft_heading, craft_body, about_heading, about_body,
  contact_heading, contact_body, footer_text,
  call_label, whatsapp_label, directions_label
) values (
  1,
  'RK HANDLOOM',
  'आरके हैंडलूम',
  'Handloom & mattresses in Beawar',
  'A handloom and mattress store on Sendra Road, Beawar, Rajasthan.',
  'RK HANDLOOM is a handloom and mattress store in Vidya Nagar, Beawar. Browse the catalogue online, then call or message us on WhatsApp to ask about a product, sizes or pricing.',
  '+91 98291 08112',
  '919829108112',
  'RK Handloom, Sendra Road, near Hera Hospital, Vidya Nagar, Beawar, Rajasthan 305901, India',
  '38X4+JR Beawar, Rajasthan',
  '[
    {"day":"Monday","open":null,"close":null,"closed":false},
    {"day":"Tuesday","open":null,"close":null,"closed":false},
    {"day":"Wednesday","open":null,"close":null,"closed":false},
    {"day":"Thursday","open":null,"close":null,"closed":false},
    {"day":"Friday","open":null,"close":null,"closed":false},
    {"day":"Saturday","open":null,"close":null,"closed":false},
    {"day":"Sunday","open":null,"close":null,"closed":false}
  ]'::jsonb,
  'Listed as opening at 9:00 AM. Please call to confirm today''s timings.',
  'Handloom textiles and mattresses, chosen with care.',
  'Explore our catalogue of handloom products and mattresses, then visit the store in Beawar or message us to enquire.',
  'Browse the catalogue', '/catalog',
  'Get directions', '#directions',
  'Textiles and comfort for the home',
  'Our catalogue brings together handloom products and mattresses for the home. Visit the store to see and feel the products, or contact us for details on sizes, materials and availability.',
  'About RK HANDLOOM',
  'RK HANDLOOM is a handloom and mattress store in Beawar, Rajasthan. This catalogue lets you explore what we offer before you visit or get in touch. For details about any product, call or message us on WhatsApp.',
  'Visit or contact us',
  'Questions about a product, size or price? Call or message us and we will be happy to help.',
  'RK HANDLOOM, Sendra Road, Beawar, Rajasthan.',
  'Call us', 'WhatsApp', 'Get directions'
)
on conflict (id) do nothing;

insert into public.homepage_sections (key, label, is_visible, display_order, heading, body) values
  ('featured_categories', 'Featured categories', true, 1, 'Shop by category', 'Explore our collections.'),
  ('featured_products', 'Featured products', true, 2, 'Featured products', 'A selection from the catalogue.'),
  ('discovery', 'Product discovery', true, 3, 'Find what you need', 'Search the catalogue by name, code or category.'),
  ('craft', 'Craftsmanship introduction', true, 4, null, null),
  ('store_info', 'Store information', true, 5, 'Visit the store', null),
  ('contact', 'Contact and location', true, 6, null, null)
on conflict (key) do nothing;

-- Starter categories derived from the business type. Rename, reorder or archive freely.
insert into public.categories (name, slug, description, display_order, is_published, is_featured, featured_order) values
  ('Handloom', 'handloom', 'Handloom textiles and home furnishings.', 1, true, true, 1),
  ('Mattresses', 'mattresses', 'Mattresses for comfortable sleep.', 2, true, true, 2)
on conflict do nothing;
