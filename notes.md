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

#Reflection on Tailwind CSS Styling - WP2, Task 1 (August 31, 2025)

- **Summary**: Completed styling for the StemBot dashboard (`app/dashboard/page.tsx`) using Tailwind CSS, achieving responsive mobile (≤425px) and desktop (≥768px) layouts. Mobile view includes a "Menu" button to toggle a hidden sidebar, single-column bot list, and proper spacing to avoid overlaps. Desktop view has a fixed sidebar, no toggle button, and a multi-column bot list (two at 768px, three at 1024px+). Bot cards and navigation were polished for consistency.

- **Achievements**:
  - Mobile (≤425px): Implemented "Menu" button (`fixed top-6 left-6`) to show sidebar, with "Close" button (`fixed bottom-4 left-4`) when open, preventing overlay on sidebar content. Used `pt-20` for main panel to clear "Your Bots" heading. Bot list stays single-column (`grid-cols-1`).
  - Desktop (≥768px): Sidebar visible (`md:block`), no toggle (`sm:hidden`), bot list in two columns at 768px (`md:grid-cols-2`), three at 1024px+ (`lg:grid-cols-3`). Enhanced styling with `bg-gray-50` sidebar, `p-6` padding, and bot cards (`border-2 border-gray-300`, `hover:scale-105`).
  - Navigation: "Dashboard", "Create Bot", and "Logout" styled consistently with hover effects (`hover:bg-blue-500`).

- **Challenges and Solutions**:
  - **Challenge**: "Menu" button disappeared in mobile view or didn’t toggle sidebar correctly.
    - **Solution**: Moved button outside `<aside>`, used `sm:hidden` for visibility below 640px, and adjusted sidebar classes (`block` when `isSidebarOpen`) to ensure toggle works. Split "Menu"/"Close" buttons initially, then simplified to one button with conditional positioning.
  - **Challenge**: "Close" button overlaid sidebar content ("StemBot", nav links) when open.
    - **Solution**: Positioned "Close" at `bottom-4 left-4` to place it below content, using `fixed` to keep it independent of sidebar scroll.
  - **Challenge**: Bot list prematurely used two columns at 640px, felt cramped on tablets.
    - **Solution**: Changed `sm:grid-cols-2` to `md:grid-cols-2` for single-column below 768px, ensuring readability.

- **Learnings**:
  - Tailwind’s responsive classes (`sm:`, `md:`, `lg:`) are powerful but require careful testing at specific breakpoints (e.g., 425px, 768px). Using `sm:hidden` simplified mobile visibility over `max-sm:block`.
  - Combining `hidden` and `translate-x-full` for sidebar caused conflicts; conditional `block` when open resolved this.
  - Positioning buttons (`fixed` vs. `absolute`) needs clear parent context to avoid hiding or overlap.
  - Grid layouts (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) are flexible for responsive designs but need adjustment for tablet readability.
  - Hover effects (`hover:scale-105`, `transition-all`) enhance UI but require `transition` properties for smoothness.

WP2 Task 1 Day 2: Debug Login Redirect and New Files
- Issue: Google OAuth login failed to redirect to /dashboard after sign-in.
- Debug: Fixed by updating middleware.ts to use createSupabaseServerClient, added lib/supabase/server-client.ts and browser-client.ts for reusable Supabase clients, and created app/auth/callback/route.ts for OAuth callback handling.
- Solution: Used async cookie methods in server-client.ts to handle Next.js 15 cookies(), updated login page to use browser-client, and ensured correct redirectTo URL.
- New Files: Added lib/supabase folder with server-client.ts and browser-client.ts, and app/auth/callback/route.ts for OAuth flow.
- Status: Tested locally and confirmed /dashboard redirect works after login.
- Next: Verify on Vercel and proceed to reflection.