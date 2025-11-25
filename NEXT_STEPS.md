# セットアップと次のステップ

すべての新機能の実装が完了しました!以下の手順に従ってシステムをセットアップし、起動してください。

## 📋 完了した実装内容

✅ データベーススキーマの更新(Prismaマイグレーション完了)
✅ ①企業と応募者間のメッセージング機能
✅ ②応募時のメール通知機能(企業側で設定可能)
✅ ③高度人材加点制度対応機能
✅ ④他業界対応とUI文言変更
✅ ⑤月額会員費支払い機能(WeChat/Alipay/PayPay対応)
✅ ⑥自動マッチングスカウトメール機能
✅ ⑦IT案件情報投稿機能(1日5件制限)

## 🚀 セットアップ手順

### 1. 環境変数の設定

`.env`ファイルを作成し、以下の内容を設定してください:

\`\`\`bash
cp .env.example .env
\`\`\`

`.env`ファイルを編集して、実際の値を設定します:

\`\`\`env
# データベース接続
DATABASE_URL="postgresql://username:password@localhost:5432/techjob?schema=public"

# NextAuth設定
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"  # 長いランダムな文字列に変更してください

# メール送信設定(本番環境で必要)
EMAIL_FROM="noreply@yourdomain.com"
SENDGRID_API_KEY="your-sendgrid-api-key"

# 支払いプロバイダー設定(本番環境で必要)
WECHAT_PAY_API_KEY="your-wechat-pay-key"
ALIPAY_API_KEY="your-alipay-key"
PAYPAY_API_KEY="your-paypay-key"
\`\`\`

### 2. データベースのセットアップ

PostgreSQLデータベースが既にセットアップされている場合:

\`\`\`bash
# Prismaクライアントを生成(既に完了)
npm run db:generate

# マイグレーションは既に完了しています
# もし再度実行する必要がある場合:
npm run db:push
\`\`\`

### 3. 開発サーバーの起動

\`\`\`bash
npm run dev
\`\`\`

ブラウザで http://localhost:3000 にアクセスしてください。

## 🎯 新機能の使い方

### 企業ユーザー向け

1. **企業登録**
   - トップページから「企業として登録」をクリック
   - 企業情報を入力
   - 「企業設定」セクションで以下を選択:
     - IT企業として登録(IT案件投稿可能)
     - 高度人材加点制度対応
     - メール通知の有効/無効

2. **月額会員登録**
   - 企業ダッシュボード → 「月額会員登録」ボタン
   - 支払い方法を選択(WeChat Pay/Alipay/PayPay)
   - 月額10,000円で登録

3. **IT案件投稿** (IT企業のみ)
   - ナビゲーション → 「IT案件」
   - 1日5件まで投稿可能
   - 重複タイトルは投稿不可

4. **スカウトメール送信**
   - 求人詳細ページから自動マッチング実行
   - マッチング度60%以上の応募者に自動送信
   - `/api/scout/auto-match`エンドポイントを使用

5. **メッセージング**
   - 応募者との個別メッセージ
   - 応募詳細ページから送信可能

### 応募者向け

1. **応募者として登録**
   - トップページから「応募者として登録」をクリック
   - スキルと経験を登録

2. **高度人材加点対応企業の検索**
   - ナビゲーション → 「高度人材企業」
   - または トップページの専用セクションから

3. **IT案件の閲覧**
   - ナビゲーション → 「IT案件」
   - 最新のIT案件情報を検索

4. **スカウトメール受信**
   - マッチング度の高い求人からスカウトが届く
   - メールで通知を受け取る

## 🔧 開発環境で確認できること

### 開発環境の制限事項

以下の機能は開発環境ではプレースホルダー実装です:

- **メール送信**: コンソールログに出力されます
- **支払い処理**: 仮のトランザクションIDが生成されます

本番環境では以下の統合が必要です:
- SendGrid/AWS SESなどのメール送信プロバイダー
- WeChat Pay/Alipay/PayPayの実際のAPI統合

## 📊 主要なエンドポイント

### メッセージング
- `POST /api/messages` - メッセージ送信
- `GET /api/messages?applicationId={id}` - メッセージ取得

### スカウト
- `POST /api/scout` - 手動スカウト送信
- `POST /api/scout/auto-match` - 自動マッチング実行
- `GET /api/scout` - スカウト一覧

### IT案件
- `POST /api/projects` - 案件投稿
- `GET /api/projects` - 案件一覧
- `PUT /api/projects/[id]` - 案件更新
- `DELETE /api/projects/[id]` - 案件削除

### 高度人材企業
- `GET /api/companies/advanced-talent` - 高度人材対応企業一覧

### 支払い
- `POST /api/payments` - 支払い作成
- `GET /api/payments` - 支払い履歴

## 🎨 主要なUIページ

- `/` - トップページ(更新済み)
- `/companies/advanced-talent` - 高度人材加点対応企業一覧
- `/projects` - IT案件情報一覧
- `/dashboard/company/subscription` - 月額会員登録ページ
- `/dashboard/company` - 企業ダッシュボード(更新済み)

## 🔒 セキュリティ注意事項

1. **NEXTAUTH_SECRET**: 本番環境では必ず強固なランダム文字列に変更
2. **API キー**: .envファイルは絶対にGitにコミットしない
3. **データベース**: 本番環境では適切なアクセス制御を設定

## 📝 今後の改善提案

1. **メール送信**: SendGrid/AWS SES統合
2. **支払い処理**: 各支払いプロバイダーの実際のSDK統合
3. **リアルタイム通知**: WebSocket実装
4. **画像アップロード**: 企業ロゴ、プロフィール画像
5. **検索機能強化**: Elasticsearch導入
6. **分析機能**: 企業向けダッシュボード拡張
7. **モバイルアプリ**: React Native実装

## 📚 ドキュメント

詳細な機能説明は `FEATURES.md` をご覧ください。

## 🐛 トラブルシューティング

### データベース接続エラー
\`\`\`bash
# PostgreSQLが起動しているか確認
# DATABASE_URLが正しいか確認
\`\`\`

### Prismaエラー
\`\`\`bash
# Prismaクライアントを再生成
npx prisma generate
npx prisma db push
\`\`\`

### ビルドエラー
\`\`\`bash
# node_modulesを削除して再インストール
rm -rf node_modules
npm install
\`\`\`

## 🎉 完成!

すべてのセットアップが完了したら、以下を試してみてください:

1. 企業アカウントを登録
2. 求人を作成
3. 応募者アカウントを登録
4. 求人に応募
5. メッセージングを試す
6. スカウト機能を試す
7. IT案件を投稿
8. 高度人材企業を検索

何か問題があれば、開発チームまでお問い合わせください。
