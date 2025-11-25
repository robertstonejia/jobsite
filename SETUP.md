# セットアップガイド

TechJob求人サイトのセットアップ手順です。

## 前提条件

- Node.js 18以上
- PostgreSQL 14以上
- npm または yarn

## セットアップ手順

### 1. 依存関係のインストール (完了済み ✅)

```bash
npm install
```

### 2. PostgreSQLデータベースの作成

PostgreSQLにログインして新しいデータベースを作成してください:

```sql
CREATE DATABASE techjob;
```

または、コマンドラインから:

```bash
createdb techjob
```

### 3. 環境変数の設定

`.env`ファイルが作成済みです。以下の値を編集してください:

```env
# データベース接続URL
# 形式: postgresql://ユーザー名:パスワード@ホスト:ポート/データベース名
DATABASE_URL="postgresql://postgres:password@localhost:5432/techjob?schema=public"

# NextAuth設定
NEXTAUTH_URL="http://localhost:3000"

# NextAuthシークレット（ランダムな文字列を生成してください）
# 生成方法: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"

# Stripe（決済機能を使う場合）
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-public-key"
STRIPE_SECRET_KEY="your-stripe-secret-key"
```

### 4. データベーススキーマのプッシュ

Prismaを使用してデータベーススキーマを作成します:

```bash
npm run db:push
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてください。

## 利用可能なページ

### 一般ユーザー向け
- `/` - トップページ
- `/login` - ログイン
- `/company/register` - 企業登録
- `/engineer/register` - 技術者登録
- `/jobs` - 求人検索
- `/jobs/[id]` - 求人詳細

### 企業向け (ログイン後)
- `/dashboard/company` - 企業ダッシュボード
  - 求人管理
  - 応募者管理

### 技術者向け (ログイン後)
- `/dashboard/engineer` - 技術者ダッシュボード
  - 応募履歴
  - プロフィール編集

## トラブルシューティング

### データベース接続エラー

エラー: `Error: P1001: Can't reach database server`

解決方法:
1. PostgreSQLが起動しているか確認
2. `.env`のDATABASE_URLが正しいか確認
3. ユーザー名・パスワードが正しいか確認

### Prismaクライアント生成エラー

解決方法:
```bash
npm run db:generate
```

### ポート3000が使用中

解決方法:
```bash
# 別のポートで起動
PORT=3001 npm run dev
```

## 次のステップ

1. **テストアカウントの作成**
   - 企業アカウントを登録
   - 技術者アカウントを登録

2. **求人の投稿**
   - 企業ダッシュボードから求人を作成

3. **応募のテスト**
   - 技術者アカウントで求人に応募

4. **本番環境へのデプロイ**
   - Vercel/AWS/その他のプラットフォームを使用

## 開発用ツール

### Prisma Studio (データベースGUI)

データベースの内容を確認・編集できます:

```bash
npm run db:studio
```

ブラウザで `http://localhost:5555` が開きます。

## サポート

問題が発生した場合は、GitHubのIssuesで報告してください。
