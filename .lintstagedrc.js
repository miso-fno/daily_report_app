module.exports = {
  // TypeScript/JavaScript ファイル
  "**/*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],

  // スタイルファイル
  "**/*.{css,scss}": ["prettier --write"],

  // JSON/Markdown ファイル
  "**/*.{json,md}": ["prettier --write"],

  // Prisma スキーマ
  "prisma/schema.prisma": ["npx prisma format"],
};
