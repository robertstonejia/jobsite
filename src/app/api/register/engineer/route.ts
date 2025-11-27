import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendEmail, createVerificationEmail, createPhoneVerificationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  nearestStation: z.string().optional(),
  bio: z.string().optional(),
  yearsOfExperience: z.number().optional(),
  currentPosition: z.string().optional(),
  githubUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  verificationType: z.enum(['email', 'phone']).default('email'),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hash(validatedData.password, 12)

    // Create user and engineer
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        role: 'ENGINEER',
        engineer: {
          create: {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            phoneNumber: validatedData.phoneNumber,
            address: validatedData.address,
            nearestStation: validatedData.nearestStation,
            bio: validatedData.bio,
            yearsOfExperience: validatedData.yearsOfExperience,
            currentPosition: validatedData.currentPosition,
            githubUrl: validatedData.githubUrl,
            linkedinUrl: validatedData.linkedinUrl,
            portfolioUrl: validatedData.portfolioUrl,
          },
        },
      },
      include: {
        engineer: true,
      },
    })

    // 検証コードを生成
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30) // 30分後に期限切れ

    const userName = `${validatedData.lastName} ${validatedData.firstName}`

    // メールまたは電話番号での検証
    if (validatedData.verificationType === 'phone' && validatedData.phoneNumber) {
      // 電話番号検証
      await prisma.emailVerification.create({
        data: {
          userId: user.id,
          phoneNumber: validatedData.phoneNumber,
          verificationCode,
          verificationType: 'phone',
          expiresAt,
        },
      })

      // 電話番号検証用のメールを送信（実際のSMS送信は別途実装が必要）
      const emailData = createPhoneVerificationEmail({
        userName,
        verificationCode,
        phoneNumber: validatedData.phoneNumber,
      })

      await sendEmail({
        ...emailData,
        to: validatedData.email, // メールアドレスにも送信
      })
    } else {
      // メール検証
      await prisma.emailVerification.create({
        data: {
          userId: user.id,
          email: validatedData.email,
          verificationCode,
          verificationType: 'email',
          expiresAt,
        },
      })

      // 検証メールを送信
      const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?code=${verificationCode}&userId=${user.id}`

      const emailData = createVerificationEmail({
        companyName: userName,
        verificationCode,
        verificationUrl,
      })

      await sendEmail({
        ...emailData,
        to: validatedData.email,
      })
    }

    return NextResponse.json(
      {
        message: '技術者アカウントが正常に作成されました',
        userId: user.id,
        verificationType: validatedData.verificationType,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Engineer registration error:', error)
    return NextResponse.json(
      { error: '登録中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
