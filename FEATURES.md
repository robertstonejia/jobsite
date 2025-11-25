# 新機能実装ドキュメント

このドキュメントでは、求人サイトに追加された新機能について説明します。

## 実装された機能一覧

### ①企業と応募者間のメッセージング機能

**概要**: 企業と応募者が応募を通じてメッセージのやり取りができる機能

**実装ファイル**:
- API: `src/app/api/messages/route.ts`
- データベーススキーマ: `prisma/schema.prisma` (Message model)

**主な機能**:
- 応募に紐づいたメッセージの送受信
- 既読/未読管理
- 企業側と応募者側の両方からメッセージ送信可能
- 権限チェック(関係者のみがメッセージを閲覧・送信可能)

**API エンドポイント**:
- `POST /api/messages` - メッセージを送信
- `GET /api/messages?applicationId={id}` - 特定の応募に関するメッセージ一覧を取得

---

### ②応募時の企業へのメール通知機能

**概要**: 応募者が求人に応募した際、企業側にメール通知を送信する機能(企業側で有効/無効を設定可能)

**実装ファイル**:
- メールユーティリティ: `src/lib/email.ts`
- API更新: `src/app/api/applications/route.ts`
- 企業プロフィールAPI: `src/app/api/company/profile/route.ts`

**主な機能**:
- 応募時の自動メール通知
- 企業プロフィールでメール通知のON/OFF設定
- メールテンプレート機能
- 開発環境ではコンソールログ、本番環境では実際のメール送信(要設定)

**データベースフィールド**:
- `Company.emailNotificationEnabled` (Boolean, デフォルト: true)

**メール送信プロバイダー対応**:
- SendGrid
- AWS SES
- Nodemailer
(※本番環境では環境変数の設定が必要)

---

### ③高度人材加点制度対応機能

**概要**: 高度人材ポイント制度に対応している企業を検索・表示する機能

**実装ファイル**:
- API: `src/app/api/companies/advanced-talent/route.ts`
- ページ: `src/app/companies/advanced-talent/page.tsx`
- メイン画面更新: `src/app/page.tsx`

**主な機能**:
- 企業登録時に「高度人材加点対応企業」として登録可能
- 高度人材加点対応企業の一覧検索
- メイン画面に専用セクションを表示
- 企業名、業界で絞り込み検索

**データベースフィールド**:
- `Company.supportsAdvancedTalentPoints` (Boolean, デフォルト: false)

**APIエンドポイント**:
- `GET /api/companies/advanced-talent` - 高度人材加点対応企業一覧を取得

---

### ④他業界対応とUI文言変更

**概要**: IT業界以外の企業も登録できるよう拡張し、UI文言を汎用的に変更

**実装内容**:
- メイン画面のタイトルを「IT技術者と企業をつなぐ」→「応募者と企業をつなぐ」に変更
- 「技術者として登録」→「応募者として登録」に変更
- その他関連する文言を「技術者」→「応募者」に統一

**データベースフィールド**:
- `Company.isITCompany` (Boolean, デフォルト: true) - IT企業かどうかを識別

**更新ファイル**:
- `src/app/page.tsx`

---

### ⑤企業ユーザーの月額会員費支払い機能

**概要**: 企業ユーザーが翌月から毎月10,000円の会員費を支払う機能

**実装ファイル**:
- API: `src/app/api/payments/route.ts` (更新)
- 支払いページ: `src/app/dashboard/company/subscription/page.tsx`

**主な機能**:
- 月額会員費: 10,000円(固定)
- 対応支払い方法:
  - WeChat Pay (微信支付)
  - Alipay (支付宝)
  - PayPay
- サブスクリプション有効期限管理

**APIエンドポイント**:
- `POST /api/payments` - 支払いを作成
- `GET /api/payments` - 支払い履歴を取得

**注意事項**:
- 現在は支払いプロバイダーのプレースホルダー実装
- 本番環境では各支払いプロバイダーのSDKとAPI統合が必要

---

### ⑥マッチング自動スカウトメール機能

**概要**: 求人と応募者の履歴をマッチングして、自動的にスカウトメールを送信する機能

