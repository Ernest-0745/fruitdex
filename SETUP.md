# FruitDex publishing and owner admin setup

The public guide works from `index.html` and `FruitDex-avatar.jpg`. Owner editing is protected by Supabase Auth plus database Row Level Security (RLS). The database policy only permits writes from `mciverernest1@gmail.com`; the browser config must use a **publishable** key, never a secret or service-role key.

## Connect the secure admin backend

1. Create a Supabase project using the owner email account.
2. In the project SQL Editor, run all of `supabase-schema.sql`.
3. In Supabase Project Settings → API, copy the Project URL and publishable key into `fruitdex-config.js`.
4. In Authentication → URL Configuration, set the Site URL to your eventual public site address and add that same address as an allowed redirect URL. The sign-in magic link returns to `#adminPanel`.
5. Enable the Supabase Email auth provider and require email confirmation. The first magic-link sign-in can create the owner account. Other accounts may be able to sign in, but the RLS policies prevent them from changing FruitDex data.
6. Host the contents of this folder as a static site. The site must use HTTPS and a real hosted URL; the admin login will not work from a `file://` URL.
7. Open the hosted address, select **Owner admin**, and email yourself a sign-in link. After you verify the link, publish the starter guide and trade data from the admin screen.

## Admin actions

After verified owner sign-in, the admin panel lets you edit/add guide entries and change community market or dealer values. Visitors can read the published tables but only the allowlisted owner can write to them.

## Search engines

The page includes indexing and social-preview metadata. Google can index the site after it is public, but a top search position is not guaranteed. Add the hosted site to Google Search Console and request indexing after you have a public domain. A high Google ranking is not guaranteed.
