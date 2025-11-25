# メール送信設定ガイド

検証コードメールが届かない問題を解決するため、メール送信機能を設定する必要があります。

## 問題の原因

現在、メール送信プロバイダーが設定されていないため、検証コードメールが実際には送信されていません。

## 解決方法

### オプション1: Gmail を使用（最も簡単）

1. **Gmailアカウントを準備**
   - 既存のGmailアカウントを使用するか、新しく作成します
   - システム用のメールアドレス（例: `noreply@yourdomain.com`の代わり）として使用できます

2. **Googleアプリパスワードを作成**
   - Googleアカウントの2段階認証を有効にします
   - https://myaccount.google.com/apppasswords にアクセス
   - 「アプリを選択」→「メール」を選択
   - 「デバイスを選択」→「その他」を選択し、「TechJob」などの名前を入力
   - 「生成」をクリック
   - 表示された16桁のパスワードをコピー（スペースなし）

3. **.env ファイルを作成・編集**
   ```bash
   # プロジェクトルートに .env ファイルを作成
   cp .env.example .env
   ```

4. **.env ファイルに以下の設定を追加**
   ```env
   # Email Settings
   EMAIL_FROM="your-email@gmail.com"

   # SMTP Settings
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASSWORD="your-16-digit-app-password-here"
   ```

   **重要**:
   - `SMTP_USER` にはGmailアドレスを入力
   - `SMTP_PASSWORD` にはステップ2で作成したアプリパスワードを入力（通常のパスワードではありません）

5. **アプリケーションを再起動**
   ```bash
   # 開発サーバーを停止して再起動
   npm run dev
   ```

### オプション2: その他のSMTPプロバイダー

他のメールサービス（Outlook、Yahoo、カスタムSMTPサーバーなど）を使用する場合:

```env
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-password"
```

各プロバイダーのSMTP設定を確認してください:
- **Outlook/Hotmail**: `smtp.office365.com` (ポート587)
- **Yahoo**: `smtp.mail.yahoo.com` (ポート587)
- **カスタムドメイン**: ホスティングプロバイダーのSMTP設定を確認

## 設定確認方法

1. **登録を試す**
   - 新しいアカウントを登録してみます
   - メールアドレスに検証コードが届くことを確認

2. **サーバーログを確認**
   - ターミナルで以下のようなメッセージを確認:
   ```
   ✅ Email sent successfully to: user@example.com
   ```

3. **エラーが出た場合**
   - `❌ Email sending failed:` というメッセージが表示された場合:
     - SMTP設定が正しいか確認
     - Gmailの場合、アプリパスワードを使用しているか確認
     - 2段階認証が有効になっているか確認

## トラブルシューティング

### メールが届かない場合

1. **迷惑メールフォルダを確認**
   - 検証メールが迷惑メールに分類されている可能性があります

2. **SMTP設定を確認**
   ```bash
   # .env ファイルの設定を確認
   cat .env | grep SMTP
   ```

3. **サーバーログを確認**
   - ターミナルでエラーメッセージを確認
   - `SMTP settings not configured` と表示される場合、.env ファイルが読み込まれていません

4. **開発サーバーを再起動**
   - 環境変数の変更後は必ず再起動が必要です

### Gmail特有の問題

1. **「安全性の低いアプリのアクセス」エラー**
   - 通常のパスワードではなく、アプリパスワードを使用してください
   - 2段階認証を有効にする必要があります

2. **「認証に失敗しました」エラー**
   - アプリパスワードを正しくコピーしたか確認（スペースなし）
   - SMTP_USER がGmailアドレスと一致しているか確認

## セキュリティに関する注意

- **.env ファイルは絶対にGitにコミットしないでください**
  - `.gitignore` に `.env` が含まれていることを確認

- **本番環境では**:
  - 専用のメール送信サービス（SendGrid、AWS SESなど）の使用を検討
  - 環境変数を安全に管理（Vercel、Herokuなどの環境変数設定機能を使用）

## 実装の詳細

メール送信機能は以下のファイルで実装されています:
- `src/lib/email.ts:1-66` - メール送信ロジック
- `src/app/api/register/engineer/route.ts:114-127` - エンジニア登録時のメール送信
- `src/app/api/auth/send-verification/route.ts:58-73` - 検証コード再送信

何か問題があれば、サーバーログを確認してください。
