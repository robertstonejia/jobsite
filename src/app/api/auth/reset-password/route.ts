import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'トークンが必要です'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    // トークンを検証
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!passwordReset) {
      return NextResponse.json(
        { error: '無効なリセットトークンです' },
        { status: 400 }
      )
    }

    if (passwordReset.used) {
      return NextResponse.json(
        { error: 'このリセットリンクは既に使用されています' },
        { status: 400 }
      )
    }

    if (new Date() > passwordReset.expiresAt) {
      return NextResponse.json(
        { error: 'リセットリンクの有効期限が切れています。もう一度リセットをリクエストしてください。' },
        { status: 400 }
      )
    }

    // パスワードをハッシュ化
    const passwordHash = await hash(password, 12)

    // トランザクションでパスワード更新 + トークン使用済みに設定
    await prisma.$transaction([
      prisma.user.update({
        where: { id: passwordReset.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { used: true },
      }),
    ])

    return NextResponse.json({
      message: 'パスワードが正常にリセットされました',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'パスワードリセット中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
