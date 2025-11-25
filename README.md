# TechJob - IT技術者求人プラットフォーム

Next.js 14とPrismaを使用した求人プラットフォームです。

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: PostgreSQL
- **ORM**: Prisma
- **認証**: NextAuth.js
- **決済**: Stripe (予定)

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成し、データベース接続情報などを設定してください。

### 3. データベースのセットアップ

```bash
npm run db:generate
npm run db:push
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてください。

## 主要機能

- ユーザー認証システム (NextAuth.js)
- 企業・技術者アカウント登録
- 求人投稿・検索・フィルタリング
- 応募管理システム
- スキル管理
- 決済API

詳細はREADME内の完全版をご確認ください。
