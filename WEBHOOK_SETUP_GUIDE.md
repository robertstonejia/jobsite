# Webhook自動完了設定ガイド

## 概要

決済プロバイダー（WeChat Pay、Alipay、PayPay）からのWebhook通知を受け取って、支払いを自動的に完了する設定方法を説明します。

## 前提条件

1. ✅ 決済プロバイダーのアカウントが作成済み
2. ✅ HTTPSが有効なドメイン（例: https://yourdomain.com）
3. ✅ アプリケーションが本番環境にデプロイ済み
4. ✅ 環境変数が正しく設定済み

---

## ステップ1: 環境変数の設定

`.env`ファイルに以下を追加してください:

```env
# アプリケーションのURL（重要！）
NEXT_PUBLIC_URL="https://yourdomain.com"

# WeChat Pay
WECHAT_APP_ID="wx1234567890abcdef"
WECHAT_MCH_ID="1234567890"
WECHAT_API_KEY="your-32-character-api-key-here"

# Alipay
ALIPAY_APP_ID="2021001234567890"
ALIPAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----"
ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"

# PayPay
PAYPAY_API_KEY="your-paypay-api-key"
PAYPAY_API_SECRET="your-paypay-api-secret"
PAYPAY_MERCHANT_ID="your-merchant-id"
PAYPAY_ENVIRONMENT="production"
```

設定後、アプリケーションを再起動してください:
```bash
npm run build
npm start
```

---

## ステップ2: Webhook URLの確認

あなたのWebhook URLは:
```
https://yourdomain.com/api/webhooks/payment
```

このURLが決済プロバイダーからアクセス可能であることを確認してください。

### テスト方法

```bash
# HTTPSでアクセスできるか確認
curl https://yourdomain.com/api/webhooks/payment

# 期待されるレスポンス: 401 Unauthorized (署名がないため)
```

---

## ステップ3: 決済プロバイダーでWebhook設定

### A. WeChat Pay（微信支付）

1. **管理画面にアクセス**
   - URL: https://pay.weixin.qq.com/
   - 商户平台にログイン

2. **Webhook URL設定**
   - 左メニュー: 「产品中心」→「开发配置」
   - 「支付结果通知URL」を見つける
   - 以下を入力:
     ```
     https://yourdomain.com/api/webhooks/payment
     ```

3. **カスタムヘッダー設定**
   - 「自定义请求头」セクションを見つける
   - 新しいヘッダーを追加:
     - **ヘッダー名**: `x-payment-provider`
     - **値**: `wechat`

4. **保存してテスト**
   - 「保存」ボタンをクリック
   - 「测试通知」ボタンでテスト送信
   - サーバーのログで受信を確認:
     ```bash
     tail -f /var/log/app.log | grep "Webhook received"
     ```

#### WeChat Pay設定画面のスクリーンショット例:
```
┌─────────────────────────────────────────┐
│ 开发配置                                  │
├─────────────────────────────────────────┤
│ 支付结果通知URL:                          │
│ [https://yourdomain.com/api/webhooks/payment] │
│                                         │
│ 自定义请求头:                             │
│ ┌────────────────────────────────────┐ │
│ │ 名称: x-payment-provider            │ │
│ │ 值: wechat                         │ │
│ └────────────────────────────────────┘ │
│                                         │
│ [保存] [测试通知]                        │
└─────────────────────────────────────────┘
```

---

### B. Alipay（支付宝）

1. **管理画面にアクセス**
   - URL: https://open.alipay.com/
   - 开放平台にログイン

2. **アプリケーションを選択**
   - 「开发者中心」→「网页&移动应用」
   - 自分のアプリケーションをクリック

3. **Webhook URL設定**
   - 左メニュー: 「开发信息」
   - 「接口加签方式」セクションを見つける
   - 「异步通知URL」に以下を入力:
     ```
     https://yourdomain.com/api/webhooks/payment
     ```

4. **カスタムヘッダー設定**
   - 「扩展参数」セクションを見つける
   - 新しいパラメータを追加:
     - **パラメータ名**: `x-payment-provider`
     - **値**: `alipay`

5. **保存してテスト**
   - 「保存」ボタンをクリック
   - 「调试工具」でテスト
   - サーバーのログで受信を確認

