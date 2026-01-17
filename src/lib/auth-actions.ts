"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";

export async function login(
  email: string,
  password: string,
  callbackUrl?: string
) {
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "メールアドレスまたはパスワードが正しくありません" };
        default:
          return { error: "認証エラーが発生しました" };
      }
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
