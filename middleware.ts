import { withAuth } from 'next-auth/middleware';

export default withAuth({ pages: { signIn: '/login' } });

export const config = {
  matcher: [
    '/(dashboard)/:path*',
    '/dashboard/:path*',
    '/import/:path*',
    '/charts/:path*',
    '/explore/:path*',
    '/insights/:path*',
    '/smart-insights/:path*',
    '/compare/:path*',
    '/report/:path*',
    '/workspace/:path*',
    // NOTE: /api/auth is intentionally excluded — NextAuth needs it unprotected
  ],
};
