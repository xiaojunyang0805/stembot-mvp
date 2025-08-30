#Issue: TypeScript error Module '"@/utils/supabase/client"' has no exported member 'User'.
Fix: Imported User from @supabase/supabase-js (or updated client.ts to export types).
Outcome: Local and Vercel builds succeeded.
Lesson: Import Supabase types directly or ensure client.ts exports them; always run npm run build locally before pushing.

#Issue: 404 NOT_FOUND on stembot-mvp.vercel.app.
Fix: Changed Framework Preset to Next.js in Vercel.
Outcome: App loads, auth flow works online.
Lessons: Always set correct Framework Preset; test default URL before custom domains; verify OAuth URLs early.