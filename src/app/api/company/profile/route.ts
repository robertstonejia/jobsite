import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// GET - Get company profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company) {
      return NextResponse.json({ error: 'Company profile not found' }, { status: 404 })
    }

    return NextResponse.json(user.company)
  } catch (error) {
    console.error('Error fetching company profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT - Update company profile
const updateProfileSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  website: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  address: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  employeeCount: z.number().int().positive().nullable().optional(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).nullable().optional(),
  supportsAdvancedTalentPoints: z.boolean().optional(),
  emailNotificationEnabled: z.boolean().optional(),
  isITCompany: z.boolean().optional(),
})

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = updateProfileSchema.parse(body)

    // Get company
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company) {
      return NextResponse.json({ error: 'Company profile not found' }, { status: 404 })
    }

    // Convert empty strings to null for URL fields
    const updateData = {
      ...validatedData,
      website: validatedData.website === '' ? null : validatedData.website,
    }

    // Update company profile
    const updatedCompany = await prisma.company.update({
      where: { id: user.company.id },
      data: updateData,
    })

    return NextResponse.json(updatedCompany)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error updating company profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
