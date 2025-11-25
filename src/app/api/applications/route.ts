import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { sendEmail, createApplicationNotificationEmail } from '@/lib/email'

// POST - Create a new application (engineer only)
const createApplicationSchema = z.object({
  jobId: z.string(),
  coverLetter: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'ENGINEER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createApplicationSchema.parse(body)

    // Get engineer
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { engineer: true },
    })

    if (!user?.engineer) {
      return NextResponse.json({ error: 'Engineer not found' }, { status: 404 })
    }

    // Check if already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_engineerId: {
          jobId: validatedData.jobId,
          engineerId: user.engineer.id,
        },
      },
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: 'この求人には既に応募済みです' },
        { status: 400 }
      )
    }

    // Get job with company details
    const job = await prisma.job.findUnique({
      where: { id: validatedData.jobId },
      include: {
        company: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        jobId: validatedData.jobId,
        engineerId: user.engineer.id,
        coverLetter: validatedData.coverLetter,
      },
      include: {
        job: {
          include: {
            company: true,
          },
        },
      },
    })

    // Send email notification if enabled
    if (job.company.emailNotificationEnabled && job.company.user.email) {
      const engineerName = user.engineer.displayName ||
        `${user.engineer.firstName} ${user.engineer.lastName}`

      const emailData = createApplicationNotificationEmail({
        companyName: job.company.name,
        jobTitle: job.title,
        engineerName,
        applicationUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/company/applications/${application.id}`,
      })

      // Send email asynchronously (don't wait for it)
      sendEmail({
        ...emailData,
        to: job.company.user.email,
      }).catch((error) => {
        console.error('Failed to send application notification email:', error)
      })
    }

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error creating application:', error)
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    )
  }
}

// GET - Get applications (for both engineers and companies)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { engineer: true, company: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let applications

    if (user.role === 'ENGINEER' && user.engineer) {
      // Get applications by engineer
      applications = await prisma.application.findMany({
        where: { engineerId: user.engineer.id },
        include: {
          job: {
            include: {
              company: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else if (user.role === 'COMPANY' && user.company) {
      // Get applications for company's jobs
      applications = await prisma.application.findMany({
        where: {
          job: {
            companyId: user.company.id,
          },
        },
        include: {
          job: true,
          engineer: {
            include: {
              skills: {
                include: {
                  skill: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    return NextResponse.json(applications || [])
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}
