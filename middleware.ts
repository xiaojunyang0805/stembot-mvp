import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Don't process auth callback routes - let them handle authentication
  if (req.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.next();
  }

  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  console.log('Middleware: Path:', req.nextUrl.pathname, 'Session exists:', !!session, 'Verified:', !!session?.user.email_confirmed_at);

  // If user is not authenticated and trying to access protected routes
  if (!session && (req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname === '/')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is authenticated but not verified and trying to access protected routes
  if (session && !session.user.email_confirmed_at && (req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname === '/')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/verify';
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is authenticated and verified but trying to access auth pages
  if (session && session.user.email_confirmed_at && 
      (req.nextUrl.pathname.startsWith('/login') || 
       req.nextUrl.pathname.startsWith('/signup') || 
       req.nextUrl.pathname.startsWith('/verify'))) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  // Allow root path to proceed without redirects (will show login page)
  if (req.nextUrl.pathname === '/') {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * - auth (auth callback routes - important for logout to work)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|auth).*)',
  ],
};