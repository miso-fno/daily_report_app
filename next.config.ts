import type { NextConfig } from "next";

/**
 * Content Security Policy (CSP) ヘッダー
 * XSS攻撃を軽減するためのセキュリティポリシー
 */
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

/**
 * セキュリティヘッダー設定
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspHeader.replace(/\s{2,}/g, " ").trim(),
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  // Docker用にstandaloneモードで出力
  output: "standalone",

  // X-Powered-By ヘッダーを無効化（セキュリティ対策）
  poweredByHeader: false,

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

  // セキュリティヘッダー設定
  async headers() {
    return [
      {
        // 全てのルートにセキュリティヘッダーを適用
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
