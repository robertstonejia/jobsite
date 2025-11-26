import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

/**
 * 支払い完了リクエストを送信
 * 管理者メールに確認メールを送信し、承認後に支払いが完了する
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: { company: true }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Verify the payment belongs to the logged-in company
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true }
    })

    if (!user?.company || user.company.id !== payment.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 既に完了している場合
    if (payment.status === 'completed') {
      return NextResponse.json({
        message: 'Payment already completed',
        payment
      })
    }

    // 支払いステータスを「承認待ち」に更新
    await prisma.payment.update({
      where: { id: params.id },
      data: {
        status: 'pending_approval'
      }
    })

    // 承認トークンを生成
    const approvalToken = generateApprovalToken()

    // トークンをデータベースに保存（24時間有効）
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    await prisma.paymentApproval.create({
      data: {
        paymentId: payment.id,
        token: approvalToken,
        expiresAt,
        status: 'pending'
      }
    })

    // 管理者に確認メールを送信
    const adminEmail = process.env.ADMIN_EMAIL || 'kahyousei@gmail.com'
    const approvalUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/payments/${payment.id}/approve?token=${approvalToken}`
    const rejectUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/payments/${payment.id}/reject?token=${approvalToken}`

    // 決済方法に応じた金額表示
    let paymentAmount = ''
    switch (payment.paymentMethod) {
      case 'wechat':
      case 'alipay':
        paymentAmount = '168元 (CNY)'
        break
      case 'paypay':
        paymentAmount = '3,680円 (JPY)'
        break
      default:
        paymentAmount = `${payment.amount.toLocaleString()}円 (JPY)`
    }

    await sendEmail({
      to: adminEmail,
      subject: '【TechJob】支払い確認リクエスト',
      text: `
支払い確認リクエストが届きました。

■ 支払い情報
----------------------------------
会社名: ${payment.company.name}
プラン: ${payment.plan}
決済方法: ${getPaymentMethodName(payment.paymentMethod)}
金額: ${paymentAmount}
支払いID: ${payment.id}
リクエスト日時: ${new Date().toLocaleString('ja-JP')}

■ 確認方法
----------------------------------
実際に支払いが完了していることを確認してください。

【承認する場合】
以下のリンクをクリックしてください:
${approvalUrl}

【却下する場合】
以下のリンクをクリックしてください:
${rejectUrl}

※ このリンクは24時間有効です。
※ 承認すると、会社のサブスクリプションが有効化されます。

----------------------------------
TechJob 管理システム
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .info-box { background-color: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; margin-bottom: 10px; }
    .info-label { font-weight: bold; min-width: 120px; color: #6b7280; }
    .info-value { color: #111827; }
    .button-container { margin: 30px 0; text-align: center; }
    .button { display: inline-block; padding: 15px 40px; margin: 10px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; }
    .approve-button { background-color: #10b981; color: white; }
    .reject-button { background-color: #ef4444; color: white; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💳 支払い確認リクエスト</h1>
    </div>
    <div class="content">
      <p>支払い確認リクエストが届きました。</p>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #1f2937;">📋 支払い情報</h3>
        <div class="info-row">
          <span class="info-label">会社名:</span>
          <span class="info-value">${payment.company.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">プラン:</span>
          <span class="info-value">${payment.plan}</span>
        </div>
        <div class="info-row">
          <span class="info-label">決済方法:</span>
          <span class="info-value">${getPaymentMethodName(payment.paymentMethod)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">金額:</span>
          <span class="info-value" style="font-size: 18px; font-weight: bold; color: #10b981;">${paymentAmount}</span>
        </div>
        <div class="info-row">
          <span class="info-label">支払いID:</span>
          <span class="info-value" style="font-family: monospace;">${payment.id}</span>
        </div>
        <div class="info-row">
          <span class="info-label">リクエスト日時:</span>
          <span class="info-value">${new Date().toLocaleString('ja-JP')}</span>
        </div>
      </div>

      <div class="warning">
        <strong>⚠️ 確認事項</strong><br>
        実際に支払いが完了していることを確認してから承認してください。
      </div>

      <div class="button-container">
        <a href="${approvalUrl}" class="button approve-button">✅ 承認する</a>
        <a href="${rejectUrl}" class="button reject-button">❌ 却下する</a>
      </div>

      <p style="text-align: center; color: #6b7280; font-size: 14px;">
        ※ このリンクは24時間有効です。<br>
        ※ 承認すると、会社のサブスクリプションが有効化されます。
      </p>
    </div>
    <div class="footer">
      <p>TechJob 管理システム<br>
      このメールは自動送信されています。</p>
    </div>
  </div>
</body>
</html>
      `
    })

    console.log(`[Payment] Approval request sent to ${adminEmail} for payment ${payment.id}`)

    return NextResponse.json({
      success: true,
      message: '管理者に確認メールを送信しました。承認をお待ちください。',
      status: 'pending_approval'
    })
  } catch (error) {
    console.error('Error requesting payment approval:', error)
    return NextResponse.json({ error: 'Failed to request payment approval' }, { status: 500 })
  }
}

function generateApprovalToken(): string {
  return require('crypto').randomBytes(32).toString('hex')
}

function getPaymentMethodName(method: string): string {
  switch (method) {
    case 'wechat':
      return 'WeChat Pay (微信支付)'
    case 'alipay':
      return 'Alipay (支付宝)'
    case 'paypay':
      return 'PayPay'
    case 'credit':
      return 'クレジットカード'
    default:
      return method
  }
}
