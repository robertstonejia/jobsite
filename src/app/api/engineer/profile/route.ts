import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET - Get engineer profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'ENGINEER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: {
        engineer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            birthDate: true,
            phoneNumber: true,
            nationality: true,
            residenceStatus: true,
            residenceExpiry: true,
            address: true,
            nearestStation: true,
            bio: true,
            yearsOfExperience: true,
            currentPosition: true,
            desiredPosition: true,
            desiredSalaryMin: true,
            desiredSalaryMax: true,
            availableFrom: true,
            isITEngineer: true,
            githubUrl: true,
            linkedinUrl: true,
            portfolioUrl: true,
            experiences: {
              select: {
                id: true,
                companyName: true,
                position: true,
                description: true,
                startDate: true,
                endDate: true,
                isCurrent: true,
              },
              orderBy: {
                startDate: 'desc',
              },
            },
            educations: {
              select: {
                id: true,
                schoolName: true,
                degree: true,
                fieldOfStudy: true,
                startDate: true,
                endDate: true,
                isCurrent: true,
              },
              orderBy: {
                startDate: 'desc',
              },
            },
            skills: {
              select: {
                id: true,
                level: true,
                yearsUsed: true,
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
        },
      },
    })

    if (!user?.engineer) {
      return NextResponse.json({ error: 'Engineer profile not found' }, { status: 404 })
    }

    return NextResponse.json(user.engineer)
  } catch (error) {
    console.error('Error fetching engineer profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT - Update engineer profile
const updateProfileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  displayName: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
  residenceStatus: z.string().nullable().optional(),
  residenceExpiry: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  nearestStation: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  yearsOfExperience: z.number().int().min(0).nullable().optional(),
  currentPosition: z.string().nullable().optional(),
  desiredPosition: z.string().nullable().optional(),
  desiredSalaryMin: z.number().int().min(0).nullable().optional(),
  desiredSalaryMax: z.number().int().min(0).nullable().optional(),
  availableFrom: z.string().nullable().optional(), // 転職希望時期: "すぐにでも", "一か月以内", etc.
  isITEngineer: z.boolean().optional(),
  githubUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  linkedinUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  portfolioUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
})

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'ENGINEER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    console.log('Received profile update request:', body)

    const validatedData = updateProfileSchema.parse(body)
    console.log('Validated data:', validatedData)

    // Get engineer
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { engineer: true },
    })

    if (!user?.engineer) {
      return NextResponse.json({ error: 'Engineer profile not found' }, { status: 404 })
    }

    // Convert empty strings to null for URL fields
    const updateData = {
      ...validatedData,
      githubUrl: validatedData.githubUrl === '' ? null : validatedData.githubUrl,
      linkedinUrl: validatedData.linkedinUrl === '' ? null : validatedData.linkedinUrl,
      portfolioUrl: validatedData.portfolioUrl === '' ? null : validatedData.portfolioUrl,
      birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : null,
      residenceExpiry: validatedData.residenceExpiry ? new Date(validatedData.residenceExpiry) : null,
      // availableFrom is now a string, not a DateTime
    }

    // Update engineer profile
    const updatedEngineer = await prisma.engineer.update({
      where: { id: user.engineer.id },
      data: updateData,
    })

    return NextResponse.json(updatedEngineer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error updating engineer profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
