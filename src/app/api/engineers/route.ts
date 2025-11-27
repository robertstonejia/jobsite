import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const skill = searchParams.get('skill')
    const minExperience = searchParams.get('minExperience')

    // Build the where clause
    const where: any = {
      user: {
        emailVerified: true,
      },
    }

    // Add skill filter
    if (skill) {
      where.skills = {
        some: {
          skill: {
            name: {
              contains: skill,
              mode: 'insensitive',
            },
          },
        },
      }
    }

    // Add experience filter
    if (minExperience) {
      where.yearsOfExperience = {
        gte: parseInt(minExperience),
      }
    }

    const engineers = await prisma.engineerProfile.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        currentPosition: true,
        yearsOfExperience: true,
        desiredSalary: true,
        user: {
          select: {
            email: true,
          },
        },
        skills: {
          select: {
            level: true,
            skill: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(engineers)
  } catch (error) {
    console.error('Error fetching engineers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
