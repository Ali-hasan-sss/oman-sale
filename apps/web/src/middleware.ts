import { NextResponse, type NextRequest } from 'next/server';

const locales = ['ar', 'en'];
const defaultLocale = 'ar';

/**
 * Behind Nginx → Node on 127.0.0.1, Next may see `request.nextUrl` as localhost.
 * Use proxy headers so locale redirects keep the public host and port.
 */
function getPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')?.trim();
  const hostHeader = request.headers.get('host')?.trim();
  const host = forwardedHost || hostHeader;
  if (!host) return request.nextUrl.origin;

  const rawProto = request.headers.get('x-forwarded-proto')?.trim().toLowerCase();
  const protocol = rawProto === 'https' || rawProto === 'http' ? rawProto : 'http';
  return `${protocol}://${host}`;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`))
  ) {
    return NextResponse.next();
  }

  const targetPath = `/${defaultLocale}${pathname === '/' ? '' : pathname}`;
  const redirectUrl = new URL(targetPath, getPublicOrigin(request));
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)']
};
