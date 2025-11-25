# 決済SDK インストールガイド

このガイドでは、PayPay、WeChat Pay、Alipayの各SDKをインストールする方法を説明します。

## PayPay SDK のインストール（推奨・日本市場向け）

### ステップ1: SDKのインストール

```bash
npm install @paypayopa/paypayopa-sdk-node
```

### ステップ2: 環境変数の設定

`.env.local` ファイルを作成（プロジェクトルートに）：

```env
# PayPay API認証情報
PAYPAY_API_KEY=your-api-key-here
PAYPAY_API_SECRET=your-api-secret-here
PAYPAY_MERCHANT_ID=your-merchant-id-here
PAYPAY_ENVIRONMENT=sandbox

# アプリケーションURL
NEXT_PUBLIC_URL=http://localhost:3000
```

### ステップ3: PayPay初期化ファイルの作成

プロジェクトに以下のファイルを作成：

**ファイル**: `src/lib/paypay.ts`

```typescript
import paypaySdk from '@paypayopa/paypayopa-sdk-node'

if (!process.env.PAYPAY_API_KEY || !process.env.PAYPAY_API_SECRET || !process.env.PAYPAY_MERCHANT_ID) {
  throw new Error('PayPay credentials are not configured')
}

// PayPay設定
const paypayConfig = {
  clientId: process.env.PAYPAY_API_KEY,
  clientSecret: process.env.PAYPAY_API_SECRET,
  merchantId: process.env.PAYPAY_MERCHANT_ID,
  productionMode: process.env.PAYPAY_ENVIRONMENT === 'production',
}

// PayPay SDKを初期化
paypaySdk.configure(paypayConfig)

export { paypaySdk }
```

### ステップ4: API認証情報の取得方法

1. **PayPay for Developers に登録**
   - URL: https://developer.paypay.ne.jp/
   - 「加盟店になる」をクリック

2. **必要書類を準備**
   - 法人登記簿謄本（発行から3ヶ月以内）
   - 代表者の本人確認書類
   - 銀行口座情報

3. **審査通過後、管理画面で認証情報を取得**
   - Sandbox（テスト環境）の認証情報
   - Production（本番環境）の認証情報

4. **テスト環境で開発開始**
   ```env
   PAYPAY_ENVIRONMENT=sandbox
   ```

5. **本番環境へ移行**
   ```env
   PAYPAY_ENVIRONMENT=production
   ```

---

## WeChat Pay SDK のインストール（中国市場向け）

### ステップ1: SDKのインストール

```bash
npm install wechatpay-node-v3
```

### ステップ2: 証明書ファイルの配置

WeChat Pay加盟店管理画面から証明書をダウンロード：
- `apiclient_cert.pem`
- `apiclient_key.pem`

プロジェクトの `certs/wechat/` フォルダに配置

### ステップ3: 環境変数の設定

```env
# WeChat Pay API認証情報
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_MCH_ID=1234567890
WECHAT_API_KEY=your-32-character-api-key
WECHAT_CERT_SERIAL=your-certificate-serial-number
WECHAT_CERT_PATH=./certs/wechat/apiclient_cert.pem
WECHAT_KEY_PATH=./certs/wechat/apiclient_key.pem
```

### ステップ4: WeChat Pay初期化ファイル

**ファイル**: `src/lib/wechat.ts`

```typescript
import { Wechatpay } from 'wechatpay-node-v3'
import fs from 'fs'
import path from 'path'

if (!process.env.WECHAT_APP_ID || !process.env.WECHAT_MCH_ID || !process.env.WECHAT_API_KEY) {
  throw new Error('WeChat Pay credentials are not configured')
}

const certPath = path.resolve(process.cwd(), process.env.WECHAT_CERT_PATH!)
const keyPath = path.resolve(process.cwd(), process.env.WECHAT_KEY_PATH!)

export const wechatPay = new Wechatpay({
  appid: process.env.WECHAT_APP_ID,
  mchid: process.env.WECHAT_MCH_ID,
  privateKey: fs.readFileSync(keyPath, 'utf-8'),
  serial_no: process.env.WECHAT_CERT_SERIAL!,
  publicKey: fs.readFileSync(certPath, 'utf-8'),
  authType: 'wechatpay',
  userAgent: 'JobSite-Application/1.0',
})
```

---

## Alipay SDK のインストール（中国市場向け）

### ステップ1: SDKのインストール

```bash
npm install alipay-sdk
```

### ステップ2: RSAキーペアの生成

Alipayは RSA2048 暗号化を使用します：

