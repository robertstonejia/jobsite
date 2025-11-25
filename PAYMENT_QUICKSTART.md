# 決済統合クイックスタートガイド

このガイドでは、最も簡単な方法で決済機能を統合する手順を説明します。

## 推奨: PayPay から始める（日本市場向け）

PayPayは日本市場で最も人気があり、統合も比較的簡単です。

---

## 5ステップで始める

### ステップ1: PayPay加盟店登録（1-2週間）

1. **公式サイトにアクセス**
   - https://developer.paypay.ne.jp/

2. **「加盟店になる」をクリック**

3. **必要書類を準備**
   - 📄 法人登記簿謄本（発行から3ヶ月以内）
   - 📄 代表者の本人確認書類（運転免許証またはパスポート）
   - 📄 銀行口座情報（通帳のコピー）
   - 📄 事業内容資料（ウェブサイトURL、パンフレットなど）

4. **オンライン申請**
   - 企業情報を入力
   - 書類をアップロード

5. **審査待ち**
   - 通常1-2週間で審査結果が通知されます

### ステップ2: API認証情報の取得（5分）

審査通過後：

1. **加盟店管理画面にログイン**

2. **開発者向け設定** → **API認証情報** を開く

3. **以下の情報をコピー**
   - ✅ API Key（Sandbox版）
   - ✅ API Secret（Sandbox版）
   - ✅ Merchant ID

4. **メモ帳に保存**（後で使用します）

### ステップ3: 銀行口座を登録（5分）

**重要**: ここに売上が入金されます！

1. 加盟店管理画面 → **入金設定**

2. **銀行口座情報を入力**
   - 銀行名: 例）三菱UFJ銀行
   - 支店名: 例）渋谷支店
   - 口座種別: 普通 または 当座
   - 口座番号: 7桁
   - 口座名義: カタカナで入力

3. **保存**

4. **入金スケジュール確認**
   - 月2回（15日、月末締め）
   - 各締め日の翌営業日から7営業日以内に振込

### ステップ4: プロジェクトに統合（10分）

1. **PayPay SDKをインストール**

```bash
cd C:\Users\ka-hyousei\seekjob\jobsite
npm install @paypayopa/paypayopa-sdk-node
```

2. **環境変数ファイルを作成**

プロジェクトルートに `.env.local` ファイルを作成：

```env
# PayPay API認証情報（ステップ2でコピーした情報を貼り付け）
PAYPAY_API_KEY=ここにAPI Keyを貼り付け
PAYPAY_API_SECRET=ここにAPI Secretを貼り付け
PAYPAY_MERCHANT_ID=ここにMerchant IDを貼り付け
PAYPAY_ENVIRONMENT=sandbox

# アプリケーションURL
NEXT_PUBLIC_URL=http://localhost:3000
```

3. **初期化ファイルを作成**

`src/lib/paypay.ts` ファイルを作成：

```typescript
import paypaySdk from '@paypayopa/paypayopa-sdk-node'

const paypayConfig = {
  clientId: process.env.PAYPAY_API_KEY!,
  clientSecret: process.env.PAYPAY_API_SECRET!,
  merchantId: process.env.PAYPAY_MERCHANT_ID!,
  productionMode: process.env.PAYPAY_ENVIRONMENT === 'production',
}

paypaySdk.configure(paypayConfig)

export { paypaySdk }
```

### ステップ5: テスト実行（5分）

1. **開発サーバーを起動**

```bash
npm run dev
```

2. **ブラウザで確認**
   - http://localhost:3000 にアクセス
   - 企業ユーザーでログイン
   - サブスクリプションページへ移動
   - PayPayを選択して支払いテスト

3. **PayPay管理画面で確認**
   - テストトランザクションが表示されることを確認

---

## 本番環境への移行（後日）

テストが成功したら：

1. **本番API認証情報を取得**
   - PayPay管理画面 → Production環境の認証情報

2. **環境変数を更新**

```env
PAYPAY_API_KEY=本番用API Key
PAYPAY_API_SECRET=本番用API Secret
PAYPAY_MERCHANT_ID=本番用Merchant ID
PAYPAY_ENVIRONMENT=production  # sandboxからproductionに変更
```

3. **デプロイ**

---

## よくある質問（FAQ）

### Q1: 審査にどのくらい時間がかかりますか？
**A**: 通常1-2週間です。書類に不備があると長くなる場合があります。

### Q2: 個人事業主でも登録できますか？
**A**: はい、可能です。開業届と確定申告書のコピーが必要です。

### Q3: 手数料はいくらですか？
**A**: 通常3.24%です。取引量が多い場合は交渉可能です。

### Q4: いつ入金されますか？
**A**: 月2回（15日締め、月末締め）。各締め日の翌営業日から7営業日以内。

### Q5: テスト環境で実際にお金が動きますか？
**A**: いいえ、Sandbox環境では実際の決済は行われません。

### Q6: 他の決済方法も追加できますか？
**A**: はい、後からWeChat PayやAlipayを追加できます。

---

## トラブルシューティング

### ❌ エラー: "credentials are not configured"

**原因**: 環境変数が読み込まれていない

**解決方法**:
1. `.env.local` ファイルがプロジェクトルートにあるか確認
2. ファイル名が正しいか確認（`.env.local` であって `.env` ではない）
3. 開発サーバーを再起動

### ❌ エラー: "Cannot find module '@paypayopa/paypayopa-sdk-node'"

**原因**: SDKがインストールされていない

**解決方法**:
```bash
npm install @paypayopa/paypayopa-sdk-node
```

### ❌ PayPay QRコードが生成されない

**原因**: API認証情報が間違っている

**解決方法**:
1. `.env.local` の認証情報を再確認
2. PayPay管理画面でSandbox用の認証情報を再取得
3. コピー&ペーストミスがないか確認

---

## 次のステップ

✅ **完了したら**:

1. [ ] PayPay加盟店登録申請
2. [ ] 審査通過を待つ（1-2週間）
3. [ ] API認証情報を取得
4. [ ] 銀行口座を登録
5. [ ] SDKをインストール
6. [ ] `.env.local` を設定
7. [ ] テスト実行
8. [ ] 本番環境へ移行

**詳細な実装手順**:
- `INSTALLATION_GUIDE.md` - SDKインストール詳細
- `DIRECT_PAYMENT_INTEGRATION.md` - 完全な統合ガイド

---

## サポートが必要な場合

### PayPay公式サポート
- 開発者向けドキュメント: https://developer.paypay.ne.jp/docs
- サポート問い合わせ: 加盟店管理画面からチケット作成

### このプロジェクトについて
- 実装に関する質問: お気軽にお尋ねください

---

**次は何をしますか？**

1. **PayPay加盟店登録を開始** → https://developer.paypay.ne.jp/
2. **WeChat PayまたはAlipayも検討** → `DIRECT_PAYMENT_INTEGRATION.md` を参照
3. **実装例を確認** → `INSTALLATION_GUIDE.md` を参照

がんばってください！🚀
