import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5分間キャッシュ

export async function GET() {
  try {
    // Get counts in parallel
    const [companyCount, engineerCount, applicationCount] = await Promise.all([
      prisma.company.count(),
      prisma.engineer.count(),
      prisma.application.count({
        where: {
          status: {
            in: ['ACCEPTED', 'INTERVIEW']
          }
        }
      })
    ])

    // Check thresholds
    const shouldShowStats = companyCount >= 500 && engineerCount >= 1000 && applicationCount >= 1000

    const response = NextResponse.json({
      companyCount,
      engineerCount,
      matchingCount: applicationCount,
      satisfactionRate: 95,
      shouldShowStats
    })

    // 5分間キャッシュ
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')

    return response
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
