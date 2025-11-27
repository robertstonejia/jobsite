import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * 決済プロバイダーからのWebhookを受け取るエンドポイント
 * WeChat Pay, Alipay, PayPayなどの決済完了通知を処理
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-webhook-signature')
    const provider = req.headers.get('x-payment-provider') // 'wechat', 'alipay', 'paypay', etc.

    // Webhook署名の検証
    if (!verifyWebhookSignature(body, signature, provider)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const data = JSON.parse(body)

    // 決済プロバイダーに応じて処理を分岐
    let paymentId: string
    let transactionId: string
    let amount: number
    let status: string

    switch (provider) {
      case 'wechat':
        // WeChat Pay Webhookの処理
        paymentId = data.out_trade_no // 加盟店注文番号
        transactionId = data.transaction_id
        amount = data.total_fee / 100 // 分→元
        status = data.result_code === 'SUCCESS' ? 'completed' : 'failed'
        break

      case 'alipay':
        // Alipay Webhookの処理
        paymentId = data.out_trade_no
        transactionId = data.trade_no
        amount = parseFloat(data.total_amount)
        status = data.trade_status === 'TRADE_SUCCESS' ? 'completed' : 'failed'
        break

      case 'paypay':
        // PayPay Webhookの処理
        paymentId = data.merchantPaymentId
        transactionId = data.paymentId
        amount = data.amount.amount
        status = data.status === 'COMPLETED' ? 'completed' : 'failed'
        break

      default:
        console.error('Unknown payment provider:', provider)
        return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
    }

    // データベースの支払いレコードを検索
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { company: true }
    })

    if (!payment) {
      console.error('Payment not found:', paymentId)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // 金額の検証（不正な金額での決済を防ぐ）
    const expectedAmount = getExpectedAmount(payment.paymentMethod, payment.amount)
    if (Math.abs(amount - expectedAmount) > 0.01) {
      console.error(`Amount mismatch: expected ${expectedAmount}, got ${amount}`)
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    // 支払いステータスを更新
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: status,
        transactionId: transactionId
      }
    })

    // 支払い成功の場合、会社のサブスクリプションを更新
    if (status === 'completed') {
      const expiryDate = new Date()
      expiryDate.setMonth(expiryDate.getMonth() + 1) // 1ヶ月追加

      await prisma.company.update({
        where: { id: payment.companyId },
        data: {
          subscriptionPlan: payment.plan,
          subscriptionExpiry: expiryDate
        }
      })

      console.log(`Payment completed for company ${payment.companyId}: ${transactionId}`)
    }

    // 決済プロバイダーに成功を返す
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Webhook署名を検証
 */
function verifyWebhookSignature(
  body: string,
  signature: string | null,
  provider: string | null
): boolean {
  if (!signature || !provider) {
    return false
  }

  try {
    switch (provider) {
      case 'wechat':
        // WeChat Pay署名検証
        const wechatKey = process.env.WECHAT_API_KEY
        if (!wechatKey) return false
        const wechatHash = crypto
          .createHash('md5')
          .update(body + wechatKey)
          .digest('hex')
          .toUpperCase()
        return wechatHash === signature

      case 'alipay':
        // Alipay RSA署名検証
        const alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY
        if (!alipayPublicKey) return false
        const verifier = crypto.createVerify('RSA-SHA256')
        verifier.update(body)
        return verifier.verify(alipayPublicKey, signature, 'base64')

      case 'paypay':
        // PayPay HMAC署名検証
        const paypaySecret = process.env.PAYPAY_API_SECRET
        if (!paypaySecret) return false
        const paypayHash = crypto
          .createHmac('sha256', paypaySecret)
          .update(body)
          .digest('hex')
        return paypayHash === signature

      default:
        return false
    }
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

/**
 * 決済方法に応じた期待金額を取得
 */
function getExpectedAmount(paymentMethod: string, dbAmount: number): number {
  switch (paymentMethod) {
    case 'wechat':
    case 'alipay':
      return 168 // 168元
    case 'paypay':
      return 3680 // 3,680円
    case 'credit':
      return dbAmount
    default:
      return dbAmount
  }
}
