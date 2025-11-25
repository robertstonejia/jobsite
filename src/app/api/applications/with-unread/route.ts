import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET - 応募一覧と各応募の未読メッセージ数を取得
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

    let applications: any[] = []

    if (user.engineer) {
      // 技術者の場合
      applications = await prisma.application.findMany({
        where: { engineerId: user.engineer.id },
        include: {
          job: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // 各応募の未読メッセージ数を取得
      const applicationsWithUnread = await Promise.all(
        applications.map(async (app) => {
          const unreadCount = await prisma.message.count({
            where: {
              applicationId: app.id,
              senderType: 'COMPANY',
              isRead: false,
            },
          })
          return { ...app, unreadCount }
        })
      )

      return NextResponse.json(applicationsWithUnread)
    } else if (user.company) {
      // 企業の場合
      applications = await prisma.application.findMany({
        where: {
          job: {
            companyId: user.company.id,
          },
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              companyId: true,
            },
          },
          engineer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // 各応募の未読メッセージ数を取得
      const applicationsWithUnread = await Promise.all(
        applications.map(async (app) => {
          const unreadCount = await prisma.message.count({
            where: {
              applicationId: app.id,
              senderType: 'ENGINEER',
              isRead: false,
            },
          })
          return { ...app, unreadCount }
        })
      )

      return NextResponse.json(applicationsWithUnread)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching applications with unread count:', error)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}
