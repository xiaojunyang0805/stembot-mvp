##WP1_Task4 debugging
#Issue: TypeScript error Module '"@/utils/supabase/client"' has no exported member 'User'.
Fix: Imported User from @supabase/supabase-js (or updated client.ts to export types).
Outcome: Local and Vercel builds succeeded.
Lesson: Import Supabase types directly or ensure client.ts exports them; always run npm run build locally before pushing.

#Issue: 404 NOT_FOUND on stembot-mvp.vercel.app.
Fix: Changed Framework Preset to Next.js in Vercel.
Outcome: App loads, auth flow works online.
Lessons: Always set correct Framework Preset; test default URL before custom domains; verify OAuth URLs early.

#Issues : Dashboard Logout 404 caused by missing app/login/page.tsx (not created in WP1).
Fix: Created login page with Supabase Google auth; logout now redirects correctly.
Noted need to verify Supabase OAuth setup in dashboard.

##WP2_Task1 debugging
Step 3: Style with Tailwind CSS - Mobile Testing
- Issue: "Menu" toggle button overlaid "Your Bots" heading in mobile view (iPhone SE).
- Fix: Added pt-20 to <main> for mobile, with md:pt-6 for desktop to prevent overlap.
- Confirmed "Menu" button visible, toggles sidebar, and "Your Bots" is clear.
- Bot list spacing (gap-6) looks good on mobile.

Mobile Testing (August 31, 2025)
- **Issue**: "Menu" button disappeared in mobile view (≤425px); clicking "Menu" hid button but sidebar didn’t show.
- **Fix**: Moved toggle button outside `<aside>`, used single button with `sm:hidden` for visibility below 640px, conditional positioning (`top-6 left-6` when closed, `bottom-4 left-4` when open). Updated sidebar to `block` when `isSidebarOpen` to ensure visibility in mobile view.
- **Desktop Polish**: Enhanced sidebar (`bg-gray-50`, `p-6`), bot cards (`p-6`, `border-2 border-gray-300`, `hover:scale-105`, `text-xl`), main panel (`md:pt-8`, `text-3xl` for heading). Bot list uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.
- **Confirmed**: Mobile (375px): "Menu" at top, "Close" at bottom, single-column bot list, no overlay. Desktop (≥768px): Sidebar visible, no toggle, two columns at 768px, three at 1024px+. Navigation ("Dashboard", "Create Bot", "Logout") works as expected.
