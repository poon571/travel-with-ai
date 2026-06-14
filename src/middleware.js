import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function middleware(req) {
  const token = req.cookies.get('auth_token')?.value;

  const verifiedToken = token &&
    (await verifyAuth(token).catch((err) => {
      console.log(err);
    }));

  if (req.nextUrl.pathname.startsWith('/chat')) {
    if (!verifiedToken) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Also prevent accessing login/register if already logged in
  if (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register') {
    if (verifiedToken) {
      return NextResponse.redirect(new URL('/chat', req.url));
    }
  }
}

export const config = {
  matcher: ['/chat/:path*', '/login', '/register'],
};
