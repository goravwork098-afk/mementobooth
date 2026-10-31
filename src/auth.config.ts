import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user, profile }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        if (user.name) token.name = user.name;
      }
      if (profile && typeof profile.name === "string" && !token.name) {
        token.name = profile.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id as string;
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: { signIn: "/login", verifyRequest: "/login?checkEmail=1" },
  trustHost: true,
} satisfies NextAuthConfig;
