# SMS機能のセットアップガイド

## 概要
技術者登録時の電話番号検証機能では、Twilio APIを使用してSMSで検証コードを送信します。

## 必要な環境変数

`.env.local`ファイルに以下の環境変数を追加してください:

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+815012345678
```

## Twilioアカウントの作成手順

1. **Twilioアカウントを作成**
   - https://www.twilio.com/try-twilio にアクセス
   - 必要事項を入力してアカウントを作成
   - 電話番号認証を完了

2. **認証情報を取得**
   - Twilioコンソールにログイン
   - ダッシュボードから以下の情報を取得:
     - Account SID
     - Auth Token

3. **電話番号を取得**
   - Twilioコンソールで「Phone Numbers」→「Buy a number」
   - 日本の電話番号（+81で始まる）を購入
   - SMS送信が有効な番号を選択

4. **環境変数を設定**
   - 取得した情報を`.env.local`に設定
   - サーバーを再起動

## フォールバック機能

SMS送信に失敗した場合、自動的にメールで検証コードを送信します。
これにより、Twilio設定がない環境でも動作を確認できます。

## 料金について

- Twilioは使用量に応じた従量課金制
- SMS送信料金: 日本国内約8円/通
- 詳細: https://www.twilio.com/ja-jp/sms/pricing/jp

## 開発環境での注意

開発環境では環境変数が設定されていない場合、自動的にメールで検証コードを送信します。
本番環境では必ずTwilio設定を完了してください。
