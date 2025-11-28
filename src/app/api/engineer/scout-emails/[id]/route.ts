import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/engineer/scout-emails/:id - スカウトメール詳細を取得
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ログインユーザーのエンジニア情報を取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { engineer: true },
    })

    if (!user?.engineer) {
      return NextResponse.json({ error: 'Engineer not found' }, { status: 404 })
    }

    // スカウトメールを取得
    const scoutEmail = await prisma.scoutEmail.findFirst({
      where: {
        id: params.id,
        engineerId: user.engineer.id,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            description: true,
            website: true,
            industry: true,
            employeeCount: true,
            address: true,
          },
        },
      },
    })

    if (!scoutEmail) {
      return NextResponse.json({ error: 'Scout email not found' }, { status: 404 })
    }

    // 既読にする
    if (!scoutEmail.isRead) {
      await prisma.scoutEmail.update({
        where: { id: params.id },
        data: { isRead: true },
      })
    }

    return NextResponse.json(scoutEmail)
  } catch (error) {
    console.error('Error fetching scout email:', error)
    return NextResponse.json({ error: 'Failed to fetch scout email' }, { status: 500 })
  }
}

// PATCH /api/engineer/scout-emails/:id - スカウトメールに返信
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ログインユーザーのエンジニア情報を取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { engineer: true },
    })

    if (!user?.engineer) {
      return NextResponse.json({ error: 'Engineer not found' }, { status: 404 })
    }

    // スカウトメールを取得して、権限を確認
    const scoutEmail = await prisma.scoutEmail.findFirst({
      where: {
        id: params.id,
        engineerId: user.engineer.id,
      },
    })

    if (!scoutEmail) {
      return NextResponse.json({ error: 'Scout email not found' }, { status: 404 })
    }

    // 既に返信済みの場合
    if (scoutEmail.isReplied) {
      return NextResponse.json({ error: 'Already replied' }, { status: 400 })
    }

    // 返信フラグを更新
    const updatedScoutEmail = await prisma.scoutEmail.update({
      where: { id: params.id },
      data: { isReplied: true },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            description: true,
            website: true,
            industry: true,
            employeeCount: true,
            address: true,
          },
        },
      },
    })

    return NextResponse.json(updatedScoutEmail)
  } catch (error) {
    console.error('Error replying to scout email:', error)
    return NextResponse.json({ error: 'Failed to reply to scout email' }, { status: 500 })
  }
}
