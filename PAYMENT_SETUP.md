# 支払い統合セットアップガイド

このガイドでは、実際の決済プロバイダーと統合して、お客様のアカウントに送金を受け取る方法を説明します。

## 現在の実装状態

現在、支払いフローは**シミュレーション**として実装されています：
- 支払いページは5秒後に自動的に「完了」とマークされます
- 実際の決済処理は行われません
- サブスクリプションは自動的に有効化されます

## 決済プロバイダーの選択

日本で利用可能な主要な決済プロバイダー：

### 1. PayPay for Developers
**最適な選択肢（日本市場向け）**

#### メリット：
- 日本で最も人気のあるモバイル決済
- QRコード決済対応
- 月額課金（サブスクリプション）対応
- API統合が比較的簡単

#### セットアップ手順：

1. **PayPay加盟店登録**
   - https://developer.paypay.ne.jp/ にアクセス
   - 「加盟店登録」をクリック
   - 必要書類：
     - 法人登記簿謄本
     - 代表者の本人確認書類
     - 銀行口座情報

2. **API認証情報の取得**
   - 加盟店管理画面にログイン
   - API Key、API Secretを取得
   - Merchant IDを取得

3. **環境変数の設定**
   ```env
   PAYPAY_API_KEY=your_api_key_here
   PAYPAY_API_SECRET=your_api_secret_here
   PAYPAY_MERCHANT_ID=your_merchant_id_here
   PAYPAY_ENVIRONMENT=production  # または sandbox
   ```

4. **入金先口座の設定**
   - 加盟店管理画面で入金先口座を設定
   - 自動入金スケジュールを設定（通常：月2回）

---

### 2. Stripe（国際対応・推奨）
**最も統合しやすい選択肢**

#### メリット：
- 世界中で利用可能
- 優れたドキュメント
- サブスクリプション機能が充実
- クレジットカード、デビットカード対応
- 日本円対応

#### セットアップ手順：

1. **Stripeアカウント作成**
   - https://stripe.com/jp にアクセス
   - 「今すぐ始める」をクリック
   - メールアドレスとパスワードで登録

2. **ビジネス情報の登録**
   - 会社情報
   - 銀行口座情報（入金先）
   - 本人確認書類のアップロード

3. **API認証情報の取得**
   - Dashboard → 開発者 → APIキー
   - 公開可能キー（Publishable key）
   - シークレットキー（Secret key）

4. **環境変数の設定**
   ```env
   STRIPE_SECRET_KEY=sk_live_xxxxx
   STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

5. **サブスクリプション商品の作成**
   ```bash
   # Stripe CLIまたはDashboardで作成
   商品名: ベーシックプラン
   価格: ¥10,000/月
   通貨: JPY
   請求サイクル: 月次
   ```

---

### 3. WeChat Pay（中国市場向け）

#### セットアップ手順：

1. **WeChat Pay加盟店登録**
   - https://pay.weixin.qq.com/ にアクセス
   - 企業認証が必要
   - 必要書類：営業許可証、銀行口座情報

2. **API認証情報**
   ```env
   WECHAT_APP_ID=your_app_id
   WECHAT_MCH_ID=your_merchant_id
   WECHAT_API_KEY=your_api_key
   ```

---

### 4. Alipay（中国市場向け）

#### セットアップ手順：

1. **Alipay加盟店登録**
   - https://global.alipay.com/ にアクセス
   - 企業アカウント作成

2. **API認証情報**
   ```env
   ALIPAY_APP_ID=your_app_id
   ALIPAY_PRIVATE_KEY=your_private_key
   ALIPAY_PUBLIC_KEY=alipay_public_key
   ```

---

## コード統合手順（推奨：Stripe）

### ステップ1: Stripeパッケージのインストール

```bash
npm install stripe @stripe/stripe-js
```

### ステップ2: `.env.local` ファイルの作成

プロジェクトルートに `.env.local` ファイルを作成：

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_xxxxx  # テスト環境
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx  # テスト環境
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# 本番環境に移行する際は以下に置き換え
# STRIPE_SECRET_KEY=sk_live_xxxxx
# STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

### ステップ3: Stripe初期化ファイルの作成

`src/lib/stripe.ts` を作成：

```typescript
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})
```

### ステップ4: 支払いAPIの更新

`src/app/api/payments/route.ts` を以下のように更新：

```typescript
import { stripe } from '@/lib/stripe'

