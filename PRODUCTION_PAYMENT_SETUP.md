# 本番環境 決済システム設定ガイド

## 概要

本システムは実際の決済プロバイダー（WeChat Pay、Alipay、PayPay）と連携して支払いを処理します。
ユーザーは手動で支払いを完了できず、決済プロバイダーからのWebhook通知によってのみ支払いが完了します。

## 前提条件

- 決済プロバイダーのビジネスアカウント（WeChat Pay / Alipay / PayPay）
- HTTPSが有効なドメイン（Webhookには必須）
- Node.js 18以上
- PostgreSQLデータベース

## 決済プロバイダーアカウント作成

### 1. WeChat Pay（中国市場向け）

**必要なもの:**
- 中国の事業者登録
- 銀行口座（中国国内）

**登録手順:**
1. https://pay.weixin.qq.com/ にアクセス
2. 「商户接入」をクリック
3. 事業者情報を入力して申請
4. 審査完了後、以下の情報を取得:
   - App ID (应用ID)
   - Merchant ID (商户号)
   - API Key (API密钥)

**料金:**
- 申請費用: 無料
- 取引手数料: 0.6%

### 2. Alipay（中国市場向け）

**必要なもの:**
- 中国の事業者登録
- 銀行口座（中国国内）

**登録手順:**
1. https://open.alipay.com/ にアクセス
2. 「立即接入」をクリック
3. 事業者情報を入力して申請
4. 審査完了後、以下の情報を取得:
   - App ID
   - Private Key (RSA秘密鍵)
   - Public Key (Alipay公開鍵)

**料金:**
- 申請費用: 無料
- 取引手数料: 0.6%

### 3. PayPay（日本市場向け）

**必要なもの:**
- 日本の法人登録
- 銀行口座（日本国内）

**登録手順:**
1. https://developer.paypay.ne.jp/ にアクセス
2. 「加盟店登録」をクリック
3. 法人情報を入力して申請
4. 審査完了後、以下の情報を取得:
   - API Key
   - API Secret
   - Merchant ID

**料金:**
- 申請費用: 無料
- 取引手数料: 1.98%～3.5%

## 環境変数の設定

`.env` ファイルに以下の環境変数を追加してください:

```env
# アプリケーションURL（Webhook用）
NEXT_PUBLIC_URL="https://yourdomain.com"

# WeChat Pay設定
WECHAT_APP_ID="your-wechat-app-id"
WECHAT_MCH_ID="your-wechat-merchant-id"
WECHAT_API_KEY="your-wechat-api-key"

# Alipay設定
ALIPAY_APP_ID="your-alipay-app-id"
ALIPAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYour Private Key Here\n-----END RSA PRIVATE KEY-----"
ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nAlipay Public Key Here\n-----END PUBLIC KEY-----"

# PayPay設定
PAYPAY_API_KEY="your-paypay-api-key"
PAYPAY_API_SECRET="your-paypay-api-secret"
PAYPAY_MERCHANT_ID="your-paypay-merchant-id"
PAYPAY_ENVIRONMENT="production"  # 本番環境は"production"、テスト環境は"sandbox"
```

**重要:** 本番環境では必ず実際の認証情報を使用してください。

## Webhook URLの設定

各決済プロバイダーの管理画面でWebhook URLを設定する必要があります。

### WeChat Pay Webhook設定

1. WeChat Pay管理画面にログイン
2. 「产品中心」→「开发配置」を選択
3. 「支付结果通知URL」を設定:
   ```
   https://yourdomain.com/api/webhooks/payment
   ```
4. ヘッダー設定:
   ```
   x-payment-provider: wechat
   ```

### Alipay Webhook設定

1. Alipay開放平台にログイン
2. 「开发者中心」→「网关产品」→「手机网站支付」を選択
3. 「异步通知URL」を設定:
   ```
   https://yourdomain.com/api/webhooks/payment
   ```
4. ヘッダー設定:
   ```
   x-payment-provider: alipay
   ```

### PayPay Webhook設定

1. PayPay for Developers管理画面にログイン
2. 「Settings」→「Webhooks」を選択
3. Webhook URLを追加:
   ```
   https://yourdomain.com/api/webhooks/payment
   ```
4. カスタムヘッダーを追加:
   ```
   x-payment-provider: paypay
   ```
5. イベントタイプを選択: `payment.completed`

## デプロイ手順

### 1. 環境変数の確認

本番環境で以下の環境変数が正しく設定されているか確認:

```bash
# 確認コマンド
echo $WECHAT_APP_ID
echo $ALIPAY_APP_ID
echo $PAYPAY_API_KEY
echo $NEXT_PUBLIC_URL
```

### 2. HTTPSの有効化

Webhookは通常HTTPSが必須です。Let's Encryptなどで証明書を取得してください。

```bash
# Certbotを使用した例
sudo certbot --nginx -d yourdomain.com
```

### 3. アプリケーションのビルドとデプロイ

```bash
# 依存関係のインストール
npm install

# Prismaクライアント生成
npx prisma generate

# データベースマイグレーション
npx prisma migrate deploy

# 本番ビルド
npm run build

# アプリケーション起動
npm start
```