#### Alipay設定画面のスクリーンショット例:
```
┌─────────────────────────────────────────┐
│ 接口信息                                  │
├─────────────────────────────────────────┤
│ 异步通知URL:                              │
│ [https://yourdomain.com/api/webhooks/payment] │
│                                         │
│ 扩展参数:                                 │
│ ┌────────────────────────────────────┐ │
│ │ 参数名: x-payment-provider          │ │
│ │ 参数值: alipay                      │ │
│ └────────────────────────────────────┘ │
│                                         │
│ [保存] [调试工具]                        │
└─────────────────────────────────────────┘
```

---

### C. PayPay

1. **管理画面にアクセス**
   - URL: https://developer.paypay.ne.jp/
   - Developerポータルにログイン

2. **Webhook設定ページ**
   - 左メニュー: 「Settings」→「Webhooks」
   - 「Add Webhook」ボタンをクリック

3. **Webhook URL設定**
   - **Webhook URL**: `https://yourdomain.com/api/webhooks/payment`
   - **イベントタイプ**: `payment.completed` にチェック
   - **Status**: `Active` を選択

4. **カスタムヘッダー設定**
   - 「Custom Headers」セクションを展開
   - 「Add Header」ボタンをクリック
   - 以下を入力:
     - **Header Name**: `x-payment-provider`
     - **Header Value**: `paypay`

5. **保存してテスト**
   - 「Save」ボタンをクリック
   - 「Test」ボタンでテスト送信
   - サーバーのログで受信を確認

#### PayPay設定画面のスクリーンショット例:
```
┌─────────────────────────────────────────┐
│ Add Webhook                             │
├─────────────────────────────────────────┤
│ Webhook URL:                            │
│ [https://yourdomain.com/api/webhooks/payment] │
│                                         │
│ Event Types:                            │
│ ☑ payment.completed                    │
│ ☐ payment.failed                       │
│ ☐ refund.completed                     │
│                                         │
│ Custom Headers:                         │
│ ┌────────────────────────────────────┐ │
│ │ Name: x-payment-provider            │ │
│ │ Value: paypay                       │ │
│ └────────────────────────────────────┘ │
│                                         │
│ Status: ● Active  ○ Inactive           │
│                                         │
│ [Save] [Test]                          │
└─────────────────────────────────────────┘
```

---

## ステップ4: 動作テスト

### テストフロー

1. **支払いを作成**
   - ブラウザで支払いページにアクセス
   - プランを選択
   - QRコードが表示される

2. **実際に支払いを実行**
   - WeChat Pay/Alipay/PayPayアプリでQRコードをスキャン
   - 支払いを完了

3. **Webhook通知を確認**
   サーバーのログで以下を確認:
   ```bash
   # ログを監視
   tail -f /var/log/app.log

   # 期待されるログ:
   [2025-11-25T10:30:00] Webhook received: provider=wechat, paymentId=xxx
   [2025-11-25T10:30:00] Signature verified: success
   [2025-11-25T10:30:00] Payment completed: paymentId=xxx, transactionId=xxx
   ```

4. **データベースを確認**
   ```bash
   # PostgreSQLに接続
   psql -U postgres -d techjob

   # 支払いステータスを確認
   SELECT id, status, "transactionId", "createdAt"
   FROM "Payment"
   ORDER BY "createdAt" DESC
   LIMIT 5;

   # 期待される結果:
   # status = 'completed'
   # transactionId = 実際のトランザクションID
   ```

5. **フロントエンドで確認**
   - 支払いページが自動的にダッシュボードにリダイレクト
   - サブスクリプションが有効になっている

---

## トラブルシューティング

### ❌ Webhookが届かない

**症状**: 支払いを完了してもステータスが更新されない

**原因1: URL設定が間違っている**
```bash
# 確認方法
curl https://yourdomain.com/api/webhooks/payment

# 正しい場合: HTTPステータス 401 (署名なし)
# 間違っている場合: 404 Not Found
```

**解決策**:
- Webhook URLを再確認
- HTTPSになっているか確認
- スペルミスがないか確認

**原因2: ヘッダーが設定されていない**
```bash
# ログで確認
tail -f /var/log/app.log | grep "Unknown provider"

# このエラーが出ている場合:
# x-payment-provider ヘッダーが設定されていない
```

**解決策**:
- カスタムヘッダー `x-payment-provider` を追加
- 値は `wechat`、`alipay`、`paypay` のいずれか

**原因3: ファイアウォールでブロック**
```bash
# サーバーのファイアウォールを確認
sudo ufw status

# ポート443が開いているか確認
sudo ufw allow 443/tcp
```

