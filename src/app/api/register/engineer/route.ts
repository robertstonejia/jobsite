import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendEmail, createVerificationEmail, createPhoneVerificationEmail } from '@/lib/email'
import { sendSMS, createVerificationSMS } from '@/lib/sms'

export const dynamic = 'force-dynamic'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string().optional(), // ISO日付文字列
  gender: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  nearestStation: z.string().optional(),
  bio: z.string().optional(),
  yearsOfExperience: z.number().optional(),
  currentPosition: z.string().optional(),
  desiredPosition: z.string().optional(),
  desiredSalary: z.number().optional(),
  desiredSalaryMin: z.number().optional(),
  desiredSalaryMax: z.number().optional(),
  availableFrom: z.string().optional(), // 転職希望時期（文字列）
  isITEngineer: z.boolean().optional(),
  githubUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  verificationType: z.enum(['email', 'phone']).default('email'),
  // 職歴情報（配列）
  experiences: z.array(z.object({
    companyName: z.string().min(1),
    position: z.string().min(1),
    description: z.string().optional(),
    startDate: z.string(), // ISO日付文字列
    endDate: z.string().optional(), // ISO日付文字列
    isCurrent: z.boolean().default(false),
  })).optional(),
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
            birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : null,
            phoneNumber: validatedData.phoneNumber,
            address: validatedData.address,
            nearestStation: validatedData.nearestStation,
            bio: validatedData.bio,
            yearsOfExperience: validatedData.yearsOfExperience,
            currentPosition: validatedData.currentPosition,
            desiredPosition: validatedData.desiredPosition,
            desiredSalaryMin: validatedData.desiredSalary,
            desiredSalaryMax: validatedData.desiredSalary,
            availableFrom: validatedData.availableFrom,
            githubUrl: validatedData.githubUrl,
            linkedinUrl: validatedData.linkedinUrl,
            portfolioUrl: validatedData.portfolioUrl,
            // 職歴情報を作成
            experiences: validatedData.experiences ? {
              create: validatedData.experiences.map(exp => ({
                companyName: exp.companyName,
                position: exp.position,
                description: exp.description,
                startDate: new Date(exp.startDate),
                endDate: exp.endDate ? new Date(exp.endDate) : null,
                isCurrent: exp.isCurrent,
              })),
            } : undefined,
          },
        },
      },
      include: {
        engineer: {
          include: {
            experiences: true,
          },
        },
      },
    })

    // 検証コードを生成
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30) // 30分後に期限切れ

    const userName = `${validatedData.lastName} ${validatedData.firstName}`

    // メールまたは電話番号での検証
    // 電話番号検証は現在無効化されています
    /*
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

      // SMSで検証コードを送信
      const smsMessage = createVerificationSMS(verificationCode)
      const smsSent = await sendSMS({
        to: validatedData.phoneNumber,
        message: smsMessage,
      })

      if (!smsSent) {
        // SMSの送信に失敗した場合はメールにフォールバック
        console.warn('SMS送信に失敗しました。メールで検証コードを送信します。')
        const emailData = createPhoneVerificationEmail({
          userName,
          verificationCode,
          phoneNumber: validatedData.phoneNumber,
        })

        await sendEmail({
          ...emailData,
          to: validatedData.email,
        })
      }
    } else {
    */
    // 常にメール検証を使用
    {
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