**実装ファイル**:
- スカウトAPI: `src/app/api/scout/route.ts`
- 自動マッチングAPI: `src/app/api/scout/auto-match/route.ts`
- メールテンプレート: `src/lib/email.ts`

**主な機能**:
- スキル、経験年数、給与、ロケーションに基づくマッチングスコア計算
- マッチング度60%以上の応募者に自動スカウト
- スカウト済みの応募者は除外(重複送信防止)
- スカウトメールの既読/返信管理

**マッチングスコア計算**:
- スキルマッチング: 最大50点
- 経験年数: 最大20点
- 給与マッチング: 最大15点
- ロケーション: 最大15点
- 合計100点満点

**APIエンドポイント**:
- `POST /api/scout` - 手動でスカウトメールを送信
- `GET /api/scout` - スカウトメール一覧を取得
- `POST /api/scout/auto-match` - 自動マッチングを実行してスカウトメールを送信

**データベースモデル**:
- `ScoutEmail` - スカウトメール情報を保存

---

### ⑦IT案件情報発表機能

**概要**: IT企業が案件情報を投稿できる機能(1日5件まで、重複投稿不可)

**実装ファイル**:
- API: `src/app/api/projects/route.ts`
- 個別案件API: `src/app/api/projects/[id]/route.ts`
- 一覧ページ: `src/app/projects/page.tsx`

**主な機能**:
- IT企業のみが案件を投稿可能
- 1日5件までの投稿制限
- 同じタイトルの案件は重複投稿不可
- 案件の検索、絞り込み
- 案件の編集、削除(ソフトデリート)

**投稿制限**:
- IT企業のみ(`Company.isITCompany = true`)
- 1日5件まで
- 重複タイトル不可

**APIエンドポイント**:
- `POST /api/projects` - 案件を投稿
- `GET /api/projects` - 案件一覧を取得
- `GET /api/projects/[id]` - 特定の案件を取得
- `PUT /api/projects/[id]` - 案件を更新
- `DELETE /api/projects/[id]` - 案件を削除

**データベースモデル**:
- `ProjectPost` - IT案件情報を保存

---

## データベースマイグレーション

新機能を使用する前に、以下のコマンドでデータベースをマイグレーションしてください:

\`\`\`bash
# Prismaクライアントを生成
npx prisma generate

# データベースにスキーマを適用
npx prisma db push

# または、マイグレーションファイルを作成
npx prisma migrate dev --name add_new_features
\`\`\`

## 環境変数の設定

`.env`ファイルに以下の環境変数を追加してください:

\`\`\`env
# メール送信設定(本番環境)
EMAIL_FROM=noreply@yourdomain.com
SENDGRID_API_KEY=your-sendgrid-api-key

# または他のメールプロバイダー
# AWS_SES_ACCESS_KEY=your-aws-access-key
# AWS_SES_SECRET_KEY=your-aws-secret-key

# 支払いプロバイダー設定
WECHAT_PAY_API_KEY=your-wechat-pay-key
ALIPAY_API_KEY=your-alipay-key
PAYPAY_API_KEY=your-paypay-key
\`\`\`

## 本番環境への展開前のチェックリスト

- [ ] メール送信プロバイダーの統合と設定
- [ ] 支払いプロバイダー(WeChat, Alipay, PayPay, Stripe)の統合
- [ ] データベースマイグレーションの実行
- [ ] 環境変数の設定
- [ ] メール通知のテスト
- [ ] スカウトメール自動送信のテスト
- [ ] 支払いフローのテスト
- [ ] IT案件投稿制限のテスト

## 主な改善点・拡張提案

1. **メール送信**: 実際のメール送信プロバイダーSDKの統合
2. **支払い処理**: WeChat Pay、Alipay、PayPayの実際のAPI統合
3. **通知機能**: WebSocket/リアルタイム通知の実装
4. **マッチングアルゴリズム**: より高度なAIベースのマッチング
5. **分析ダッシュボード**: 企業向けの応募/スカウト分析機能
6. **モバイルアプリ**: ネイティブアプリの開発

## サポート

質問や問題がある場合は、開発チームまでお問い合わせください。
