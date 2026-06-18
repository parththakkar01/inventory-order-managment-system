import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  providers: [],
  pages: {
    signIn: "/login"
  },
  callbacks: {
    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = Boolean(session?.user);
      const isPublicRoute = pathname.startsWith("/login") || pathname.startsWith("/api/auth");

      if (isPublicRoute) {
        return true;
      }

      return isLoggedIn;
    }
  }
} satisfies NextAuthConfig;
