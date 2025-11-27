import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendEmail, createVerificationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(1),
  description: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  employeeCount: z.number().int().positive().optional(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  isITCompany: z.boolean().default(true),
  supportsAdvancedTalentPoints: z.boolean().default(false),
  emailNotificationEnabled: z.boolean().default(true),
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

    // 無料トライアル期間を計算（30日間）
    const trialStartDate = new Date()
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 30)

    // Create user and company with free trial
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        role: 'COMPANY',
        company: {
          create: {
            name: validatedData.companyName,
            description: validatedData.description,
            industry: validatedData.industry,
            website: validatedData.website,
            address: validatedData.address,
            phoneNumber: validatedData.phoneNumber,
            employeeCount: validatedData.employeeCount,
            foundedYear: validatedData.foundedYear,
            isITCompany: validatedData.isITCompany,
            supportsAdvancedTalentPoints: validatedData.supportsAdvancedTalentPoints,
            emailNotificationEnabled: validatedData.emailNotificationEnabled,
            // 無料トライアルを自動開始
            trialStartDate: trialStartDate,
            trialEndDate: trialEndDate,
            isTrialActive: true,
            hasUsedTrial: true,
          },
        },
      },
      include: {
        company: true,
      },
    })

    // 検証コードを生成
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30) // 30分後に期限切れ

    // 検証コードを保存
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        email: validatedData.email,
        verificationCode,
        expiresAt,
      },
    })

    // 検証メールを送信
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?code=${verificationCode}&userId=${user.id}`

    const emailData = createVerificationEmail({
      companyName: validatedData.companyName,
      verificationCode,
      verificationUrl,
    })

    await sendEmail({
      ...emailData,
      to: validatedData.email,
    })

    return NextResponse.json(
      {
        message: '企業アカウントが正常に作成されました',
        userId: user.id,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Company registration error:', error)
    return NextResponse.json(
      { error: '登録中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
