import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    return NextResponse.json({
      companyCount,
      engineerCount,
      matchingCount: applicationCount,
      satisfactionRate: 95, // Fixed at 95%
      shouldShowStats
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
