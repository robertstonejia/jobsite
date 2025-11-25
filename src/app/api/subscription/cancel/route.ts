import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// POST - Cancel subscription
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get company
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Check if already on free plan
    if (user.company.subscriptionPlan === 'FREE') {
      return NextResponse.json(
        { error: 'Already on free plan' },
        { status: 400 }
      )
    }

    // Cancel subscription - reset to FREE plan
    await prisma.company.update({
      where: { id: user.company.id },
      data: {
        subscriptionPlan: 'FREE',
        subscriptionExpiry: null,
      },
    })

    return NextResponse.json({
      message: 'Subscription canceled successfully',
      subscriptionPlan: 'FREE',
      subscriptionExpiry: null,
    })
  } catch (error) {
    console.error('Subscription cancellation error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
