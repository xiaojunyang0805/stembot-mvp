StemBot Project Notes
Consolidated debugging and task notes for WP1 and WP2, merged from notes.txt and debug-log.md.
WP1 Task 4: Debugging
August 2025

Issue: TypeScript error: Module '"@/utils/supabase/client"' has no exported member 'User'.
Fix: Imported User from @supabase/supabase-js or updated client.ts to export types.
Outcome: Local and Vercel builds succeeded.
Lessons: Import Supabase types directly or ensure client.ts exports them; run npm run build locally before pushing.


Issue: 404 NOT_FOUND on stembot-mvp.vercel.app.
Fix: Changed Framework Preset to Next.js in Vercel.
Outcome: App loads, auth flow works online.
Lessons: Set correct Framework Preset; test default URL before custom domains; verify OAuth URLs early.


Issue: Dashboard Logout 404 caused by missing app/login/page.tsx.
Fix: Created login page with Supabase Google auth; logout redirects correctly.
Lessons: Verify Supabase OAuth setup in dashboard early.



WP2 Task 1: Dashboard Styling and Authentication
August 31, 2025

Issue: "Menu" toggle button overlaid "Your Bots" heading in mobile view (iPhone SE).
Fix: Added pt-20 to <main> for mobile, md:pt-6 for desktop.
Outcome: "Menu" button visible, toggles sidebar, "Your Bots" clear.
Lessons: Use Tailwind responsive classes (sm:, md:) and test at specific breakpoints.


Issue: "Menu" button disappeared in mobile view (≤425px); clicking hid button but sidebar didn’t show.
Fix: Moved toggle button outside <aside>, used sm:hidden, conditional positioning (top-6 left-6 when closed, bottom-4 left-4 when open), set sidebar to block when isSidebarOpen.
Outcome: Mobile view works with single-column bot list, no overlay.
Lessons: Avoid hidden with translate-x-full; use fixed positioning carefully.


Notes: Desktop polished with bg-gray-50 sidebar, p-6 bot cards, hover:scale-105. Bot list uses grid-cols-1 md:grid-cols-2 lg:grid-cols-3. Navigation ("Dashboard", "Create Bot", "Logout") functional.

September 1, 2025

Notes: Original mock bots array for restoration:const bots: Bot[] = [
  { id: 1, name: "Bot 1", created_at: "2025-09-01" },
  { id: 2, name: "Bot 2", created_at: "2025-09-02" },
  { id: 3, name: "Bot 3", created_at: "2025-09-03" },
];


Issue: Empty bot list edge case not handled.
Fix: Added conditional rendering with "No bots yet" message using Tailwind.
Outcome: Mock data restored, no issues.
Lessons: Test edge cases like empty lists early; use Tailwind for consistent styling.

September 2, 2025

Issue: Unauthenticated users access /dashboard on Vercel (https://stembot-mvp.vercel.app/dashboard) without redirecting to /login.
Fix: Planned middleware or RLS fix in WP2 Task 3 (pending testing).
Outcome: [Pending Phase 4 testing].
Lessons: Enforce auth checks in middleware; test Vercel redirects early.


Issue: Google OAuth login failed to redirect to /dashboard.
Fix: Updated middleware.ts with createSupabaseServerClient, added lib/supabase/server-client.ts and browser-client.ts, created app/auth/callback/route.ts.
Outcome: Local /dashboard redirect works post-login.
Lessons: Use async cookie methods for Next.js 15, ensure correct redirectTo.
Notes: Added lib/supabase folder and app/auth/callback/route.ts.


Notes: Updated Supabase and Google OAuth configurations for WP2 Task 1.
Supabase:
Site URL: Changed to https://stembot-mvp.vercel.app.
Redirect URLs: Added http://localhost:3000/auth/callback, https://stembot-mvp.vercel.app/auth/callback, https://stembot-mvp.vercel.app/auth/confirm; removed http://localhost:3000/dashboard, http://localhost:3000/api/auth/callback, http://stembot-mvp.vercel.app/dashboard.
Email Confirmation: Enabled in Authentication > SignIn/Providers > Supabase Auth > User Signups.
SMTP Settings: Enable Custom SMTP disabled (using Supabase Platform Email Service).


Google OAuth:
Authorized JavaScript Origins: Kept http://localhost:3000, https://stembot-mvp.vercel.app; removed http://stembot.supabase.co.
Authorized Redirect URIs: Added http://localhost:3000/auth/callback, https://stembot-mvp.vercel.app/auth/callback, https://stembot-mvp.vercel.app/auth/confirm; removed http://localhost:3000/dashboard, https://stembot-mvp.vercel.app/dashboard, http://localhost:3000/api/auth/callback, https://lbezfsimdogrudqvkczx.supabase.co/auth/v1/callback.


September 2, 2025
Phase 4 testing, Step 4.1 - Local Login Test
Test: Google OAuth login at `http://localhost:3000/login` with test account.
Outcome: Redirected to /verify.

Issue: Logout button flashes login page, doesn’t redirect properly.
Test: Clicked "Logout" on `/dashboard` after login with verified account.
Fix: Updated app/dashboard/page.tsx, Added client component.
Outcome: Redirects to `/login` without flashing.

Phase 4, Step 4.2 - Local Dashboard Access Test
Test: Access `http://localhost:3000/dashboard` unauthenticated and unverified in incognito tab.
Outcome: Unauthenticated redirects to `/login`, unverified redirects to `/verify`.
Notes: Used testuser2@gmail.com for unverified test, checked middleware logs.

Phase 4, Step 4.4 - Vercel Deployment Fix (no-explicit-any and CookieMethodsServer)**
Issue: Build failed due to @typescript-eslint/no-explicit-any in server-client.ts, deprecated CookieMethodsServerDeprecated.
Fix: App/lib/supabase/server-client.ts: Simple interface that matches Next.js requirements. interface CookieOptions {}, export const createSupabaseServerClient = async () => {const cookieStore = await cookies...};
Outcome: Successful Vercel deployment, main page loads correctly.
Notes: Since createSupabaseServerClient() is now an async function (returns a Promise), add await for route.ts, middleware.ts. 

Issue:Logout problem: https://stembot-mvp.vercel.app/ redirect to dashboard directly. Logout cannot work. While http://localhost:3000/login works well, the logout in dashboard does not work. The main page http://localhost:3000 works well, including funtional logout. 
Fix: The problem is in app/login/page.ts: checkSession function. It has a setTimeout that delays the session check, but this can cause race conditions and unexpected behavior. setTimeout is removed. 
Outcome: New UI for login and the logout is successful now.

Issue: http://localhost:3000 (root page) direct to dashboard directly. Logout doesn't work. 
Problem: Middleware.ts: Using getSession() which reads from storage (cookies) without verification
Fix:  Middleware.ts: Using getUser() which verifies authenticity with Supabase Auth server
Outcome: Secure authentication flow without the security warning
