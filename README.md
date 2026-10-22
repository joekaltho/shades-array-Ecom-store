# Shades Array

Storefront and admin for Shades Array sunglasses. Shoppers browse, fill a bag and finish the order on WhatsApp. You manage products, photos, orders and store details from `/admin`.

**Stack:** Vite, React 19, TypeScript, Tailwind 4, Supabase (Postgres, Auth, Storage), deployed on Vercel.

## 1. Set up Supabase (once)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run, in this order:
   - `supabase/migrations/0001_init.sql` (tables, security rules, image bucket)
   - `supabase/seed.sql` (starter categories)
   - optional: `supabase/demo-products.sql` (four sample products to preview the store; delete them before launch)
3. **Authentication → Users → Add user**: create your own login (email and password, tick auto-confirm).
4. Make that user an admin by running this in the SQL Editor, with your email:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```
5. **Authentication → Sign In / Providers**: turn off **Allow new users to sign up**.
6. **Project Settings → API**: copy the Project URL and the `anon` public key.

Only users listed in `public.admins` can change anything. Everyone else, signed in or not, can only read live products.

## 2. Run it locally

```bash
npm install
cp .env.example .env      # paste your Supabase URL and anon key
npm run dev
```

With no `.env`, `npm run dev` still works: it uses sample data kept in your browser, and any email and password signs in to the admin. That mode is removed from production builds.

Other commands: `npm run build`, `npm test`, `npm run lint`.

## 3. Deploy on Vercel

1. Import the repo into Vercel. The framework is detected as Vite.
2. Add the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Deploy. `vercel.json` already handles page routing, caching and security headers.

Admin lives at `https://your-domain/admin`. There is no public link to it.

## Using the admin

- **Products**: add, edit, publish or hide, feature on the homepage, upload photos (resized in the browser before upload). New products start as **Draft** and only appear on the store once set to **Live**.
- **Orders**: every “Order on WhatsApp” tap is saved as a **New** order, with a short ref that also appears in the customer’s WhatsApp message. Add their name, phone and address once you’re chatting, then move it through Confirmed, Paid and Delivered. Confirmed, Paid and Delivered take the items out of stock; Cancelled puts them back. You can also add orders by hand (Instagram DMs, walk-ins) and export to CSV.
- **Categories**: add, rename, reorder.
- **Settings**: store name, WhatsApp number, Instagram, email, address, homepage banner, announcement bar, About text, delivery note, footer text, and your password.

## Good to know

- The logo lives in `public/brand/` (`logo.png` with the tagline, `logo-wordmark.png` without) and the browser icon is `public/favicon.png`. Replace those files to change them.
- The product and banner photos that ship in `public/images` are placeholders. Replace them with your own photos before launch.
- Orders are recorded by the browser when someone taps the WhatsApp button, so anyone could in theory add junk orders. They’re harmless (they never touch stock until you confirm them) and easy to delete. Add rate limiting in Supabase if this ever becomes a problem.
- Shared product links show the site’s general title and description in previews, because this is a client-side app. Per-product previews would need server rendering.
