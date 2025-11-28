import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// POST - Create scout access payment
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { paymentMethod } = body

    if (!paymentMethod || !['paypay', 'wechat', 'alipay'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Check if company has active subscription
    const now = new Date()
    const hasActiveSubscription =
      user.company.subscriptionPlan !== 'FREE' &&
      user.company.subscriptionExpiry &&
      user.company.subscriptionExpiry > now

    if (!hasActiveSubscription) {
      return NextResponse.json(
        { error: 'スカウト機能を利用するには、月額会員プランへの登録が必要です' },
        { status: 403 }
      )
    }

    // Calculate amount based on payment method
    let amount: number
    let currency: string

    if (paymentMethod === 'paypay') {
      amount = 3000
      currency = 'JPY'
    } else {
      amount = 150
      currency = 'CNY'
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        companyId: user.company.id,
        amount,
        currency,
        paymentMethod,
        plan: 'BASIC', // Using BASIC plan enum value for scout payments
        status: 'pending',
      },
    })

    // Create payment approval token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    await prisma.paymentApproval.create({
      data: {
        paymentId: payment.id,
        token,
        expiresAt,
      },
    })

    return NextResponse.json({ payment, token }, { status: 201 })
  } catch (error) {
    console.error('Error creating scout payment:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
