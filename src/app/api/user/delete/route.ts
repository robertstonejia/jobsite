import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: '認証されていません' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id

    // ユーザーを削除（Cascadeで関連データも削除される）
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json(
      { message: 'アカウントを削除しました' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'アカウントの削除に失敗しました' },
      { status: 500 }
    )
  }
}
