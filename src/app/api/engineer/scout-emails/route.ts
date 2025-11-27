import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/engineer/scout-emails - スカウトメール一覧を取得
export async function GET() {
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

    // エンジニア向けのスカウトメールを取得
    const scoutEmails = await prisma.scoutEmail.findMany({
      where: {
        engineerId: user.engineer.id,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(scoutEmails)
  } catch (error) {
    console.error('Error fetching scout emails:', error)
    return NextResponse.json({ error: 'Failed to fetch scout emails' }, { status: 500 })
  }
}
