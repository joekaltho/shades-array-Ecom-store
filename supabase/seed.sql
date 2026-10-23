-- Starter categories. Safe to run more than once. Rename, reorder or delete them
-- later from Admin → Categories.
insert into public.categories (slug, name, tagline, description, image_url, sort_order) values
  ('classic',   'Classic',   'Timeless shapes that never date.',     'Aviators and rounded frames for everyday wear.', '/images/classic.jpg',   1),
  ('bold',      'Bold',      'Thick frames with real presence.',     'Heavier, sharper shapes for a stronger look.',   '/images/bold.jpg',      2),
  ('everyday',  'Everyday',  'Light, simple and easy to live in.',   'Comfortable frames made for daily use.',         '/images/hero.jpg',      3),
  ('statement', 'Statement', 'Oversized and visor styles.',          'Standout shapes for people who want to be seen.','/images/statement.jpg', 4)
on conflict (slug) do nothing;
