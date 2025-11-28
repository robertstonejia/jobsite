import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

/**
 * 支払いを承認
 * 管理者メールのリンクからアクセスされる
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return new NextResponse(
        generateHTML('エラー', '承認トークンが見つかりません。', 'error'),
        {
          status: 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      )
    }

    // トークンを確認
    const approval = await prisma.paymentApproval.findUnique({
      where: { token },
      include: {
        payment: {
          include: {
            company: true
          }
        }
      }
    })

    if (!approval) {
      return new NextResponse(
        generateHTML('エラー', '承認リクエストが見つかりません。', 'error'),
        {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      )
    }

    // トークンの有効期限を確認
    if (new Date() > approval.expiresAt) {
      return new NextResponse(
        generateHTML('エラー', '承認リンクの有効期限が切れています。', 'error'),
        {
          status: 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      )
    }

    // 既に処理済みの場合
    if (approval.status !== 'pending') {
      const statusText = approval.status === 'approved' ? '承認済み' : '却下済み'
      return new NextResponse(
        generateHTML('既に処理済み', `この支払いは既に${statusText}です。`, 'info'),
        {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      )
    }

    // Check if this is a scout payment based on amount
    const isScoutPayment = approval.payment.amount === 3000 || approval.payment.amount === 150

    // 支払いを承認
    await prisma.$transaction([
      // 承認レコードを更新
      prisma.paymentApproval.update({
        where: { id: approval.id },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: process.env.ADMIN_EMAIL || 'kahyousei@gmail.com'
        }
      }),

      // 支払いステータスを完了に更新
      prisma.payment.update({
        where: { id: approval.paymentId },
        data: {
          status: 'completed',
          transactionId: `APPROVED-${Date.now()}`
        }
      }),

      // 会社の情報を更新（スカウトまたはサブスクリプション）
      prisma.company.update({
        where: { id: approval.payment.companyId },
        data: isScoutPayment ? {
          // スカウト機能の場合
          hasScoutAccess: true,
          scoutAccessExpiry: new Date(new Date().setDate(new Date().getDate() + 30))
        } : {
          // サブスクリプションの場合
          subscriptionPlan: approval.payment.plan,
          subscriptionExpiry: new Date(new Date().setMonth(new Date().getMonth() + 1))
        }
      })
    ])

    console.log(`[Payment] Payment approved: ${approval.paymentId} by ${process.env.ADMIN_EMAIL}`)

    // 支払い方法に応じた実際の金額と通貨を取得
    const paymentDetails = getPaymentDetails(approval.payment.paymentMethod, approval.payment.amount)

    return new NextResponse(
      generateHTML(
        '承認完了',
        `
          <p>支払いを承認しました。</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">支払い情報</h3>
            <p><strong>会社名:</strong> ${approval.payment.company.name}</p>
            <p><strong>プラン:</strong> ${approval.payment.plan}</p>
            <p><strong>支払い方法:</strong> ${paymentDetails.methodName}</p>
            <p><strong>金額:</strong> ${paymentDetails.displayAmount}</p>
            <p><strong>承認日時:</strong> ${new Date().toLocaleString('ja-JP')}</p>
          </div>
          <p>会社のサブスクリプションが有効化されました。</p>
        `,
        'success'
      ),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    )
  } catch (error) {
    console.error('Error approving payment:', error)
    return new NextResponse(
      generateHTML('エラー', '支払いの承認中にエラーが発生しました。', 'error'),
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    )
  }
}

/**
 * 支払い方法に応じた実際の金額情報を取得
 */
function getPaymentDetails(paymentMethod: string, dbAmount: number): {
  methodName: string
  displayAmount: string
  actualAmount: number
  currency: string
} {
  const isScoutPayment = dbAmount === 3000 || dbAmount === 150

  switch (paymentMethod.toLowerCase()) {
    case 'wechat':
      return {
        methodName: 'WeChat Pay',
        displayAmount: isScoutPayment ? '¥150（人民元）' : '¥180（人民元）',
        actualAmount: isScoutPayment ? 150 : 180,
        currency: 'CNY'
      }
    case 'alipay':
      return {
        methodName: 'Alipay',
        displayAmount: isScoutPayment ? '¥150（人民元）' : '¥180（人民元）',
        actualAmount: isScoutPayment ? 150 : 180,
        currency: 'CNY'
      }
    case 'paypay':
      return {
        methodName: 'PayPay',
        displayAmount: isScoutPayment ? '¥3,000' : '¥3,680',
        actualAmount: isScoutPayment ? 3000 : 3680,
        currency: 'JPY'
      }
    case 'credit':
    case 'stripe':
      return {
        methodName: 'クレジットカード',
        displayAmount: `¥${dbAmount.toLocaleString()}`,
        actualAmount: dbAmount,
        currency: 'JPY'
      }
    default:
      return {
        methodName: paymentMethod,
        displayAmount: `¥${dbAmount.toLocaleString()}`,
        actualAmount: dbAmount,
        currency: 'JPY'
      }
  }
}

function generateHTML(title: string, message: string, type: 'success' | 'error' | 'info'): string {
  const colors = {
    success: { bg: '#10b981', text: '#065f46', light: '#d1fae5' },
    error: { bg: '#ef4444', text: '#991b1b', light: '#fee2e2' },
    info: { bg: '#3b82f6', text: '#1e40af', light: '#dbeafe' }
  }

  const color = colors[type]

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - TechJob</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      max-width: 600px;
      width: 100%;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }
    .header {
      background: ${color.bg};
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .content {
      padding: 40px 30px;
      color: #1f2937;
      line-height: 1.7;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    .message {
      background: ${color.light};
      border-left: 4px solid ${color.bg};
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      color: ${color.text};
    }
    .footer {
      background: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    a {
      color: ${color.bg};
      text-decoration: none;
      font-weight: bold;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</div>
      <h1>${title}</h1>
    </div>
    <div class="content">
      <div class="message">
        ${message}
      </div>
      <p style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}">TechJobホームページに戻る</a>
      </p>
    </div>
    <div class="footer">
      <p>TechJob 管理システム</p>
      <p style="margin-top: 5px;">このページは自動生成されています。</p>
    </div>
  </div>
</body>
</html>
  `
}
