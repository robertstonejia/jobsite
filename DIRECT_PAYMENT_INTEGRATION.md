# PayPay、WeChat Pay、Alipay 直接統合ガイド

このガイドでは、PayPay、WeChat Pay、Alipayと直接統合して、あなたのアカウントに入金を受け取る方法を説明します。

---

## 1. PayPay for Developers 統合（日本市場向け・推奨）

### アカウント登録手順

#### ステップ1: PayPay加盟店登録
1. **PayPay for Developers**にアクセス
   - URL: https://developer.paypay.ne.jp/

2. **加盟店登録申請**
   - 「加盟店になる」をクリック
   - 必要書類を準備：
     - 法人登記簿謄本（発行から3ヶ月以内）
     - 代表者の本人確認書類（運転免許証、パスポートなど）
     - 銀行口座情報（通帳のコピーまたは口座証明書）
     - 事業内容がわかる資料（ウェブサイト、パンフレットなど）

3. **審査期間**: 通常1-2週間

#### ステップ2: API認証情報の取得

審査通過後：

1. **加盟店管理画面**にログイン
2. **開発者向け設定** → **API認証情報**
3. 以下の情報を取得：
   - **API Key** (Production/Sandbox)
   - **API Secret** (Production/Sandbox)
   - **Merchant ID**

#### ステップ3: 入金先口座の設定

1. 加盟店管理画面 → **入金設定**
2. 入金先銀行口座を登録：
   - 銀行名
   - 支店名
   - 口座種別（普通/当座）
   - 口座番号
   - 口座名義（カタカナ）

3. **入金スケジュール**:
   - 月2回（15日、月末締め）
   - 各締め日の翌営業日から7営業日以内に入金

4. **手数料**:
   - 決済手数料: 通常3.24%（交渉可能）
   - 入金手数料: 無料

#### ステップ4: 環境変数の設定

`.env.local` ファイルに追加：

```env
# PayPay Settings
PAYPAY_API_KEY=your-production-api-key
PAYPAY_API_SECRET=your-production-api-secret
PAYPAY_MERCHANT_ID=your-merchant-id
PAYPAY_ENVIRONMENT=production  # または sandbox（テスト環境）
NEXT_PUBLIC_URL=http://localhost:3000
```

#### ステップ5: PayPay SDKのインストール

```bash
npm install @paypayopa/paypayopa-sdk-node
```

#### ステップ6: PayPay初期化ファイルの作成

**ファイル**: `src/lib/paypay.ts`

```typescript
import paypaySdk from '@paypayopa/paypayopa-sdk-node'

// PayPay設定
const paypayConfig = {
  clientId: process.env.PAYPAY_API_KEY!,
  clientSecret: process.env.PAYPAY_API_SECRET!,
  merchantId: process.env.PAYPAY_MERCHANT_ID!,
  productionMode: process.env.PAYPAY_ENVIRONMENT === 'production',
}

// PayPay SDKを初期化
paypaySdk.configure(paypayConfig)

export { paypaySdk }
```

#### ステップ7: 支払いAPIの実装

**ファイル**: `src/app/api/payments/paypay/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { paypaySdk } from '@/lib/paypay'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const MONTHLY_FEE = 10000

    // PayPay決済リクエストを作成
    const payload = {
      merchantPaymentId: `order_${Date.now()}_${user.company.id}`,
      amount: {
        amount: MONTHLY_FEE,
        currency: 'JPY',
      },
      orderDescription: '月額会員プラン - ベーシックプラン',
      userAgent: req.headers.get('user-agent') || 'unknown',
      requestedAt: Math.floor(Date.now() / 1000),
      redirectUrl: `${process.env.NEXT_PUBLIC_URL}/api/payments/paypay/callback`,
      redirectType: 'WEB_LINK',
    }

    // PayPay QRコード作成
    const response = await paypaySdk.code.createQRCode(payload)

    if (response.resultInfo.code !== 'SUCCESS') {
      throw new Error(`PayPay API Error: ${response.resultInfo.message}`)
    }

    // 支払いレコードを作成
    const payment = await prisma.payment.create({
      data: {
        companyId: user.company.id,
        amount: MONTHLY_FEE,
        paymentMethod: 'paypay',
        plan: 'BASIC',
        status: 'pending',
        transactionId: payload.merchantPaymentId,
      },
    })

    return NextResponse.json({
      message: 'PayPay payment created',
      payment,
      paymentUrl: response.data.url, // PayPay支払いページURL
      deeplink: response.data.deeplink, // PayPayアプリ直接起動URL
    })
  } catch (error) {
    console.error('PayPay payment error:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
```

