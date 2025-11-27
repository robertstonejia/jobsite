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

    return NextResponse.json(engineer)
  } catch (error) {
    console.error('Error fetching engineer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch engineer' },
      { status: 500 }
    )
  }
}
