import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// POST - Confirm payment and activate subscription
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentId } = await req.json()

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
    }

    // Get company
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get payment record
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.companyId !== user.company.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (payment.status === 'completed') {
      return NextResponse.json({ error: 'Payment already completed' }, { status: 400 })
    }

    // Calculate subscription expiry (30 days from now)
    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + 1)

    // Update payment status to completed
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'completed',
      },
    })

    // Activate subscription
    await prisma.company.update({
      where: { id: user.company.id },
      data: {
        subscriptionPlan: payment.plan,
        subscriptionExpiry: expiryDate,
      },
    })

    return NextResponse.json({
      message: 'Payment confirmed and subscription activated',
      subscriptionPlan: payment.plan,
      subscriptionExpiry: expiryDate,
    })
  } catch (error) {
    console.error('Payment confirmation error:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}
