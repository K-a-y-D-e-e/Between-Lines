# Between Lines

A private poetry archive for two people: poems, fragments and letters, with drafts, tags, favorites, search and image covers. Access is limited to two accounts, enforced in the database.

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS 3 · Framer Motion · Supabase (Postgres, Auth, Storage, Row Level Security) · Lucide icons.

## 1. Install

Requires Node.js 18.18 or newer.

```bash
npm install
cp .env.example .env.local
```

## 2. Supabase setup

1. Create a project at https://supabase.com.
2. In **Project Settings → API**, copy the **Project URL** and the **anon public key** into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

No service-role key is used or needed. Never put one in client code.

## 3. Database migration

Open **SQL Editor** and run the contents of `supabase/migrations/001_initial_schema.sql`. It creates the tables, indexes, triggers, RLS policies and the `media` storage bucket.

(With the Supabase CLI instead: `supabase link --project-ref <ref>` then `supabase db push`.)

## 4. Create the two accounts

There is no public registration.

1. In **Authentication → Providers → Email**, turn **off** "Allow new users to sign up" (and, for a simpler first login, turn off "Confirm email").
2. In **Authentication → Users → Add user → Create new user**, create your account first, then hers. Set each email and password there (passwords are never stored in this project). Tick "Auto Confirm User".
3. Run `supabase/setup.sql` in the SQL Editor. It names the first account "Karmadeept" and the second "Her". Edit the names in the file before running, or change them later in **Settings**.

A database trigger refuses to create a third account, even if sign-ups are accidentally re-enabled.

## 5. Optional demo content

Run `supabase/seed.sql` for 4 poems, 2 fragments and 2 letters (all original, all tagged `demo`). The removal statements are at the bottom of that file.

## 6. Run locally

```bash
npm run dev
```

Open http://localhost:3000 and log in.

## 7. Production build

```bash
npm run build
npm start
```

Type-check only: `npm run typecheck`.

## 8. Deploy to Vercel

1. Push this folder to a Git repository.
2. Import it at https://vercel.com/new (framework: Next.js is auto-detected).
3. Add the two environment variables from `.env.example`.
4. Deploy. Then, in Supabase **Authentication → URL Configuration**, set the Site URL to your Vercel domain.

## How it's organised

- One `writings` table holds poems, fragments and letters (`kind`), with `status` of `draft` or `published`.
- RLS: members read published writings and their own drafts; only the author can update or delete; favorites, tag links and storage uploads are scoped to their owner.
- `src/lib/queries.ts` holds all reads; `src/app/actions.ts` holds server actions; the editor writes through the browser client and relies on RLS.

## Known limitations

- Search filters title/body/tags/author in memory after the database query. That's fine for two authors; for large archives switch to a `tsvector` column (see the comment in `queries.ts`).
- Uploaded images live in a public bucket under unguessable file names. They're not indexed, but anyone with the exact URL can open one.
- Autosave applies to drafts only; published pieces change when you press Save changes.
