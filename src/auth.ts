import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Email from "next-auth/providers/nodemailer";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { consumeEmailOtp } from "@/lib/otp";

import { authConfig } from "./auth.config";

function CustomPrismaAdapter(p: typeof prisma) {
  const adapter = PrismaAdapter(p);
  const originalDeleteSession = adapter.deleteSession;
  if (originalDeleteSession) {
    adapter.deleteSession = async (sessionToken) => {
      try {
        const result = await originalDeleteSession(sessionToken);
        return result ?? null;
      } catch (error: any) {
        if (error?.code === "P2025") {
          return null;
        }
        throw error;
      }
    };
  }
  return adapter;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: CustomPrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Email({
      server: process.env.AUTH_EMAIL_SERVER ?? "smtp://localhost:1025",
      from: process.env.AUTH_EMAIL_FROM ?? "Memento Booth <no-reply@localhost>",
    }),
    Credentials({
      name: "Email OTP",
      credentials: { email: { label: "Email", type: "email" }, code: { label: "Code", type: "text" } },
      async authorize(credentials) {
        if (typeof credentials?.email !== "string" || typeof credentials?.code !== "string") return null;
        const user = await consumeEmailOtp(credentials.email, credentials.code);
        return user ? { id: user.id, email: user.email, name: user.name } : null;
      },
    }),
  ],
});
