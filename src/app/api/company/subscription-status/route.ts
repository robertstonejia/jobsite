import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - 軽量なサブスクリプション状態チェック
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'COMPANY') {
      return NextResponse.json({ isActive: false }, { status: 200 })
    }

    const userId = (session.user as any).id

    const company = await prisma.company.findFirst({
      where: { userId },
      select: {
        subscriptionPlan: true,
        subscriptionExpiry: true,
        isTrialActive: true,
        trialEndDate: true,
      },
    })

    if (!company) {
      return NextResponse.json({ isActive: false })
    }

    const now = new Date()
    const expiry = company.subscriptionExpiry ? new Date(company.subscriptionExpiry) : null
    const isSubscriptionActive = company.subscriptionPlan !== 'FREE' && expiry && expiry > now

    const trialEndDate = company.trialEndDate ? new Date(company.trialEndDate) : null
    const isTrialActive = company.isTrialActive && trialEndDate && trialEndDate > now

    return NextResponse.json({
      isActive: isSubscriptionActive || isTrialActive,
    })
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return NextResponse.json({ isActive: false })
  }
}
