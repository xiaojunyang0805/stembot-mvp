# WP1 Summary: StemBot MVP Setup and Authentication

**Date Completed:** August 30, 2025  
**Project:** StemBot MVP  
**Work Package:** WP1 (Project Setup and Basic Authentication)  
**Author:** [Your Name]  
**Repository:** `https://github.com/[your-username]/stembot-mvp`  
**Deployed URL:** `https://stembot-mvp.vercel.app`

## Overview
Work Package 1 (WP1) focused on setting up the StemBot MVP project, initializing a Next.js application, integrating Supabase for authentication, implementing Google OAuth, building a basic dashboard, and deploying to Vercel. Completed within a part-time schedule (20 hours/week) from August 25-30, 2025, WP1 establishes the foundation for WP2 (Core UI & File Uploads).

## Tasks Completed
### Task 1: Environment Setup
- **Objective:** Set up development environment.
- **Actions:**
  - Installed Node.js v18+, VS Code, and Git.
  - Configured GitHub repository (`stembot-mvp`).
  - Set up Trello for task tracking.
- **Outcome:** Development tools installed, repo initialized, project management in place.
- **Time:** ~2 hours.

### Task 2: Next.js Project Initialization
- **Objective:** Create a Next.js app with TypeScript and Tailwind CSS.
- **Actions:**
  - Ran `npx create-next-app@latest stembot --typescript --tailwind`.
  - Configured ESLint and TypeScript settings.
  - Pushed initial code to GitHub.
- **Outcome:** Next.js app (`C:\stembot-mvp\stembot`) created with TypeScript, Tailwind, and ESLint.
- **Time:** ~3 hours.

### Task 3: Supabase Integration
- **Objective:** Connect Supabase for authentication.
- **Actions:**
  - Created Supabase project (`stembot`).
  - Added env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) to `.env.local`.
  - Initialized Supabase client in `utils/supabase/client.ts`.
- **Outcome:** Supabase connected, ready for auth implementation.
- **Time:** ~2 hours.

### Task 4: Google OAuth and Vercel Deployment
- **Objective:** Implement Google OAuth, build a login page and dashboard, and deploy to Vercel.
- **Actions:**
  - **Login Page (`app/page.tsx`):**
    - Created a "Sign in with Google" button using `supabase.auth.signInWithOAuth`.
    - Configured redirect to `/dashboard` (initially `/auth` for testing).
    - Used Tailwind CSS for styling.
  - **Dashboard (`app/dashboard/page.tsx`):**
    - Built client-side page to fetch user data with `supabase.auth.getUser()`.
    - Displayed user email and added logout button (`supabase.auth.signOut`).
    - Fixed TypeScript errors (see Issues below).
  - **OAuth Setup:**
    - Configured Google OAuth in Google Cloud Console (Client ID, origins, redirect URIs).
    - Added redirect URLs (`http://localhost:3000/dashboard`, `https://stembot-mvp.vercel.app/dashboard`) in Supabase.
  - **Vercel Deployment:**
    - Added env vars to Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
    - Fixed deployment issues (see Issues below).
    - Deployed to `stembot-mvp.vercel.app`.
  - **Testing:**
    - Local: Tested login, dashboard, and logout in incognito mode.
    - Online: Verified auth flow on `stembot-mvp.vercel.app`, checked Supabase Users table.
- **Outcome:** Working Google auth flow (login, dashboard with email, logout) deployed on Vercel.
- **Time:** ~10-12 hours (including debugging).

## Issues and Fixes
1. **Initial Redirect Misconfiguration:**
   - **Issue:** Used `/auth` instead of `/dashboard` for OAuth redirect, causing a temporary callback page.
   - **Fix:** Updated `app/page.tsx` `redirectTo` to `http://localhost:3000/dashboard` and Supabase redirect URLs.
   - **Lesson:** Plan redirect routes early and test both local and production URLs.

2. **TypeScript ESLint Error (`no-explicit-any`):**
   - **Issue:** Vercel build failed due to `useState<any>` in `app/dashboard/page.tsx` (line 6).
   - **Fix:** Replaced `any` with `User | null` from `@supabase/supabase-js`.
   - **Lesson:** Use Supabase TypeScript types early; run `npm run build` locally before pushing.

3. **TypeScript Import Error (`User` not exported):**
   - **Issue:** `import { User } from '@/utils/supabase/client'` failed as `client.ts` didn’t export `User`.
   - **Fix:** Imported `User` directly from `@supabase/supabase-js` in `page.tsx`.
   - **Lesson:** Verify type exports in utility files or import directly from source packages.

4. **404 NOT_FOUND on `stembot-mvp.vercel.app`:**
   - **Issue:** Vercel URL showed 404 due to Framework Preset set to “Other” instead of Next.js.
   - **Fix:** Changed Framework Preset to Next.js in Vercel > Settings > General.
   - **Lesson:** Always confirm Framework Preset matches project (Next.js); test default URL first.

## Lessons Learned
- **TypeScript Best Practices:** Use specific types (e.g., Supabase’s `User`) to avoid ESLint errors; run `npm run build` locally to catch issues before deployment.
- **Vercel Configuration:** Set Framework Preset correctly and verify domain settings (default vs. custom) to prevent 404s.
- **OAuth Setup:** Ensure redirect URLs match exactly in Google Cloud, Supabase, and code for both local and production environments.
- **Debugging Strategy:** Test locally first, use incognito mode, check browser console and Vercel logs, and isolate issues systematically.
- **Documentation:** Maintain `debug-log.md` for issues, fixes, and lessons to streamline future tasks.

## Next Steps
- **WP2 (Core UI & File Uploads):** Starting September 9, 2025, per `250828 StemBot_MVP_120_Days.docx`.
  - Build interactive dashboard UI.
  - Implement file upload form with Supabase Storage.
- **Immediate Actions:**
  - Review WP2 tasks in Trello and project plan.
  - Generate Supabase TypeScript types for database schema (`supabase gen types typescript --project-id [your-id] --schema public`).
  - Plan WP2 debugging strategy based on WP1 lessons (e.g., early type checks, frequent local builds).

## Status
- **WP1 Complete:** August 30, 2025.
- **Milestone Achieved:** Running Next.js app with Google OAuth, dashboard, and logout, deployed on `https://stembot-mvp.vercel.app`.
- **Trello Updated:** Task 4 marked complete with notes on fixes and deployment.