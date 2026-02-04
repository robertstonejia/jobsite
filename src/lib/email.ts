// メール送信ユーティリティ
import nodemailer from 'nodemailer'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// Nodemailerトランスポーターを作成
function createTransporter() {
  // Gmailを使用する場合
  if (process.env.SMTP_HOST === 'smtp.gmail.com') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD, // Gmailアプリパスワードを使用
      },
    })
  }

  // その他のSMTPサーバーを使用する場合
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    console.log('[Email] Attempting to send email...')
    console.log('[Email] SMTP_USER:', process.env.SMTP_USER ? 'SET' : 'NOT SET')
    console.log('[Email] SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'SET' : 'NOT SET')
    console.log('[Email] To:', options.to)
    console.log('[Email] Subject:', options.subject)

    // SMTP設定が未設定の場合
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('❌ [Email] SMTP settings not configured!')
      console.log('SMTP_USER value:', process.env.SMTP_USER)
      console.log('SMTP_PASSWORD length:', process.env.SMTP_PASSWORD?.length || 0)
      return false // 本番環境ではfalseを返す
    }

    // メールを送信
    const transporter = createTransporter()

    // 送信元の表示名を設定（実名を隠す）
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER
    const fromName = process.env.EMAIL_FROM_NAME || 'seekjob'
    const from = `"${fromName}" <${fromAddress}>`

    await transporter.sendMail({
      from: from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    console.log('✅ Email sent successfully to:', options.to)
    return true
  } catch (error) {
    console.error('❌ Email sending failed:', error)
    return false
  }
}

// 応募通知メールのテンプレート
export function createApplicationNotificationEmail(data: {
  companyName: string
  jobTitle: string
  engineerName: string
  applicationUrl: string
}): EmailOptions {
  const subject = `【新規応募】${data.jobTitle}に応募がありました`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">新しい応募がありました</h2>
      <p>こんにちは、${data.companyName}様</p>
      <p>以下の求人に新しい応募がありました:</p>

      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>求人タイトル:</strong> ${data.jobTitle}</p>
        <p><strong>応募者:</strong> ${data.engineerName}</p>
      </div>

      <p>応募内容を確認するには、以下のリンクをクリックしてください:</p>
      <p>
        <a href="${data.applicationUrl}"
           style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          応募を確認する
        </a>
      </p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">
        このメールは自動送信されています。<br>
        メール通知の設定は、企業プロフィールページから変更できます。
      </p>
    </div>
  `

  const text = `
新しい応募がありました

こんにちは、${data.companyName}様

以下の求人に新しい応募がありました:

求人タイトル: ${data.jobTitle}
応募者: ${data.engineerName}

応募内容を確認するには、以下のURLにアクセスしてください:
${data.applicationUrl}

---
このメールは自動送信されています。
メール通知の設定は、企業プロフィールページから変更できます。
  `

  return { to: '', subject, html, text }
}

// スカウトメールのテンプレート
export function createScoutEmail(data: {
  engineerName: string
  companyName: string
  jobTitle: string
  jobUrl: string
  message: string
}): EmailOptions {
  const subject = `【スカウト】${data.companyName}からスカウトが届きました`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">スカウトが届きました</h2>
      <p>${data.engineerName}様</p>
      <p>${data.companyName}からスカウトが届きました:</p>

      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>企業名:</strong> ${data.companyName}</p>
        <p><strong>求人:</strong> ${data.jobTitle}</p>
        <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
        <p>${data.message}</p>
      </div>

      <p>詳細を確認するには、以下のリンクをクリックしてください:</p>
      <p>
        <a href="${data.jobUrl}"
           style="display: inline-block; background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          求人を確認する
        </a>
      </p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">
        このメールは自動送信されています。
      </p>
    </div>
  `

  const text = `
スカウトが届きました

${data.engineerName}様

${data.companyName}からスカウトが届きました:

企業名: ${data.companyName}
求人: ${data.jobTitle}

${data.message}

詳細を確認するには、以下のURLにアクセスしてください:
${data.jobUrl}

---
このメールは自動送信されています。
  `

  return { to: '', subject, html, text }
}

