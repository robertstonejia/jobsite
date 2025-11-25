import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET - Get engineer skills
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'ENGINEER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: {
        engineer: {
          include: {
            skills: {
              include: {
                skill: true,
              },
              orderBy: {
                skill: {
                  name: 'asc',
                },
              },
            },
          },
        },
      },
    })

    if (!user?.engineer) {
      return NextResponse.json({ error: 'Engineer profile not found' }, { status: 404 })
    }

    return NextResponse.json(user.engineer.skills)
  } catch (error) {
    console.error('Error fetching engineer skills:', error)
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    )
  }
}

// PUT - Update engineer skills
const updateSkillsSchema = z.object({
  skills: z.array(
    z.object({
      skillId: z.string(),
      level: z.number().int().min(1).max(5),
      yearsUsed: z.number().int().min(0).optional(),
    })
  ),
})

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'ENGINEER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = updateSkillsSchema.parse(body)

    // Get engineer
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { engineer: true },
    })

    if (!user?.engineer) {
      return NextResponse.json({ error: 'Engineer profile not found' }, { status: 404 })
    }

    // Delete all existing skills
    await prisma.engineerSkill.deleteMany({
      where: { engineerId: user.engineer.id },
    })

    // Create new skills
    if (validatedData.skills.length > 0) {
      await prisma.engineerSkill.createMany({
        data: validatedData.skills.map((skill) => ({
          engineerId: user.engineer!.id,
          skillId: skill.skillId,
          level: skill.level,
          yearsUsed: skill.yearsUsed || null,
        })),
      })
    }

    // Fetch updated skills
    const updatedEngineer = await prisma.engineer.findUnique({
      where: { id: user.engineer.id },
      include: {
        skills: {
          include: {
            skill: true,
          },
          orderBy: {
            skill: {
              name: 'asc',
            },
          },
        },
      },
    })

    return NextResponse.json(updatedEngineer?.skills || [])
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error updating engineer skills:', error)
    return NextResponse.json(
      { error: 'Failed to update skills' },
      { status: 500 }
    )
  }
}
