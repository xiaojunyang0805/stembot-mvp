import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Don't process auth callback routes - let them handle authentication
  if (req.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.next();
  }

  const supabase = await createSupabaseServerClient();
  
  // Use getUser() instead of getSession() for authenticated verification
  const { data: { user }, error } = await supabase.auth.getUser();

  console.log('Middleware: Path:', req.nextUrl.pathname, 'User exists:', !!user, 'Verified:', !!user?.email_confirmed_at);

  // If user is not authenticated and trying to access protected routes
  if ((error || !user) && (req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname === '/')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is authenticated but not verified and trying to access protected routes
  if (user && !user.email_confirmed_at && (req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname === '/')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/verify';
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is authenticated and verified but trying to access auth pages
  if (user && user.email_confirmed_at && 
      (req.nextUrl.pathname.startsWith('/login') || 
       req.nextUrl.pathname.startsWith('/signup') || 
       req.nextUrl.pathname.startsWith('/verify'))) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|auth).*)',
  ],
};