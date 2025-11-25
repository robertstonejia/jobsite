import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET - 企業詳細情報を取得
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        jobs: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        projectPosts: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 })
  }
}
