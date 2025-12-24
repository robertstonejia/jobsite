import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// POST - IT案件情報を投稿 (IT企業のみ、1日5件まで)
const createProjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  requirements: z.string().optional(),
  preferredSkills: z.string().optional(),
  monthlyRate: z.number().int().positive().optional(),
  workingHours: z.string().optional(),
  contractType: z.string().optional(),
  interviewCount: z.number().int().positive().optional(),
  nearestStation: z.string().optional(),
  paymentTerms: z.string().optional(),
  category: z.string().optional(),
  duration: z.string().optional(),
  location: z.string().optional(),
  remoteOk: z.boolean().default(false),
  foreignNationalityOk: z.boolean().default(false),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createProjectSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // IT企業のみ案件投稿可能
    if (!user.company.isITCompany) {
      return NextResponse.json(
        { error: 'Only IT companies can post projects' },
        { status: 403 }
      )
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
          error: 'IT案件を投稿するには有料プランへの登録が必要です。',
          requiresPayment: true
        },
        { status: 403 }
      )
    }

    // 今日の投稿数をチェック (1日5件まで)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayCount = await prisma.projectPost.count({
      where: {
        companyId: user.company.id,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    if (todayCount >= 5) {
      return NextResponse.json(
        { error: '1日の投稿上限(5件)に達しています。明日再度お試しください。' },
        { status: 429 }
      )
    }

    // 重複チェック (同じタイトルの案件が既に存在するか)
    const existingProject = await prisma.projectPost.findFirst({
      where: {
        companyId: user.company.id,
        title: validatedData.title,
        isActive: true,
      },
    })

    if (existingProject) {
      return NextResponse.json(
        { error: '同じタイトルの案件が既に投稿されています' },
        { status: 400 }
      )
    }

    // Create project post
    const project = await prisma.projectPost.create({
      data: {
        companyId: user.company.id,
        title: validatedData.title,
        description: validatedData.description,
        requirements: validatedData.requirements,
        preferredSkills: validatedData.preferredSkills,
        monthlyRate: validatedData.monthlyRate,
        workingHours: validatedData.workingHours,
        contractType: validatedData.contractType,
        interviewCount: validatedData.interviewCount,
        nearestStation: validatedData.nearestStation,
        paymentTerms: validatedData.paymentTerms,
        category: validatedData.category,
        duration: validatedData.duration,
        location: validatedData.location,
        remoteOk: validatedData.remoteOk,
        foreignNationalityOk: validatedData.foreignNationalityOk,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}

// GET - IT案件情報一覧を取得
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const location = searchParams.get('location') || ''
    const remoteOk = searchParams.get('remoteOk') === 'true'
    const companyId = searchParams.get('companyId')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause without empty objects in AND
    const whereClause: any = {
      isActive: true,
    }

    if (companyId) {
      whereClause.companyId = companyId
    }

    if (category) {
      whereClause.category = category
    }

    const andConditions: any[] = []

    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      })
    }

    if (location) {
      andConditions.push({ location: { contains: location, mode: 'insensitive' } })
    }

    if (remoteOk) {
      andConditions.push({ remoteOk: true })
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions
    }

    const [projects, total] = await Promise.all([
      prisma.projectPost.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          description: true,
          requirements: true,
          preferredSkills: true,
          monthlyRate: true,
          workingHours: true,
          contractType: true,
          interviewCount: true,
          nearestStation: true,
          paymentTerms: true,
          location: true,
          remoteOk: true,
          foreignNationalityOk: true,
          category: true,
          duration: true,
          createdAt: true,
          company: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: skip,
      }),
      prisma.projectPost.count({ where: whereClause }),
    ])

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}
