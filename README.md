Tempra — Auto‑Apply and Stay Organized

- Tempra helps you auto‑apply on supported job sites, track application statuses, and keep your materials organized. Built as a modern SPA with responsive UI, strong accessibility, and SEO baked in.
Features

- Supabase auth: sign up/sign in, session handling, protected routes.
- Profile editor: saves structured data to user_profiles with upsert.
- Resume uploads: private resumes bucket with signed URL viewing.
- Dashboard: clean cards and quick actions, mobile-friendly grid.
- Accessibility: skip link, keyboard navigation, visible focus outlines, ARIA.
- SEO: Open Graph/Twitter cards, canonical, robots.txt , and sitemap.xml .
- Responsiveness: tuned breakpoints for header, hero, and profile grid.
- Motion-safe animations: subtle entrances and hover lifts respecting prefers-reduced-motion .
Tech Stack

- React 19 + Vite 7
- React Router 7
- Supabase JS v2
- ESLint (React hooks + Vite Refresh)
Getting Started

- Prerequisites:
  - Node >=18 and npm
  - Supabase project with URL and anon key
- Install:
  - npm install
- Environment:
  - Create .env in project root with:
    - VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
    - VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
- Develop:
  - npm run dev
  - Open http://localhost:5173/
Production

- Build:
  - npm run build
- Preview local build:
  - npm run preview
- Output:
  - dist/ with index.html , assets, and public files ( robots.txt , sitemap.xml , Tempra.png )
Supabase Setup

- Auth: enable email auth in Supabase dashboard.
- Table: user_profiles (example columns)
  - user_id uuid primary key
  - my_information jsonb
  - my_experience jsonb
  - application_questions jsonb
  - personal_information jsonb
  - self_identity jsonb
  - updated_at timestamptz
- Storage:
  - Bucket resumes (private). App uses signed URLs for viewing.
- RLS:
  - Enable Row Level Security; add policies so users can read/write their own user_profiles row and upload/list their own resume files.
Accessibility

- Keyboard: skip link to #main-content , dropdown and mobile menu keyboard support (Enter/Space/Escape).
- Focus: visible outlines across nav/buttons/inputs.
- Landmarks: header role="banner" , primary nav , main content role="main" .
SEO

- index.html : meta description, OG/Twitter cards, favicon, canonical, JSON‑LD.
- Dynamic titles: route-aware document.title and canonical updates in src/App.jsx .
- Crawling: public/robots.txt points to public/sitemap.xml .
Project Structure

- src/App.jsx — routes, header/nav, hero and CTA, accessibility hooks.
- src/pages/* — Auth , Dashboard , Profile pages.
- src/supabaseClient.js — uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY .
- src/styles.css — layout, responsive rules, animations, focus styles.
- public/ — static assets ( Tempra.png , robots.txt , sitemap.xml ).
Scripts

- npm run dev — start Vite dev server.
- npm run build — production build.
- npm run preview — preview production build locally.
- npm run lint — run ESLint.
Deployment Notes

- Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your host (Vercel/Netlify).
- Ensure public/robots.txt and public/sitemap.xml are served at site root.
- Update canonical and OG URLs to your production domain.
Contributing

- Fork and PRs welcome. Please run npm run lint before submitting.
