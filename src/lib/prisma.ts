import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prismaクライアントのシングルトンインスタンス
 *
 * パフォーマンス最適化:
 * - コネクションプーリングを有効活用
 * - 開発環境でのみクエリログを出力
 * - グローバルインスタンスで接続を再利用
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [
            { level: "query", emit: "event" },
            { level: "error", emit: "stdout" },
            { level: "warn", emit: "stdout" },
          ]
        : [{ level: "error", emit: "stdout" }],
  });

// 開発環境でのクエリパフォーマンス監視
if (process.env.NODE_ENV === "development") {
  // @ts-expect-error - Prismaのイベント型定義の問題
  prisma.$on("query", (e: { query: string; duration: number }) => {
    // 100ms以上のクエリを警告
    if (e.duration > 100) {
      console.warn(`[Prisma Slow Query] ${e.duration}ms:`, e.query);
    }
  });
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Prismaクライアントを正常に終了
 * テスト終了時やサーバーシャットダウン時に使用
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
