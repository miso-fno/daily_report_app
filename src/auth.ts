import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const signInSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

/**
 * セッション有効期限: 8時間（業務アプリケーション向け）
 * 業務時間内でのセッション継続を想定
 */
const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

/**
 * 本番環境かどうかを判定
 */
const isProduction = process.env.NODE_ENV === "production";

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
    maxAge: SESSION_MAX_AGE,
    // セッションの更新間隔（1時間ごとにセッションを更新）
    updateAge: 60 * 60, // 1 hour
  },
  // セキュアなCookie設定
  cookies: {
    sessionToken: {
      name: isProduction
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
        maxAge: SESSION_MAX_AGE,
      },
    },
    callbackUrl: {
      name: isProduction
        ? "__Secure-authjs.callback-url"
        : "authjs.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
    csrfToken: {
      name: isProduction ? "__Host-authjs.csrf-token" : "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
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
          id: Number(token.id),
          email: token.email as string,
          name: token.name as string,
          department: token.department as string,
          isManager: token.isManager as boolean,
          managerId: token.managerId ? Number(token.managerId) : null,
        },
      };
    },
  },
  // トラストホスト設定（プロキシ経由のアクセスを許可）
  trustHost: true,
});