### 4. Webhook接続テスト

各決済プロバイダーの管理画面でWebhookテストを実行:

1. WeChat Pay: 「接口调试」→「支付结果通知」でテスト
2. Alipay: 「网关产品」→「测试」でテスト
3. PayPay: 「Webhooks」→「Test」でテスト

## 動作確認

### テストフロー

1. **支払い作成**
   ```bash
   curl -X POST https://yourdomain.com/api/payments \
     -H "Content-Type: application/json" \
     -H "Cookie: your-session-cookie" \
     -d '{
       "plan": "BASIC",
       "paymentMethod": "wechat",
       "amount": 10000
     }'
   ```

2. **QRコード決済ページにアクセス**
   - 返されたpaymentIdを使用
   - `/payment/qrcode?paymentId={id}&method=wechat`

3. **実際の支払いを実行**
   - WeChat Payアプリでスキャン
   - 368元を支払い

4. **Webhookの受信を確認**
   ```bash
   # ログを確認
   pm2 logs
   # または
   tail -f /var/log/app.log
   ```

5. **データベースで確認**
   ```sql
   SELECT * FROM "Payment" WHERE id = 'payment_id';
   -- statusが'completed'になっているか確認
   ```

## トラブルシューティング

### Webhookが届かない

**症状:** 支払いを完了してもステータスが更新されない

**原因と対策:**
1. **Webhook URLが間違っている**
   - 決済プロバイダー管理画面でURLを確認
   - `https://yourdomain.com/api/webhooks/payment` になっているか

2. **HTTPSが有効になっていない**
   - `curl https://yourdomain.com` でアクセスできるか確認
   - SSL証明書が有効か確認

3. **ファイアウォールでブロックされている**
   - 決済プロバイダーのIPアドレスを許可リストに追加
   - ポート443 (HTTPS)が開いているか確認

4. **ヘッダーが設定されていない**
   - `x-payment-provider` ヘッダーが正しく送信されているか確認

### 署名検証エラー

**症状:** Webhookは届くが署名検証で失敗

**原因と対策:**
1. **APIキー/シークレットが間違っている**
   - 環境変数の値を再確認
   - 管理画面から最新の値を取得

2. **署名アルゴリズムが間違っている**
   - WeChat Pay: MD5
   - Alipay: RSA-SHA256
   - PayPay: HMAC-SHA256

3. **タイムスタンプのずれ**
   - サーバーの時刻が正確か確認
   - NTPで時刻同期: `sudo ntpdate pool.ntp.org`

### 金額不一致エラー

**症状:** 支払いは成功するが金額不一致で失敗

**原因と対策:**
1. **通貨単位が間違っている**
   - WeChat Pay: 分（1元 = 100分）
   - Alipay: 元（小数点2桁）
   - PayPay: 円

2. **期待金額が間違っている**
   - `src/lib/payment-providers.ts` の `getExpectedAmount()` 関数を確認
   - WeChat/Alipay: 368元
   - PayPay: 8,000円

## セキュリティチェックリスト

- [ ] 環境変数が適切に設定されている
- [ ] HTTPSが有効化されている
- [ ] Webhook署名検証が有効
- [ ] 金額検証が実装されている
- [ ] 重複決済防止が実装されている
- [ ] ログ記録が有効
- [ ] エラー通知が設定されている
- [ ] データベースバックアップが設定されている
- [ ] 決済プロバイダーのIPアドレス制限（推奨）

## 監視とログ

### 重要なログ項目

1. **Webhook受信ログ**
   ```
   Webhook received: provider=wechat, paymentId=xxx
   ```

2. **署名検証ログ**
   ```
   Signature verified: provider=wechat, result=success
   ```

3. **支払い完了ログ**
   ```
   Payment completed: paymentId=xxx, transactionId=xxx
   ```

4. **エラーログ**
   ```
   Payment error: provider=wechat, error=signature_mismatch
   ```

### 推奨監視ツール

- **アプリケーション監視:** PM2, New Relic, Datadog
- **ログ管理:** CloudWatch Logs, Loggly, Papertrail
- **エラー追跡:** Sentry, Rollbar
- **稼働監視:** Pingdom, UptimeRobot

## サポートとヘルプ

### 決済プロバイダーサポート

- **WeChat Pay:** https://kf.qq.com/faq/120911VrYVrA151009JB3i2Q.html
- **Alipay:** https://opendocs.alipay.com/
- **PayPay:** https://developer.paypay.ne.jp/support

### 技術サポート

問題が発生した場合:
1. ログを確認
2. 環境変数を再確認
3. Webhook URLをテスト
4. 決済プロバイダーのステータスページを確認

## 追加機能

今後の実装候補:
- [ ] 自動リトライ機能
- [ ] 決済履歴エクスポート
- [ ] 返金機能
- [ ] 決済分析ダッシュボード
- [ ] メール通知
- [ ] SMS通知

## ライセンスと規約

決済プロバイダーの利用規約を必ずお読みください:
- WeChat Pay: https://pay.weixin.qq.com/
- Alipay: https://render.alipay.com/p/f/agreementdown/index.htm
- PayPay: https://developer.paypay.ne.jp/terms
