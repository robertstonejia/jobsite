import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET - 未読メッセージ数を取得
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: {
        company: true,
        engineer: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let unreadCount = 0

    if (user.company) {
      // 企業の場合、技術者から送信された未読メッセージをカウント
      unreadCount = await prisma.message.count({
        where: {
          companyId: user.company.id,
          senderType: 'ENGINEER',
          isRead: false,
        },
      })
    } else if (user.engineer) {
      // 技術者の場合、企業から送信された未読メッセージをカウント
      unreadCount = await prisma.message.count({
        where: {
          engineerId: user.engineer.id,
          senderType: 'COMPANY',
          isRead: false,
        },
      })
    }

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error('Error fetching unread message count:', error)
    return NextResponse.json({ error: 'Failed to fetch unread message count' }, { status: 500 })
  }
}