#### ステップ8: コールバック処理の実装

**ファイル**: `src/app/api/payments/paypay/callback/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { paypaySdk } from '@/lib/paypay'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const merchantPaymentId = searchParams.get('merchantPaymentId')

    if (!merchantPaymentId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/dashboard/company?payment=error`
      )
    }

    // PayPayで支払い状態を確認
    const response = await paypaySdk.payment.getPaymentDetails(merchantPaymentId)

    if (response.resultInfo.code !== 'SUCCESS') {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/dashboard/company?payment=error`
      )
    }

    const paymentStatus = response.data.status

    if (paymentStatus === 'COMPLETED') {
      // 支払いレコードを更新
      const payment = await prisma.payment.findFirst({
        where: { transactionId: merchantPaymentId },
      })

      if (payment) {
        // 支払い完了
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'completed' },
        })

        // サブスクリプションを有効化
        const expiryDate = new Date()
        expiryDate.setMonth(expiryDate.getMonth() + 1)

        await prisma.company.update({
          where: { id: payment.companyId },
          data: {
            subscriptionPlan: payment.plan,
            subscriptionExpiry: expiryDate,
          },
        })

        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_URL}/dashboard/company?payment=success`
        )
      }
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/dashboard/company?payment=error`
    )
  } catch (error) {
    console.error('PayPay callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/dashboard/company?payment=error`
    )
  }
}
```

### テスト方法

#### Sandbox環境でのテスト

1. **Sandbox認証情報を使用**
   ```env
   PAYPAY_ENVIRONMENT=sandbox
   ```

2. **テストアカウント**
   - PayPay管理画面でテストユーザーを作成
   - テスト用PayPayアプリでログイン

3. **支払いフローをテスト**
   - QRコードをスキャン
   - テストアプリで支払い承認
   - コールバックURLで完了確認

---

## 2. WeChat Pay 統合（中国市場向け）

### アカウント登録手順

#### ステップ1: WeChat Pay加盟店登録

1. **WeChat Pay公式サイト**
   - URL: https://pay.weixin.qq.com/

2. **企業認証**
   - 中国の営業許可証（企業）または
   - 海外企業の場合：現地法人設立が必要

3. **必要書類**:
   - 営業許可証
   - 法人代表者のID
   - 銀行口座情報

#### ステップ2: API認証情報の取得

1. 加盟店管理画面にログイン
2. **開発設定** → **API証明書**
3. 取得する情報：
   - **AppID** (アプリケーションID)
   - **Mch ID** (加盟店ID)
   - **API Key** (API密钥)
   - **証明書ファイル** (apiclient_cert.pem, apiclient_key.pem)

#### ステップ3: 環境変数の設定

```env
# WeChat Pay Settings
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_MCH_ID=1234567890
WECHAT_API_KEY=your-32-character-api-key
WECHAT_CERT_PATH=/path/to/apiclient_cert.pem
WECHAT_KEY_PATH=/path/to/apiclient_key.pem
```

#### ステップ4: WeChat Pay SDKのインストール

```bash
npm install wechatpay-node-v3
```

#### ステップ5: 実装例

**ファイル**: `src/lib/wechat.ts`

```typescript
import { Wechatpay } from 'wechatpay-node-v3'
import fs from 'fs'

