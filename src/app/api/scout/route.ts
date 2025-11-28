import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { sendEmail, createScoutEmail } from '@/lib/email'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// POST - スカウトメールを送信 (企業のみ)
const sendScoutSchema = z.object({
  engineerId: z.string().optional(),
  engineerIds: z.array(z.string()).optional(),
  jobId: z.string().optional(),
  subject: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = sendScoutSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const company = user.company

    // Check if company has active subscription or trial
    const now = new Date()
    const hasActiveSubscription =
      company.subscriptionPlan !== 'FREE' &&
      company.subscriptionExpiry &&
      company.subscriptionExpiry > now

    const hasActiveTrial =
      company.isTrialActive &&
      company.trialEndDate &&
      new Date(company.trialEndDate) > now

    if (!hasActiveSubscription && !hasActiveTrial) {
      return NextResponse.json(
        { error: 'スカウト機能を利用するには、月額会員プランへの登録が必要です' },
        { status: 403 }
      )
    }

    // Check if company has scout access
    const hasScoutAccess =
      company.hasScoutAccess &&
      company.scoutAccessExpiry &&
      company.scoutAccessExpiry > now

    if (!hasScoutAccess) {
      return NextResponse.json(
        { error: 'スカウト機能を利用するには、スカウト機能の購入が必要です' },
        { status: 403 }
      )
    }

    // Handle bulk sending
    const engineerIds = validatedData.engineerIds || (validatedData.engineerId ? [validatedData.engineerId] : [])

    if (engineerIds.length === 0) {
      return NextResponse.json({ error: 'No engineers specified' }, { status: 400 })
    }

    const messageContent = validatedData.message || validatedData.content || ''
    const subject = validatedData.subject || `${company.name}からスカウトメッセージ`

    if (!messageContent) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const results = await Promise.all(
      engineerIds.map(async (engineerId) => {
        try {
          // Get engineer details
          const engineer = await prisma.engineer.findUnique({
            where: { id: engineerId },
            include: {
              user: true,
            },
          })

          if (!engineer) {
            return { engineerId, success: false, error: 'Engineer not found' }
          }

          // Create scout email record
          const scoutEmail = await prisma.scoutEmail.create({
            data: {
              companyId: company.id,
              engineerId: engineerId,
              jobId: validatedData.jobId,
              subject: subject,
              content: messageContent,
            },
          })

          // Send email notification
          if (engineer.user.email) {
            const engineerName = engineer.displayName || `${engineer.firstName} ${engineer.lastName}`

            let jobTitle = 'ポジション'
            let jobUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/engineer`

            if (validatedData.jobId) {
              const job = await prisma.job.findUnique({
                where: { id: validatedData.jobId },
              })
              if (job) {
                jobTitle = job.title
                jobUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/jobs/${job.id}`
              }
            }

            const emailData = createScoutEmail({
              engineerName,
              companyName: company.name,
              jobTitle,
              jobUrl,
              message: messageContent,
            })

            sendEmail({
              ...emailData,
              to: engineer.user.email,
            }).catch((error) => {
              console.error('Failed to send scout email:', error)
            })
          }

          return { engineerId, success: true, scoutEmailId: scoutEmail.id }
        } catch (error) {
          console.error(`Error sending scout to engineer ${engineerId}:`, error)
          return { engineerId, success: false, error: 'Failed to send scout message' }
        }
      })
    )

    const successCount = results.filter(r => r.success).length

    return NextResponse.json({
      success: true,
      count: successCount,
      total: engineerIds.length,
      results,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error sending scout email:', error)
    return NextResponse.json({ error: 'Failed to send scout email' }, { status: 500 })
  }
}

// GET - スカウトメール一覧を取得
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: {
        company: true,
        engineer: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let scoutEmails

    if (user.company) {
      // 企業の場合: 送信したスカウトメール一覧
      scoutEmails = await prisma.scoutEmail.findMany({
        where: { companyId: user.company.id },
        include: {
          engineer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              currentPosition: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else if (user.engineer) {
      // エンジニアの場合: 受信したスカウトメール一覧
      scoutEmails = await prisma.scoutEmail.findMany({
        where: { engineerId: user.engineer.id },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    return NextResponse.json(scoutEmails || [])
  } catch (error) {
    console.error('Error fetching scout emails:', error)
    return NextResponse.json({ error: 'Failed to fetch scout emails' }, { status: 500 })
  }
}
