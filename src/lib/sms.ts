// SMS送信サービス (Twilio使用)
// Twilioを使用する場合は以下の環境変数が必要:
// TWILIO_ACCOUNT_SID
// TWILIO_AUTH_TOKEN
// TWILIO_PHONE_NUMBER

interface SendSMSParams {
  to: string
  message: string
}

export async function sendSMS({ to, message }: SendSMSParams): Promise<boolean> {
  // 環境変数のチェック
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromPhone = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromPhone) {
    console.error('Twilio credentials are not configured')
    console.error('Required environment variables:')
    console.error('- TWILIO_ACCOUNT_SID')
    console.error('- TWILIO_AUTH_TOKEN')
    console.error('- TWILIO_PHONE_NUMBER')
    return false
  }

  try {
    // Twilio REST APIを使用してSMSを送信
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          To: to,
          From: fromPhone,
          Body: message,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('Failed to send SMS:', error)
      return false
    }

    const result = await response.json()
    console.log('SMS sent successfully:', result.sid)
    return true
  } catch (error) {
    console.error('Error sending SMS:', error)
    return false
  }
}

// 検証コードSMSを作成
export function createVerificationSMS(verificationCode: string): string {
  return `【seekjob】
認証コード: ${verificationCode}

このコードは30分間有効です。
このメッセージに心当たりがない場合は無視してください。`
}
