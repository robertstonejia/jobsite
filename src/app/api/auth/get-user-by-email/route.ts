import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // ユーザー情報を取得（emailVerifiedステータスは返さない）
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      userId: user.id,
    })
  } catch (error) {
    console.error('Error getting user by email:', error)
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 })
  }
}
