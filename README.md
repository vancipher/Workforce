# Employee Management App

Lightweight employee and document management dashboard for small teams (around 30-50 employees), built with React + Vite + Tailwind + Supabase.

## Features

- Employee CRUD (add, edit, delete, view)
- Search employees by name
- Optional phone and notes fields
- Upload multiple document images per employee
- Client-side image compression and resize before upload
- Document preview and delete
- Responsive, minimal dashboard UI

## Tech Stack

- React (Vite)
- Tailwind CSS (via `@tailwindcss/vite`)
- Supabase (Postgres + Storage)
- Deploy-ready for Vercel

## Environment Variables

Create a `.env` file (see `.env.example`):

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_BUCKET=employee-documents
VITE_SUPABASE_PRIVATE_DOCS=true
VITE_SIGNED_URL_TTL_SECONDS=900
VITE_IMAGE_TARGET_SIZE_KB=450
VITE_IMAGE_MAX_SIZE_KB=900
VITE_IMAGE_INPUT_LIMIT_MB=20
```

## Supabase Database Schema

Run this SQL in Supabase SQL Editor:

```sql
create extension if not exists "pgcrypto";

create table if not exists public.employees (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	phone text,
	notes text,
	created_at timestamptz not null default now()
);

create table if not exists public.documents (
	id uuid primary key default gen_random_uuid(),
	employee_id uuid not null references public.employees(id) on delete cascade,
	file_url text not null,
	created_at timestamptz not null default now()
);

create index if not exists documents_employee_id_idx on public.documents(employee_id);
```

## Supabase Storage Setup

1. Create a bucket named `employee-documents` (or match `VITE_SUPABASE_BUCKET`).
2. For sensitive worker IDs and documents, set the bucket to **private** and keep `VITE_SUPABASE_PRIVATE_DOCS=true`.
3. Add storage policies based on your security model. For best protection, require authenticated manager access only.
4. The app stores storage paths and generates short-lived signed URLs (default 15 minutes) for viewing documents.

## Local Development

```bash
npm install
npm run dev
```

## Image Optimization Behavior

Before upload, images are optimized in the browser using adaptive compression:

- Progressive dimensions: about `2600px` down to `1800px` depending on final size.
- Target size: `VITE_IMAGE_TARGET_SIZE_KB` (default `450KB`) to fit small buckets.
- Max accepted output size: `VITE_IMAGE_MAX_SIZE_KB` (default `900KB`).
- Preferred output format: `WebP` for smaller size while keeping readable text quality.

With defaults, a `50MB` bucket can typically hold many more document photos while keeping ID text legible.

## Security Notes

- Avoid using a public bucket for real IDs and HR documents.
- Keep signed URL expiry short (`VITE_SIGNED_URL_TTL_SECONDS`), and rotate manager credentials.
- Client-side login alone is not enough for strong security. For production, move to Supabase Auth with RLS policies tied to authenticated manager accounts.

This reduces Supabase storage usage and improves loading speed.

## Deploy to Vercel

1. Push project to GitHub.
2. Import repository in Vercel.
3. Add environment variables from `.env.example` in Vercel project settings.
4. Deploy.

Build command: `npm run build`

Output directory: `dist`
