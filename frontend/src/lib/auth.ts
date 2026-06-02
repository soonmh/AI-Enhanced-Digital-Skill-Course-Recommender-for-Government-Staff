import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const jar = new CookieJar();
        const api = wrapper(axios.create({
          baseURL: backendUrl,
          jar,
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Origin: "http://localhost:3000",
            Referer: "http://localhost:3000",
          },
        }));

        // 1. Get CSRF cookie
        await api.get("/sanctum/csrf-cookie");

        // 2. Extract XSRF-TOKEN
        const xsrfCookie = await jar.getCookies(backendUrl);
        const xsrf = xsrfCookie.find(c => c.key === "XSRF-TOKEN");
        if (xsrf) {
          api.defaults.headers.common["X-XSRF-TOKEN"] = decodeURIComponent(xsrf.value);
        }

        // 3. Login — returns user + API token
        const loginRes = await api.post("/api/login", {
          email: credentials.email,
          password: credentials.password,
        });

        const { token } = loginRes.data;
        const user = loginRes.data.user;

        if (user) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            locale: user.locale,
            roles: user.roles,
            permissions: user.permissions,
            working_field: user.working_field,
            job_level: user.job_level,
            experience_years: user.experience_years,
            has_direct_reports: user.has_direct_reports,
            accessToken: token,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.roles = user.roles;
        token.permissions = user.permissions;
        token.locale = user.locale;
        token.working_field = user.working_field;
        token.job_level = user.job_level;
        token.experience_years = user.experience_years;
        token.has_direct_reports = user.has_direct_reports;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.roles = token.roles as string[];
        session.user.permissions = token.permissions as string[];
        session.user.locale = token.locale as string;
        session.user.working_field = token.working_field as string;
        session.user.job_level = token.job_level as string;
        session.user.experience_years = token.experience_years as string;
        session.user.has_direct_reports = token.has_direct_reports as boolean;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

declare module "next-auth" {
  interface User {
    roles?: string[];
    permissions?: string[];
    locale?: string;
    working_field?: string;
    job_level?: string;
    experience_years?: string;
    has_direct_reports?: boolean;
    accessToken?: string;
  }
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      roles?: string[];
      permissions?: string[];
      locale?: string;
      working_field?: string;
      job_level?: string;
      experience_years?: string;
      has_direct_reports?: boolean;
    };
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: string[];
    permissions?: string[];
    locale?: string;
    working_field?: string;
    job_level?: string;
    experience_years?: string;
    has_direct_reports?: boolean;
    accessToken?: string;
  }
}
