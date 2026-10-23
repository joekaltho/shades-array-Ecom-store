-- OPTIONAL: four sample products so you can preview the storefront.
-- Delete them from Admin → Products before you launch. Run seed.sql first.
insert into public.products (slug, name, description, price, category_id, status, featured, stock, images, specs)
select 'vanguard-noir', 'Vanguard Noir', 'Thick black frame with gold-tone hinges and dark polarised lenses.',
       38000, (select id from public.categories where slug = 'bold'), 'active', true, 14,
       array['/images/hero.jpg'], '{"frame":"Black / gold","lens":"Smoke grey","uv":"UV400"}'::jsonb
on conflict (slug) do nothing;

insert into public.products (slug, name, description, price, category_id, status, featured, stock, images, specs)
select 'aureate-aviator', 'Aureate Aviator', 'Slim metal aviator with a double brow bar and amber gradient lenses.',
       45000, (select id from public.categories where slug = 'classic'), 'active', true, 8,
       array['/images/classic.jpg'], '{"frame":"Gold","lens":"Amber gradient","uv":"UV400"}'::jsonb
on conflict (slug) do nothing;

insert into public.products (slug, name, description, price, category_id, status, featured, badge, stock, images, specs)
select 'mirage-visor', 'Mirage Visor', 'One-piece wraparound shield with rose-gold arms and mirrored pink lenses.',
       58000, (select id from public.categories where slug = 'statement'), 'active', true, 'Limited', 5,
       array['/images/statement.jpg'], '{"frame":"Rose gold","lens":"Pink mirror","uv":"UV400"}'::jsonb
on conflict (slug) do nothing;

insert into public.products (slug, name, description, price, category_id, status, featured, stock, images, specs)
select 'kano-hex', 'Kano Hex', 'Hexagonal lenses in a thin brass-tone frame.',
       42000, (select id from public.categories where slug = 'bold'), 'active', false, 11,
       array['/images/bold.jpg'], '{"frame":"Brass / black","lens":"G-15 green","uv":"UV400"}'::jsonb
on conflict (slug) do nothing;
