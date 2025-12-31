"use client";

import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="mb-8 text-3xl font-bold">営業日報システム</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>コンポーネントサンプル</CardTitle>
            <CardDescription>
              shadcn/ui コンポーネントの動作確認
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@example.com"
              />
            </div>

            <div className="flex gap-2">
              <Button>プライマリ</Button>
              <Button variant="secondary">セカンダリ</Button>
              <Button variant="outline">アウトライン</Button>
              <Button variant="destructive">削除</Button>
            </div>

            <div className="flex gap-2">
              <Badge>デフォルト</Badge>
              <Badge variant="secondary">セカンダリ</Badge>
              <Badge variant="outline">アウトライン</Badge>
              <Badge variant="destructive">削除</Badge>
            </div>

            <Button
              onClick={() => {
                toast.success("成功しました", {
                  description: "操作が正常に完了しました。",
                });
              }}
            >
              Toast を表示
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>システム概要</CardTitle>
            <CardDescription>営業担当者の日報管理システム</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-2 text-muted-foreground">
              <li>日報の作成・編集・削除</li>
              <li>顧客訪問記録の管理</li>
              <li>上長によるコメント・確認</li>
              <li>顧客・営業担当者マスタ管理</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
