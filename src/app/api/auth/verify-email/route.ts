import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { userId, verificationCode } = await req.json()

    if (!userId || !verificationCode) {
      return NextResponse.json({ error: 'User ID and verification code are required' }, { status: 400 })
    }

    // 検証コードを検索
    const verification = await prisma.emailVerification.findFirst({
      where: {
        userId,
        verificationCode,
        verified: false,
      },
    })

    if (!verification) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    // 期限切れチェック
    if (new Date() > verification.expiresAt) {
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 })
    }

    // ユーザーのメール検証ステータスを更新
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      }),
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: { verified: true },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    })
  } catch (error) {
    console.error('Error verifying email:', error)
    return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 })
  }
}
