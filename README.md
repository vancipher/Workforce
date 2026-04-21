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

1. Create a public bucket named `employee-documents` (or match `VITE_SUPABASE_BUCKET`).
2. Add storage policies that allow authenticated or anonymous uploads/reads/deletes depending on your security model.
3. If you plan to add auth later, tighten policies to user-scoped access.

## Local Development

```bash
npm install
npm run dev
```

## Image Optimization Behavior

Before upload, images are optimized in the browser using `browser-image-compression`:

- Max dimension: `1024px`
- Target size: around `0.8MB`
- Preferred output format: `WebP`

This reduces Supabase storage usage and improves loading speed.

## Deploy to Vercel

1. Push project to GitHub.
2. Import repository in Vercel.
3. Add environment variables from `.env.example` in Vercel project settings.
4. Deploy.

Build command: `npm run build`

Output directory: `dist`
