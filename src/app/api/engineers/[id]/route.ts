import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET - Get single engineer details
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get company info
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const engineer = await prisma.engineer.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        skills: {
          include: {
            skill: true,
          },
          orderBy: {
            level: 'desc',
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
    })

    if (!engineer) {
      return NextResponse.json(
        { error: 'Engineer not found' },
        { status: 404 }
      )
    }

    // Check if company has permission to view contact info
    // Permission granted if:
    // 1. Engineer has applied to company's jobs, OR
    // 2. Company has sent scout email to engineer
    const hasApplication = await prisma.application.findFirst({
      where: {
        engineerId: engineer.id,
        job: {
          companyId: user.company.id,
        },
      },
    })

    const hasScoutEmail = await prisma.scoutEmail.findFirst({
      where: {
        engineerId: engineer.id,
        companyId: user.company.id,
        isReplied: true,  // 応募者が返信している必要がある
      },
    })

    const hasContactPermission = !!(hasApplication || hasScoutEmail)

    // If no permission, hide contact info
    const responseData = {
      ...engineer,
      hasContactPermission,
      user: {
        email: hasContactPermission ? engineer.user.email : null,
      },
      phoneNumber: hasContactPermission ? engineer.phoneNumber : null,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error fetching engineer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch engineer' },
      { status: 500 }
    )
  }
}
