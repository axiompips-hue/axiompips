// src/middleware.ts
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const ADMIN_TOKEN = process.env.ADMIN_SECRET_KEY;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Admin route protection ---
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    // Check for token in URL query param: /admin?token=YOUR_SECRET
    const token = request.nextUrl.searchParams.get('token');

    // Also accept token stored in a cookie (set after first visit)
    const cookieToken = request.cookies.get('admin_token')?.value;

    const isValid =
      (token && token === ADMIN_TOKEN) ||
      (cookieToken && cookieToken === ADMIN_TOKEN);

    if (!isValid) {
      // Return a plain 404 - don't reveal that this route exists
      return new NextResponse(null, { status: 404 });
    }

    // Set a session cookie so you don't need the token in the URL every time
    // Cookie lasts 8 hours
    if (token === ADMIN_TOKEN) {
      const response = NextResponse.next();
      response.cookies.set('admin_token', ADMIN_TOKEN, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 8, // 8 hours
        path: '/',
      });
      return response;
    }
  }
  // ------------------------------

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
