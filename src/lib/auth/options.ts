import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { generateCsrfToken } from "@/lib/csrf";
import { timeStep } from "@/lib/performance";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

type UserWithRole = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: "USER" | "BUSINESS_OWNER" | "ADMIN";
};

const AUTH_LOGIN_LIMIT = Number(process.env.AUTH_LOGIN_LIMIT ?? 10);
const AUTH_LOGIN_WINDOW_MS = Number(process.env.AUTH_LOGIN_WINDOW_MS ?? 60_000);

const providers = [
  CredentialsProvider({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      const email = credentials?.email?.toLowerCase();
      const password = credentials?.password;

      if (!email || !password) {
        return null;
      }

      const limited = await rateLimit(`auth-login:${email}`, AUTH_LOGIN_LIMIT, AUTH_LOGIN_WINDOW_MS);

      if (!limited.allowed) {
        throw new Error("Too many login attempts. Please wait a moment and try again.");
      }

      const user = await timeStep("auth.userLookup", () => prisma.user.findUnique({ where: { email } }));

      if (!user?.hashedPassword) {
        return null;
      }

      const hashedPassword = user.hashedPassword;
      const isValid = await timeStep("auth.passwordCompare", () => bcrypt.compare(password, hashedPassword));

      if (!isValid) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role
      };
    }
  }),
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET
        })
      ]
    : [])
];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/login"
  },
  providers,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const appUser = user as UserWithRole;
        token.role = appUser.role ?? "USER";
        token.id = appUser.id;
        token.csrfToken = generateCsrfToken();
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? token.sub);
        session.user.role = (token.role as UserWithRole["role"]) ?? "USER";
        session.user.csrfToken = token.csrfToken;
      }

      return session;
    }
  }
};
