import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker用にstandaloneモードで出力
  output: "standalone",

  // 実験的機能
  experimental: {
    // サーバーアクションを有効化
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // 画像最適化設定
  images: {
    remotePatterns: [],
  },

  // 環境変数（クライアントに公開）
  env: {
    NEXT_PUBLIC_APP_NAME: "営業日報システム",
  },
};

export default nextConfig;