// 既存のコードの代わりに、実際のStripe統合を使用

export async function POST(req: Request) {
  // ... 既存の認証コード ...

  try {
    // Stripeで支払いセッションを作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: 'ベーシックプラン',
              description: '月額会員プラン',
            },
            unit_amount: 10000, // 100円 = 1, 10000円 = 1000000
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/company?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/company/subscription?canceled=true`,
      client_reference_id: user.company.id,
      metadata: {
        companyId: user.company.id,
        plan: 'BASIC',
      },
    })

    // 支払いレコードを作成
    const payment = await prisma.payment.create({
      data: {
        companyId: user.company.id,
        amount: MONTHLY_FEE,
        paymentMethod: 'stripe',
        plan: 'BASIC',
        status: 'pending',
        transactionId: session.id,
      },
    })

    return NextResponse.json({
      message: 'Payment session created',
      payment,
      paymentUrl: session.url, // Stripeのチェックアウトページにリダイレクト
    })
  } catch (error) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 })
  }
}
```

### ステップ5: Webhookの設定

Stripeから支払い完了通知を受け取るためのWebhookを作成：

`src/app/api/webhooks/stripe/route.ts`:

```typescript
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // 支払い完了時の処理
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const companyId = session.metadata?.companyId

    if (companyId) {
      // サブスクリプションを有効化
      const expiryDate = new Date()
      expiryDate.setMonth(expiryDate.getMonth() + 1)

      await prisma.company.update({
        where: { id: companyId },
        data: {
          subscriptionPlan: 'BASIC',
          subscriptionExpiry: expiryDate,
        },
      })

      // 支払いレコードを更新
      await prisma.payment.updateMany({
        where: { transactionId: session.id },
        data: { status: 'completed' },
      })
    }
  }

  return NextResponse.json({ received: true })
}
```

### ステップ6: Webhook URLの登録

1. Stripe Dashboardにログイン
2. 開発者 → Webhooks → エンドポイントを追加
3. エンドポイントURL: `https://yourdomain.com/api/webhooks/stripe`
4. イベント選択: `checkout.session.completed`
5. Webhook署名シークレットをコピーして `.env.local` に追加

---

## 入金の確認方法

### Stripeの場合：

1. **Stripe Dashboard**にログイン
2. **残高** セクションで入金を確認
3. デフォルトの入金スケジュール：
   - 毎営業日（手数料控除後）
   - 2-7営業日で銀行口座に振込

### PayPayの場合：

1. **加盟店管理画面**にログイン
2. **入金履歴**で確認
3. 入金スケジュール：
   - 月2回（15日、月末）
   - 手数料：約3.24%

---

## セキュリティのベストプラクティス

1. **APIキーの保護**
   - `.env.local` をgitignoreに追加
   - 本番環境では環境変数を使用
   - フロントエンドにシークレットキーを露出しない

2. **Webhook署名の検証**
   - 必ず署名を検証してリクエストの正当性を確認

3. **HTTPS必須**
   - 本番環境では必ずHTTPSを使用

---

## テスト方法

### Stripeテストモード：

1. テストカード番号を使用：
   ```
   カード番号: 4242 4242 4242 4242
   有効期限: 任意の将来の日付
   CVC: 任意の3桁
   ```

2. 支払いフローをテスト
3. Stripe Dashboardでイベントログを確認

---

## 推奨される決済プロバイダー

**日本国内向けサービスの場合：**

1. **第一候補: Stripe**
   - 統合が簡単
   - 優れたドキュメント
   - クレジットカード対応
   - 月額課金対応

2. **第二候補: PayPay**
   - 日本市場で人気
   - QRコード決済
   - モバイルユーザー向け

**複数の決済方法を統合する場合：**
- Stripe（クレジットカード）+ PayPay（QRコード）の組み合わせが最適

---

## 次のステップ

1. ✅ 決済プロバイダーを選択（推奨：Stripe）
2. ✅ アカウント作成と認証情報取得
3. ✅ 銀行口座情報を登録（入金先）
4. ✅ `.env.local` に認証情報を設定
5. ✅ コードを更新（上記参照）
6. ✅ テスト環境でテスト
7. ✅ 本番環境に移行

ご質問があれば、お気軽にお尋ねください！
