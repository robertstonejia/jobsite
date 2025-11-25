import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// メッセージ送信のバリデーションスキーマ
const sendMessageSchema = z.object({
  applicationId: z.string(),
  content: z.string().min(1),
})

// POST - メッセージを送信
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = sendMessageSchema.parse(body)

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

    // applicationを取得して送信者が関係者かチェック
    const application = await prisma.application.findUnique({
      where: { id: validatedData.applicationId },
      include: {
        job: {
          include: {
            company: true,
          },
        },
        engineer: true,
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // 送信者のタイプと権限チェック
    let senderType: string
    let companyId: string
    let engineerId: string

    if (user.company) {
      // 企業ユーザーの場合、この求人が自社のものかチェック
      if (application.job.companyId !== user.company.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
      senderType = 'COMPANY'
      companyId = user.company.id
      engineerId = application.engineerId
    } else if (user.engineer) {
      // 技術者の場合、この応募が自分のものかチェック
      if (application.engineerId !== user.engineer.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
      senderType = 'ENGINEER'
      companyId = application.job.companyId
      engineerId = user.engineer.id
    } else {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 403 })
    }

    // メッセージを作成
    const message = await prisma.message.create({
      data: {
        applicationId: validatedData.applicationId,
        companyId,
        engineerId,
        senderType,
        content: validatedData.content,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
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
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

// GET - 応募に関連するメッセージを取得
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const applicationId = searchParams.get('applicationId')

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 })
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

    // applicationを取得して閲覧者が関係者かチェック
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            company: true,
          },
        },
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // 権限チェック
    if (user.company) {
      if (application.job.companyId !== user.company.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    } else if (user.engineer) {
      if (application.engineerId !== user.engineer.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 403 })
    }

    // メッセージを取得
    const messages = await prisma.message.findMany({
      where: { applicationId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
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
      orderBy: {
        createdAt: 'asc',
      },
    })

    // 未読メッセージを既読にする
    const unreadMessages = messages.filter(
      (msg) =>
        !msg.isRead &&
        ((user.company && msg.senderType === 'ENGINEER') ||
          (user.engineer && msg.senderType === 'COMPANY'))
    )

    if (unreadMessages.length > 0) {
      await prisma.message.updateMany({
        where: {
          id: { in: unreadMessages.map((m) => m.id) },
        },
        data: {
          isRead: true,
        },
      })
    }

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}
