import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { timingSafeEqual } from "crypto";

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Admin",
      credentials: { email: { type: "text" }, password: { type: "password" } },
      async authorize(credentials) {
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;
        if (!email || !password || !credentials) return null;
        const okEmail = safeEqual((credentials.email ?? "").trim().toLowerCase(), email.trim().toLowerCase());
        const okPass = safeEqual(credentials.password ?? "", password);
        return okEmail && okPass ? { id: "admin", name: "Admin ixy", email } : null;
      },
    }),
  ],
};
