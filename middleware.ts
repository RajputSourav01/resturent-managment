import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isCustomerMenu = path.startsWith('/customerMenu');

  const hasCookie = request.cookies.get('tableUser');

  if (isCustomerMenu && !hasCookie) {
    return NextResponse.redirect(new URL('/tableLogin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/customerMenu/:path*'],
};
