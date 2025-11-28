import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET - Get all company dashboard data in one request
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Get company profile with user relation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        company: {
          select: {
            id: true,
            name: true,
            description: true,
            subscriptionPlan: true,
            subscriptionExpiry: true,
            trialStartDate: true,
            trialEndDate: true,
            isTrialActive: true,
            hasUsedTrial: true,
          },
        },
      },
    })

    if (!user?.company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const companyId = user.company.id

    // Fetch all data in parallel with optimized queries
    const [jobs, projectPosts, applications] = await Promise.all([
      // Get jobs with application counts
      prisma.job.findMany({
        where: { companyId },
        select: {
          id: true,
          title: true,
          description: true,
          jobType: true,
          location: true,
          isActive: true,
          viewCount: true,
          createdAt: true,
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Get project posts
      prisma.projectPost.findMany({
        where: { companyId },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          monthlyRate: true,
          location: true,
          remoteOk: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Get applications with unread message counts
      prisma.$queryRaw`
        SELECT
          a.id,
          a.status,
          a."jobId",
          a."createdAt",
          j.title as "jobTitle",
          e.id as "engineerId",
          e."firstName",
          e."lastName",
          e."currentPosition",
          e."yearsOfExperience",
          COALESCE(
            (SELECT COUNT(*)::int
             FROM messages m
             WHERE m."applicationId" = a.id
               AND m."senderType" = 'ENGINEER'
               AND m."isRead" = false
            ),
            0
          ) as "unreadCount"
        FROM applications a
        INNER JOIN jobs j ON a."jobId" = j.id
        INNER JOIN engineers e ON a."engineerId" = e.id
        WHERE j."companyId" = ${companyId}
        ORDER BY a."createdAt" DESC
      ` as Promise<any[]>,
    ])

    // Transform applications to match expected format
    const transformedApplications = applications.map((app: any) => ({
      id: app.id,
      status: app.status,
      createdAt: app.createdAt,
      unreadCount: app.unreadCount || 0,
      applicationType: 'job',
      job: {
        id: app.jobId,
        title: app.jobTitle,
      },
      engineer: {
        id: app.engineerId,
        firstName: app.firstName,
        lastName: app.lastName,
        currentPosition: app.currentPosition,
        yearsOfExperience: app.yearsOfExperience,
      },
    }))

    // Calculate statistics
    const stats = {
      activeJobs: jobs.filter((j) => j.isActive).length,
      totalJobs: jobs.length,
      totalProjects: projectPosts.length,
      totalApplications: transformedApplications.length,
      pendingApplications: transformedApplications.filter((a: any) => a.status === 'PENDING').length,
    }

    // Calculate subscription info
    const now = new Date()
    const expiry = user.company.subscriptionExpiry ? new Date(user.company.subscriptionExpiry) : null
    const isSubscriptionActive = user.company.subscriptionPlan !== 'FREE' && expiry && expiry > now

    const trialEndDate = user.company.trialEndDate ? new Date(user.company.trialEndDate) : null
    const isTrialActive = user.company.isTrialActive && trialEndDate && trialEndDate > now

    const canAccessFeatures = isSubscriptionActive || isTrialActive

    const subscriptionInfo = {
      plan: user.company.subscriptionPlan,
      expiry: user.company.subscriptionExpiry,
      isActive: isSubscriptionActive,
      trialStatus: {
        isActive: isTrialActive,
        hasExpired: user.company.hasUsedTrial && !isTrialActive,
        trialEndDate: user.company.trialEndDate,
      },
      canAccessFeatures,
    }

    return NextResponse.json(
      {
        company: user.company,
        jobs,
        projects: projectPosts,
        applications: transformedApplications,
        stats,
        subscriptionInfo,
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
