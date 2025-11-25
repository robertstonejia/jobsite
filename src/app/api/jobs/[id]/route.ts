import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET - Get a single job by ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            description: true,
            logoUrl: true,
            website: true,
            employeeCount: true,
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Increment view count
    await prisma.job.update({
      where: { id: params.id },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })
  }
}

// PUT - Update a job (company only)
const updateJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  requirements: z.string().nullable().optional(),
  benefits: z.string().nullable().optional(),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE']),
  location: z.string().nullable().optional(),
  remoteOk: z.boolean(),
  salaryMin: z.number().int().min(0).nullable().optional(),
  salaryMax: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean(),
  skillIds: z.array(z.string()).optional(),
})

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = updateJobSchema.parse(body)

    // Get job to verify ownership
    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: { company: true },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify company ownership
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company || user.company.id !== job.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update job
    const { skillIds, ...jobData } = validatedData

    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: {
        ...jobData,
        requirements: jobData.requirements === '' ? null : jobData.requirements,
        benefits: jobData.benefits === '' ? null : jobData.benefits,
        location: jobData.location === '' ? null : jobData.location,
      },
    })

    // Update skills if provided
    if (skillIds) {
      // Delete existing skills
      await prisma.jobSkill.deleteMany({
        where: { jobId: params.id },
      })

      // Add new skills
      if (skillIds.length > 0) {
        await prisma.jobSkill.createMany({
          data: skillIds.map((skillId) => ({
            jobId: params.id,
            skillId,
          })),
        })
      }
    }

    // Fetch updated job with skills
    const finalJob = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    })

    return NextResponse.json(finalJob)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error updating job:', error)
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
  }
}

// DELETE - Delete a job (company only)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get job to verify ownership
    const job = await prisma.job.findUnique({
      where: { id: params.id },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify company ownership
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company || user.company.id !== job.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete job (cascade will delete skills and applications)
    await prisma.job.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Job deleted successfully' })
  } catch (error) {
    console.error('Error deleting job:', error)
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
  }
}
