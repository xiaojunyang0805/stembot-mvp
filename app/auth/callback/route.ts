import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createSupabaseServerClient(); // Add await here
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
    console.log('Callback: Session exists:', !!session, 'Verified:', !!session?.user.email_confirmed_at);
    if (!error && session) {
      if (session.user.email_confirmed_at) {
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        return NextResponse.redirect(`${origin}/verify`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}