export const wechatPay = new Wechatpay({
  appid: process.env.WECHAT_APP_ID!,
  mchid: process.env.WECHAT_MCH_ID!,
  privateKey: fs.readFileSync(process.env.WECHAT_KEY_PATH!),
  serial_no: 'your-certificate-serial-number',
  publicKey: fs.readFileSync(process.env.WECHAT_CERT_PATH!),
  authType: 'wechatpay',
  userAgent: 'your-application-name',
})
```

### 入金情報

- **入金スケジュール**: T+1（翌営業日）
- **手数料**: 0.6%（交渉可能）
- **最低入金額**: ¥1
- **入金先**: 中国国内の銀行口座

---

## 3. Alipay 統合（中国市場向け）

### アカウント登録手順

#### ステップ1: Alipay加盟店登録

1. **Alipay Global**
   - URL: https://global.alipay.com/

2. **企業アカウント作成**
   - 国際企業向けプログラム申請

3. **必要書類**:
   - 企業登記証明
   - 代表者のID
   - 銀行口座情報

#### ステップ2: API認証情報の取得

1. Alipay管理コンソールにログイン
2. **開発設定** → **アプリ管理**
3. 取得する情報：
   - **App ID**
   - **Private Key**（RSA2048）
   - **Alipay Public Key**

#### ステップ3: RSAキーペアの生成

```bash
# 秘密鍵の生成
openssl genrsa -out app_private_key.pem 2048

# 公開鍵の生成
openssl rsa -in app_private_key.pem -pubout -out app_public_key.pem

# Alipay管理画面に公開鍵をアップロード
```

#### ステップ4: 環境変数の設定

```env
# Alipay Settings
ALIPAY_APP_ID=2021001234567890
ALIPAY_PRIVATE_KEY=MIIEvQIBADANBg...（秘密鍵の内容）
ALIPAY_PUBLIC_KEY=MIIBIjANBgkqh...（Alipay公開鍵）
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
```

#### ステップ5: Alipay SDKのインストール

```bash
npm install alipay-sdk
```

#### ステップ6: 実装例

**ファイル**: `src/lib/alipay.ts`

```typescript
import AlipaySdk from 'alipay-sdk'
import fs from 'fs'

export const alipaySdk = new AlipaySdk({
  appId: process.env.ALIPAY_APP_ID!,
  privateKey: process.env.ALIPAY_PRIVATE_KEY!,
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY!,
  gateway: process.env.ALIPAY_GATEWAY!,
  charset: 'utf-8',
  version: '1.0',
  signType: 'RSA2',
})
```

### 入金情報

- **入金スケジュール**: T+1（翌営業日）
- **手数料**: 0.55%（交渉可能）
- **最低入金額**: ¥0.01
- **入金先**: 中国国内の銀行口座

---

## 推奨される統合順序

### 日本市場向け
1. ✅ **PayPay** - 最優先（日本で最も人気）

### 中国市場向け
1. ✅ **Alipay** - 最優先（中国で最も普及）
2. ✅ **WeChat Pay** - 第二優先

### 実装の優先順位

**段階1: PayPayのみ統合**
- 最も簡単
- 日本市場に最適
- 入金が早い

**段階2: Alipay追加**
- 中国ユーザー向け
- グローバル展開を視野

**段階3: WeChat Pay追加**
- 中国市場での完全カバレッジ

---

## 次のステップ

どの決済方法から始めますか？

1. **PayPay**（日本市場・推奨）
   - 登録URL: https://developer.paypay.ne.jp/
   - 実装が最も簡単
   - 日本の銀行口座に直接入金

2. **Alipay**（中国市場）
   - 登録URL: https://global.alipay.com/
   - グローバル対応
   - 中国の銀行口座が必要

3. **WeChat Pay**（中国市場）
   - 登録URL: https://pay.weixin.qq.com/
   - 中国での法人設立が必要

選択した決済方法に応じて、具体的な実装をサポートします！
