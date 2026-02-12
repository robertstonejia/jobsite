import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail, createPasswordResetEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'メールアドレスを入力してください' },
        { status: 400 }
      )
    }

    // ユーザーが存在しなくても同じレスポンスを返す（メール列挙攻撃防止）
    const successResponse = NextResponse.json({
      message: 'パスワードリセットメールを送信しました。メールをご確認ください。',
    })

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      return successResponse
    }

    // セキュアなトークンを生成
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30分

    // 既存の未使用トークンを無効化
    await prisma.passwordReset.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    })

    // 新しいリセットトークンを作成
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    // リセットメールを送信
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    const emailContent = createPasswordResetEmail({ resetUrl })
    await sendEmail({
      ...emailContent,
      to: user.email,
    })

    return successResponse
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'パスワードリセットの処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
