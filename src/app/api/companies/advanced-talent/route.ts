import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET - 高度人材加点制度対応企業の一覧を取得
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const industry = searchParams.get('industry') || ''

    const companies = await prisma.company.findMany({
      where: {
        supportsAdvancedTalentPoints: true,
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { description: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          industry ? { industry: { contains: industry, mode: 'insensitive' } } : {},
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        industry: true,
        logoUrl: true,
        address: true,
        employeeCount: true,
        foundedYear: true,
        website: true,
        isITCompany: true,
        jobs: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            title: true,
            jobType: true,
            location: true,
            remoteOk: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        _count: {
          select: {
            jobs: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(companies)
  } catch (error) {
    console.error('Error fetching advanced talent companies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}