---

### ❌ 署名検証エラー

**症状**: Webhookは届くが署名検証で失敗

**ログの例**:
```
[ERROR] Invalid webhook signature
```

**解決策**:
1. **環境変数を確認**
   ```bash
   # 環境変数が設定されているか確認
   echo $WECHAT_API_KEY
   echo $ALIPAY_PRIVATE_KEY
   echo $PAYPAY_API_SECRET
   ```

2. **APIキーをコピペミスがないか確認**
   - 管理画面から最新のキーを取得
   - コピペ時にスペースや改行が入っていないか確認

3. **アルゴリズムを確認**
   - WeChat Pay: MD5
   - Alipay: RSA-SHA256
   - PayPay: HMAC-SHA256

---

### ❌ 金額不一致エラー

**症状**: 支払いは成功するが金額不一致で失敗

**ログの例**:
```
[ERROR] Amount mismatch: expected 368, got 3.68
```

**原因**: 通貨単位が間違っている

**解決策**:
- WeChat Pay: **分**（1元 = 100分）
- Alipay: **元**（小数点2桁）
- PayPay: **円**

---

## セキュリティチェックリスト

Webhook設定完了後、以下を確認してください:

- [ ] HTTPSが有効化されている
- [ ] 環境変数が正しく設定されている
- [ ] Webhook署名検証が有効
- [ ] 金額検証が実装されている
- [ ] ログ記録が有効
- [ ] エラー通知が設定されている
- [ ] テスト支払いが成功する
- [ ] 本番支払いが自動完了する

---

## 監視とアラート

### 推奨する監視項目

1. **Webhook受信率**
   - すべての支払いに対してWebhookが届いているか
   - アラート: 5分間Webhookがない場合

2. **署名検証成功率**
   - 署名検証の成功率が90%以上か
   - アラート: 失敗率が10%を超えた場合

3. **支払い完了時間**
   - 支払いからWebhook受信までの時間
   - アラート: 5分以上かかる場合

### ログ監視コマンド

```bash
# Webhook受信ログ
tail -f /var/log/app.log | grep "Webhook received"

# エラーログ
tail -f /var/log/app.log | grep "ERROR"

# 支払い完了ログ
tail -f /var/log/app.log | grep "Payment completed"
```

---

## よくある質問（FAQ）

### Q1: テスト環境と本番環境でWebhook URLを分けられますか？

**A**: はい、できます。

テスト環境:
```
https://test.yourdomain.com/api/webhooks/payment
```

本番環境:
```
https://yourdomain.com/api/webhooks/payment
```

決済プロバイダーの管理画面で両方を設定してください。

---

### Q2: 複数の決済プロバイダーを同時に使えますか？

**A**: はい、できます。

同じWebhook URL（`/api/webhooks/payment`）を使用し、`x-payment-provider`ヘッダーで判別します。

---

### Q3: Webhookが失敗した場合、リトライされますか？

**A**: 決済プロバイダーによって異なります。

- **WeChat Pay**: 最大8回リトライ（15分、30分、1時間...）
- **Alipay**: 最大7回リトライ（2分、10分、10分...）
- **PayPay**: 最大3回リトライ（1分、5分、10分）

---

### Q4: 開発環境でWebhookをテストできますか？

**A**: はい、ngrokなどを使用できます。

```bash
# ngrokをインストール
npm install -g ngrok

# ローカルサーバーを公開
ngrok http 3000

# 表示されたURLをWebhook URLとして使用
https://abc123.ngrok.io/api/webhooks/payment
```

---

## サポート

問題が解決しない場合:

1. **ログを確認**: `/var/log/app.log`
2. **環境変数を確認**: すべて正しく設定されているか
3. **決済プロバイダーのステータスページを確認**: サービス障害がないか
4. **決済プロバイダーのサポートに連絡**:
   - WeChat Pay: https://kf.qq.com/
   - Alipay: https://open.alipay.com/
   - PayPay: https://developer.paypay.ne.jp/support

---

## まとめ

Webhook自動完了の設定手順:

1. ✅ 環境変数を設定
2. ✅ アプリケーションをデプロイ
3. ✅ 決済プロバイダー管理画面でWebhook URLを設定
4. ✅ カスタムヘッダー `x-payment-provider` を追加
5. ✅ テスト支払いで動作確認
6. ✅ 監視とログを設定

これで、ユーザーが支払いを完了すると自動的にシステムに反映されます！
