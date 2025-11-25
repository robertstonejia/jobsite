import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, createVerificationEmail } from '@/lib/email'

// 6桁の検証コードを生成
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 既に検証済みの場合
    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
    }

    // 検証コードを生成
    const verificationCode = generateVerificationCode()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30) // 30分後に期限切れ

    // 既存の未検証コードを削除
    await prisma.emailVerification.deleteMany({
      where: {
        userId: user.id,
        verified: false,
      },
    })

    // 新しい検証コードを保存
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        email: user.email,
        verificationCode,
        expiresAt,
      },
    })

    // 検証メールを送信
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?code=${verificationCode}&userId=${user.id}`

    const companyName = user.company?.name || 'ユーザー'

    const emailData = createVerificationEmail({
      companyName,
      verificationCode,
      verificationUrl,
    })

    await sendEmail({
      ...emailData,
      to: user.email,
    })

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
    })
  } catch (error) {
    console.error('Error sending verification email:', error)
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
  }
}
