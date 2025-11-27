import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET - Get all jobs with filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const location = searchParams.get('location') || ''
    const jobType = searchParams.get('jobType') || ''
    const remoteOk = searchParams.get('remoteOk') === 'true'

    const jobs = await prisma.job.findMany({
      where: {
        isActive: true,
        AND: [
          search
            ? {
                OR: [
                  { title: { contains: search, mode: 'insensitive' } },
                  { description: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          location ? { location: { contains: location, mode: 'insensitive' } } : {},
          jobType ? { jobType: jobType as any } : {},
          remoteOk ? { remoteOk: true } : {},
        ],
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

// POST - Create a new job (company only)
const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE']),
  location: z.string().optional(),
  remoteOk: z.boolean().default(false),
  foreignNationalityOk: z.boolean().default(false),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  skillIds: z.array(z.string()).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createJobSchema.parse(body)

    // Get company
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Check subscription status or trial status
    const now = new Date()
    const hasActiveSubscription =
      user.company.subscriptionPlan !== 'FREE' &&
      user.company.subscriptionExpiry &&
      new Date(user.company.subscriptionExpiry) > now

    const hasActiveTrial =
      user.company.isTrialActive &&
      user.company.trialEndDate &&
      new Date(user.company.trialEndDate) > now

    if (!hasActiveSubscription && !hasActiveTrial) {
      return NextResponse.json(
        {
          error: '求人を投稿するには有料プランへの登録が必要です。',
          requiresPayment: true
        },
        { status: 403 }
      )
    }

    // Create job
    console.log('Creating job with data:', {
      companyId: user.company.id,
      title: validatedData.title,
      jobType: validatedData.jobType,
      remoteOk: validatedData.remoteOk,
      salaryMin: validatedData.salaryMin,
      salaryMax: validatedData.salaryMax,
    })

    const job = await prisma.job.create({
      data: {
        companyId: user.company.id,
        title: validatedData.title,
        description: validatedData.description,
        requirements: validatedData.requirements,
        benefits: validatedData.benefits,
        jobType: validatedData.jobType,
        location: validatedData.location,
        remoteOk: validatedData.remoteOk,
        foreignNationalityOk: validatedData.foreignNationalityOk,
        salaryMin: validatedData.salaryMin,
        salaryMax: validatedData.salaryMax,
        skills: validatedData.skillIds
          ? {
              create: validatedData.skillIds.map((skillId) => ({
                skillId,
                required: true,
              })),
            }
          : undefined,
      },
      include: {
        company: true,
        skills: {
          include: {
            skill: true,
          },
        },
      },
    })

    console.log('Job created successfully:', job.id)

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error creating job:', error)
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }
}
