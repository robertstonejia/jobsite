import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import {
  createWeChatPayment,
  createAlipayPayment,
  createPayPayPayment,
} from '@/lib/payment-providers'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

const createPaymentSchema = z.object({
  plan: z.enum(['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']),
  paymentMethod: z.enum(['credit', 'wechat', 'alipay', 'paypay']),
  amount: z.number().positive().optional(), // Monthly subscription is fixed at 10000 JPY
})

// POST - Create a payment
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createPaymentSchema.parse(body)

    // Get company
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // 月額会員費: 10,000円固定
    const MONTHLY_FEE = 10000

    // 決済プロバイダーごとの金額と通貨
    let amount: number
    let currency: string

    switch (validatedData.paymentMethod) {
      case 'wechat':
      case 'alipay':
        amount = 168 // 168元
        currency = 'CNY'
        break
      case 'paypay':
        amount = 3680 // 3,680円
        currency = 'JPY'
        break
      default:
        amount = MONTHLY_FEE
        currency = 'JPY'
    }

    // まず支払いレコードを作成
    const payment = await prisma.payment.create({
      data: {
        companyId: user.company.id,
        amount: MONTHLY_FEE,
        paymentMethod: validatedData.paymentMethod,
        plan: validatedData.plan,
        status: 'pending',
        transactionId: null,
      },
    })

    let qrCodeData: string | null = null
    let paymentUrl: string | null |　undefined

    // 決済プロバイダーの認証情報をチェック
    const hasWeChatCredentials = process.env.WECHAT_APP_ID && process.env.WECHAT_MCH_ID && process.env.WECHAT_API_KEY
    const hasAlipayCredentials = process.env.ALIPAY_APP_ID && process.env.ALIPAY_PRIVATE_KEY && process.env.ALIPAY_PUBLIC_KEY
    const hasPayPayCredentials = process.env.PAYPAY_API_KEY && process.env.PAYPAY_API_SECRET && process.env.PAYPAY_MERCHANT_ID

    try {
      // 決済プロバイダーと連携してQRコードを生成
      const callbackUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard/company?payment=success`

      switch (validatedData.paymentMethod) {
        case 'wechat':
          if (!hasWeChatCredentials) {
            // 開発環境: ダミーQRコードデータを生成
            qrCodeData = `weixin://wxpay/bizpayurl?pr=dummy_${payment.id}`
            console.warn('[DEV] WeChat Pay credentials not configured. Using dummy QR code.')
          } else {
            const wechatResult = await createWeChatPayment({
              paymentId: payment.id,
              amount,
              currency,
              description: `TechJob ${validatedData.plan} プラン - 月額会員費`,
              callbackUrl,
            })
            qrCodeData = wechatResult.qrCodeData
          }
          break

        case 'alipay':
          if (!hasAlipayCredentials) {
            // 開発環境: ダミーQRコードデータを生成
            qrCodeData = `https://qr.alipay.com/dummy_${payment.id}`
            console.warn('[DEV] Alipay credentials not configured. Using dummy QR code.')
          } else {
            const alipayResult = await createAlipayPayment({
              paymentId: payment.id,
              amount,
              currency,
              description: `TechJob ${validatedData.plan} プラン - 月額会員費`,
              callbackUrl,
            })
            qrCodeData = alipayResult.qrCodeData
          }
          break

        case 'paypay':
          if (!hasPayPayCredentials) {
            // 開発環境: ダミーQRコードデータを生成
            qrCodeData = `paypay://pay?code=dummy_${payment.id}`
            paymentUrl = `https://qr.paypay.ne.jp/dummy_${payment.id}`
            console.warn('[DEV] PayPay credentials not configured. Using dummy QR code.')
          } else {
            const paypayResult = await createPayPayPayment({
              paymentId: payment.id,
              amount,
              currency,
              description: `TechJob ${validatedData.plan} プラン - 月額会員費`,
              callbackUrl,
            })
            qrCodeData = paypayResult.qrCodeData
            paymentUrl = paypayResult.paymentUrl
          }
          break

        case 'credit':
          // クレジットカード決済は別途実装
          paymentUrl = '/payment/credit/pending'
          qrCodeData = `credit_dummy_${payment.id}`
          break
      }

      // QRコードデータを保存（今後の参照用）
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          // QRコードデータはtransactionIdフィールドに一時保存
          // 実際の決済完了後、Webhookで本物のトランザクションIDで上書きされる
          transactionId: qrCodeData || `PENDING_${Date.now()}`,
        },
      })
    } catch (error: any) {
      console.error('Payment provider error:', error)

      // 決済プロバイダーエラーの場合、支払いレコードを失敗状態に更新
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      })

      return NextResponse.json(
        {
          error: 'Failed to create payment with provider',
          details: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Payment created successfully',
        payment: {
          ...payment,
          qrCodeData,
        },
        paymentUrl,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Payment error:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}

// GET - Get payment history
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const payments = await prisma.payment.findMany({
      where: { companyId: user.company.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}