```bash
# プライベートキーの生成
openssl genrsa -out app_private_key.pem 2048

# パブリックキーの生成
openssl rsa -in app_private_key.pem -pubout -out app_public_key.pem
```

### ステップ3: Alipay管理画面で公開鍵を設定

1. Alipay管理コンソールにログイン
2. アプリ設定 → 開発設定
3. `app_public_key.pem` の内容をアップロード
4. Alipayの公開鍵をダウンロード

### ステップ4: 環境変数の設定

```env
# Alipay API認証情報
ALIPAY_APP_ID=2021001234567890
ALIPAY_PRIVATE_KEY_PATH=./certs/alipay/app_private_key.pem
ALIPAY_PUBLIC_KEY_PATH=./certs/alipay/alipay_public_key.pem
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
```

### ステップ5: Alipay初期化ファイル

**ファイル**: `src/lib/alipay.ts`

```typescript
import AlipaySdk from 'alipay-sdk'
import fs from 'fs'
import path from 'path'

if (!process.env.ALIPAY_APP_ID) {
  throw new Error('Alipay credentials are not configured')
}

const privateKeyPath = path.resolve(process.cwd(), process.env.ALIPAY_PRIVATE_KEY_PATH!)
const publicKeyPath = path.resolve(process.cwd(), process.env.ALIPAY_PUBLIC_KEY_PATH!)

export const alipaySdk = new AlipaySdk({
  appId: process.env.ALIPAY_APP_ID,
  privateKey: fs.readFileSync(privateKeyPath, 'utf-8'),
  alipayPublicKey: fs.readFileSync(publicKeyPath, 'utf-8'),
  gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
  charset: 'utf-8',
  version: '1.0',
  signType: 'RSA2',
})
```

---

## インストール後の確認

### PayPay の動作確認

```typescript
// test/paypay-test.ts
import { paypaySdk } from '../src/lib/paypay'

async function testPayPay() {
  try {
    const payload = {
      merchantPaymentId: `test_${Date.now()}`,
      amount: { amount: 100, currency: 'JPY' },
      orderDescription: 'テスト決済',
      userAgent: 'test-agent',
      requestedAt: Math.floor(Date.now() / 1000),
      redirectUrl: 'http://localhost:3000/callback',
      redirectType: 'WEB_LINK',
    }

    const response = await paypaySdk.code.createQRCode(payload)
    console.log('PayPay QR Code URL:', response.data.url)
    console.log('✅ PayPay接続成功！')
  } catch (error) {
    console.error('❌ PayPay接続失敗:', error)
  }
}

testPayPay()
```

実行：
```bash
npx tsx test/paypay-test.ts
```

---

## トラブルシューティング

### エラー: "credentials are not configured"

**解決方法**:
- `.env.local` ファイルがプロジェクトルートにあることを確認
- 環境変数名が正しいことを確認
- 開発サーバーを再起動

### エラー: "Cannot find module '@paypayopa/paypayopa-sdk-node'"

**解決方法**:
```bash
npm install @paypayopa/paypayopa-sdk-node
# または
npm install
```

### エラー: "ENOENT: no such file or directory"（証明書ファイル）

**解決方法**:
- 証明書ファイルのパスが正しいか確認
- `certs/` フォルダを作成
- 相対パスを絶対パスに変更

### PayPay Sandbox でテストできない

**解決方法**:
- `PAYPAY_ENVIRONMENT=sandbox` を確認
- Sandbox用のAPI認証情報を使用
- PayPay管理画面でSandboxアカウントを作成

---

## 推奨される開発フロー

### 段階1: Sandbox環境で開発

```env
PAYPAY_ENVIRONMENT=sandbox
PAYPAY_API_KEY=sandbox-api-key
PAYPAY_API_SECRET=sandbox-api-secret
```

### 段階2: テスト

- Sandbox環境で支払いフローをテスト
- QRコード生成を確認
- コールバック処理を確認

### 段階3: 本番環境へ移行

```env
PAYPAY_ENVIRONMENT=production
PAYPAY_API_KEY=production-api-key
PAYPAY_API_SECRET=production-api-secret
```

---

## 次のステップ

1. ✅ 使用する決済方法を選択
2. ✅ SDKをインストール
3. ✅ 認証情報を取得
4. ✅ `.env.local` を設定
5. ✅ 初期化ファイルを作成
6. ✅ テスト実行
7. ✅ 支払いAPIを実装

詳細な実装例は `DIRECT_PAYMENT_INTEGRATION.md` を参照してください。

ご質問があればお気軽にお尋ねください！
