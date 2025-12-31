import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "ログイン | 営業日報システム",
  description: "営業日報システムにログインしてください",
};

function LoginFormWrapper() {
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">営業日報システム</CardTitle>
          <CardDescription>
            アカウント情報を入力してログインしてください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center">読み込み中...</div>}>
            <LoginFormWrapper />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
