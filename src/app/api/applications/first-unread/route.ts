import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET - 未読メッセージがある最初の応募を取得
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

    let firstUnreadApplication: any = null

    if (user.engineer) {
      // 技術者の場合、企業から送信された未読メッセージがある応募を取得
      const applicationsWithUnread = await prisma.application.findMany({
        where: { engineerId: user.engineer.id },
        include: {
          messages: {
            where: {
              senderType: 'COMPANY',
              isRead: false,
            },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // 未読メッセージがある最初の応募を見つける
      firstUnreadApplication = applicationsWithUnread.find(app => app.messages.length > 0)
    } else if (user.company) {
      // 企業の場合、技術者から送信された未読メッセージがある応募を取得
      const applicationsWithUnread = await prisma.application.findMany({
        where: {
          job: {
            companyId: user.company.id,
          },
        },
        include: {
          messages: {
            where: {
              senderType: 'ENGINEER',
              isRead: false,
            },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // 未読メッセージがある最初の応募を見つける
      firstUnreadApplication = applicationsWithUnread.find(app => app.messages.length > 0)
    }

    if (!firstUnreadApplication) {
      return NextResponse.json({ applicationId: null })
    }

    return NextResponse.json({ applicationId: firstUnreadApplication.id })
  } catch (error) {
    console.error('Error fetching first unread application:', error)
    return NextResponse.json({ error: 'Failed to fetch first unread application' }, { status: 500 })
  }
}
