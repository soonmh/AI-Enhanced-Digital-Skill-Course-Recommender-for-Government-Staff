import { withAuth } from "next-auth/middleware";

// Publicly accessible pages. Everything else is protected by default —
// adding a new protected route needs NO change here (that was the old
// whitelist's failure mode; e.g. /my-team was silently unprotected).
const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password"];

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ req, token }) => {
      const { pathname } = req.nextUrl;
      // Public pages + public certificate verification (/c/<code>).
      if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/c/")) {
        return true;
      }
      // Everything else requires a session with a live backend token.
      // (The jwt callback clears accessToken when the backend rejects it,
      // so a stale/revoked session is bounced here instead of via a 401.)
      return !!token?.accessToken;
    },
  },
});

export const config = {
  matcher: [
    /*
     * Run on every request path EXCEPT:
     * - api / sanctum  (route handlers that manage their own auth)
     * - _next/static, _next/image  (build assets)
     * - files with an extension (favicon.ico, images, fonts, etc.)
     */
    "/((?!api|sanctum|_next/static|_next/image|.*\\.).*)",
  ],
};
