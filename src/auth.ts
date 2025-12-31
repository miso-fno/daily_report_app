import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const signInSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const { email, password } =
            await signInSchema.parseAsync(credentials);

          const user = await prisma.salesPerson.findUnique({
            where: { email },
          });

          if (!user) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(password, user.password);

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            department: user.department,
            isManager: user.isManager,
            managerId: user.managerId,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as number;
        token.email = user.email as string;
        token.name = user.name as string;
        token.department = user.department as string;
        token.isManager = user.isManager as boolean;
        token.managerId = user.managerId as number | null;
      }
      return token;
    },
    session({ session, token }) {
      return {
        ...session,
        user: {
          id: token.id as number,
          email: token.email as string,
          name: token.name as string,
          department: token.department as string,
          isManager: token.isManager as boolean,
          managerId: token.managerId as number | null,
        },
      };
    },
  },
});
