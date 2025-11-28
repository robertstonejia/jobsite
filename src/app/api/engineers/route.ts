import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const skill = searchParams.get('skill')
    const minExperience = searchParams.get('minExperience')
    const nationality = searchParams.get('nationality')
    const minAge = searchParams.get('minAge')
    const maxAge = searchParams.get('maxAge')

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

    // Add nationality filter
    if (nationality) {
      where.nationality = {
        contains: nationality,
        mode: 'insensitive',
      }
    }

    // Add age filter (based on birthDate)
    if (minAge || maxAge) {
      const now = new Date()
      where.birthDate = {}

      if (minAge) {
        // Calculate the maximum birthdate for minimum age
        const maxBirthDate = new Date(now.getFullYear() - parseInt(minAge), now.getMonth(), now.getDate())
        where.birthDate.lte = maxBirthDate
      }

      if (maxAge) {
        // Calculate the minimum birthdate for maximum age
        const minBirthDate = new Date(now.getFullYear() - parseInt(maxAge) - 1, now.getMonth(), now.getDate())
        where.birthDate.gte = minBirthDate
      }
    }

    const engineers = await prisma.engineer.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        currentPosition: true,
        yearsOfExperience: true,
        desiredSalaryMin: true,
        desiredSalaryMax: true,
        nationality: true,
        birthDate: true,
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
