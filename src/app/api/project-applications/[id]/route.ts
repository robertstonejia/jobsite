import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET - Get a single project application by ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 [Project Application GET] Starting - ID:', params.id)
    const session = await getServerSession(authOptions)

    if (!session) {
      console.log('❌ [Project Application GET] No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ [Project Application GET] Session found:', session.user.email, 'Role:', (session.user as any).role)

    const projectApplication = await prisma.projectApplication.findUnique({
      where: { id: params.id },
      include: {
        project: {
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

    if (!projectApplication) {
      console.log('❌ [Project Application GET] Project application not found in database:', params.id)
      return NextResponse.json({ error: 'Project application not found' }, { status: 404 })
    }

    console.log('✅ [Project Application GET] Project application found - ProjectID:', projectApplication.projectId, 'EngineerID:', projectApplication.engineerId, 'CompanyID:', projectApplication.project.companyId)

    // Verify access (only the company or the engineer can view)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { engineer: true, company: true },
    })

    if (!user) {
      console.log('❌ [Project Application GET] User not found:', session.user.email)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('✅ [Project Application GET] User found - Role:', user.role, 'CompanyID:', user.company?.id, 'EngineerID:', user.engineer?.id)

    const isCompanyOwner = user.role === 'COMPANY' &&
                          user.company?.id === projectApplication.project.companyId
    const isEngineerOwner = user.role === 'ENGINEER' &&
                           user.engineer?.id === projectApplication.engineerId

    console.log('🔐 [Project Application GET] Access check - IsCompanyOwner:', isCompanyOwner, 'IsEngineerOwner:', isEngineerOwner)

    if (!isCompanyOwner && !isEngineerOwner) {
      console.log('❌ [Project Application GET] Access forbidden - User does not own this project application')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('✅ [Project Application GET] Access granted - Returning project application data')
    return NextResponse.json(projectApplication)
  } catch (error) {
    console.error('❌ [Project Application GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project application' },
      { status: 500 }
    )
  }
}

// PATCH - Update project application status (company only)
const updateProjectApplicationSchema = z.object({
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
    const validatedData = updateProjectApplicationSchema.parse(body)

    // Get project application
    const projectApplication = await prisma.projectApplication.findUnique({
      where: { id: params.id },
      include: {
        project: true,
      },
    })

    if (!projectApplication) {
      return NextResponse.json({ error: 'Project application not found' }, { status: 404 })
    }

    // Verify company ownership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { company: true },
    })

    if (!user?.company || user.company.id !== projectApplication.project.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update project application
    const updatedProjectApplication = await prisma.projectApplication.update({
      where: { id: params.id },
      data: {
        status: validatedData.status,
      },
      include: {
        project: {
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

    return NextResponse.json(updatedProjectApplication)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error updating project application:', error)
    return NextResponse.json(
      { error: 'Failed to update project application' },
      { status: 500 }
    )
  }
}