// メール検証メールのテンプレート
export function createVerificationEmail(data: {
  companyName: string
  verificationCode: string
  verificationUrl: string
}): EmailOptions {
  const subject = '【seekjob】メールアドレスの確認'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">メールアドレスの確認</h2>
      <p>${data.companyName}様</p>
      <p>seekjobにご登録いただきありがとうございます。</p>
      <p>以下の6桁の検証コードを入力して、メールアドレスの確認を完了してください:</p>

      <div style="background-color: #f5f5f5; padding: 30px; text-align: center; border-radius: 5px; margin: 20px 0;">
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #007bff; margin: 0;">
          ${data.verificationCode}
        </p>
      </div>

      <p>または、以下のリンクをクリックして確認を完了することもできます:</p>
      <p>
        <a href="${data.verificationUrl}"
           style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
          メールアドレスを確認する
        </a>
      </p>

      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        ※ この検証コードは30分間有効です。<br>
        ※ このメールに心当たりがない場合は、無視していただいて問題ありません。
      </p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">
        このメールは自動送信されています。<br>
        seekjob運営チーム
      </p>
    </div>
  `

  const text = `
メールアドレスの確認

${data.companyName}様

seekjobにご登録いただきありがとうございます。

以下の6桁の検証コードを入力して、メールアドレスの確認を完了してください:

${data.verificationCode}

または、以下のURLにアクセスして確認を完了することもできます:
${data.verificationUrl}

※ この検証コードは30分間有効です。
※ このメールに心当たりがない場合は、無視していただいて問題ありません。

---
このメールは自動送信されています。
seekjob運営チーム
  `

  return { to: '', subject, html, text }
}

// SMS風の検証メール（携帯電話番号での検証用）
export function createPhoneVerificationEmail(data: {
  userName: string
  verificationCode: string
  phoneNumber: string
}): EmailOptions {
  const subject = '【seekjob】電話番号の確認'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">電話番号の確認</h2>
      <p>${data.userName}様</p>
      <p>seekjobにご登録いただきありがとうございます。</p>
      <p>以下の6桁の検証コードを入力して、電話番号の確認を完了してください:</p>

      <div style="background-color: #f5f5f5; padding: 30px; text-align: center; border-radius: 5px; margin: 20px 0;">
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #28a745; margin: 0;">
          ${data.verificationCode}
        </p>
      </div>

      <p style="color: #666; font-size: 14px;">
        登録された電話番号: ${data.phoneNumber}
      </p>

      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        ※ この検証コードは30分間有効です。<br>
        ※ このメールに心当たりがない場合は、無視していただいて問題ありません。
      </p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">
        このメールは自動送信されています。<br>
        seekjob運営チーム
      </p>
    </div>
  `

  const text = `
電話番号の確認

${data.userName}様

seekjobにご登録いただきありがとうございます。

以下の6桁の検証コードを入力して、電話番号の確認を完了してください:

${data.verificationCode}

登録された電話番号: ${data.phoneNumber}

※ この検証コードは30分間有効です。
※ このメールに心当たりがない場合は、無視していただいて問題ありません。

---
このメールは自動送信されています。
seekjob運営チーム
  `

  return { to: '', subject, html, text }
}

// お問い合わせメールのテンプレート
export function createContactEmail(data: {
  name: string
  email: string
  subject: string
  message: string
}): EmailOptions {
  const emailSubject = `【お問い合わせ】${data.subject}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">新しいお問い合わせ</h2>

      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>お名前:</strong> ${data.name}</p>
        <p><strong>メールアドレス:</strong> ${data.email}</p>
        <p><strong>件名:</strong> ${data.subject}</p>
        <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
        <p><strong>お問い合わせ内容:</strong></p>
        <p style="white-space: pre-wrap;">${data.message}</p>
      </div>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">
        このメールは自動送信されています。<br>
        返信する場合は、${data.email}宛に直接ご返信ください。
      </p>
    </div>
  `

  const text = `
新しいお問い合わせ

お名前: ${data.name}
メールアドレス: ${data.email}
件名: ${data.subject}

お問い合わせ内容:
${data.message}

---
このメールは自動送信されています。
返信する場合は、${data.email}宛に直接ご返信ください。
  `

  return { to: 'kahyousei@gmail.com', subject: emailSubject, html, text }
}
