import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (pathname === '/register' || pathname === '/login' || pathname === '/reset-password' || pathname.startsWith('/api')) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to login if not authenticated and trying to access protected routes
  if (!user && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to dashboard if authenticated and trying to access login
  if (user && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};