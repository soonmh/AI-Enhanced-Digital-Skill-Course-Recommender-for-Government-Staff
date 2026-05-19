import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/assessment/:path*",
    "/courses/:path*",
    "/admin/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/staff-analysis/:path*",
    "/course-report/:path*",
    "/ai-insights/:path*",
  ],
};
