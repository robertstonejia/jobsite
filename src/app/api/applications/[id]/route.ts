import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET - Get a single application by ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        job: {
          include: {
            company: true,
          },
        },
        engineer: {
          include: {
            skills: {
              include: {
                skill: true,
              },
            },
            experiences: {
              orderBy: {
                startDate: 'desc',
              },
            },
            educations: {
              orderBy: {
                startDate: 'desc',
              },
            },
          },
        },
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Verify access (only the company or the engineer can view)
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { engineer: true, company: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isCompanyOwner = user.role === 'COMPANY' &&
                          user.company?.id === application.job.companyId
    const isEngineerOwner = user.role === 'ENGINEER' &&
                           user.engineer?.id === application.engineerId

    if (!isCompanyOwner && !isEngineerOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error('Error fetching application:', error)
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    )
  }
}

// PATCH - Update application status (company only)
const updateApplicationSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWED', 'INTERVIEW', 'ACCEPTED', 'REJECTED']),
})

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = updateApplicationSchema.parse(body)

    // Get application
    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        job: true,
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Verify company ownership
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company || user.company.id !== application.job.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update application
    const updatedApplication = await prisma.application.update({
      where: { id: params.id },
      data: {
        status: validatedData.status,
      },
      include: {
        job: {
          include: {
            company: true,
          },
        },
        engineer: {
          include: {
            skills: {
              include: {
                skill: true,
              },
            },
            experiences: {
              orderBy: {
                startDate: 'desc',
              },
            },
            educations: {
              orderBy: {
                startDate: 'desc',
              },
            },
          },
        },
      },
    })

    return NextResponse.json(updatedApplication)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error updating application:', error)
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    )
  }
}
