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
    const [jobs, projectPosts, applications, jobCount, projectCount] = await Promise.all([
      // Get jobs with application counts (最新20件のみ)
      prisma.job.findMany({
        where: {
          companyId,
        },
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
        take: 20,
      }),

      // Get project posts (最新20件のみ)
      prisma.projectPost.findMany({
        where: {
          companyId,
        },
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
        take: 20,
      }),

      // Get applications with optimized query using _count (最新50件のみ)
      prisma.application.findMany({
        where: {
          job: {
            companyId,
          },
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          job: {
            select: {
              id: true,
              title: true,
            },
          },
          engineer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              currentPosition: true,
              yearsOfExperience: true,
            },
          },
          _count: {
            select: {
              messages: {
                where: {
                  senderType: 'ENGINEER',
                  isRead: false,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),

      // 統計用のカウント
      prisma.job.count({
        where: { companyId },
      }),

      prisma.projectPost.count({
        where: { companyId },
      }),
    ])

    // Transform applications to match expected format
    const transformedApplications = applications.map((app) => ({
      id: app.id,
      status: app.status,
      createdAt: app.createdAt,
      unreadCount: app._count.messages,
      applicationType: 'job' as const,
      job: {
        id: app.job.id,
        title: app.job.title,
      },
      engineer: {
        id: app.engineer.id,
        firstName: app.engineer.firstName,
        lastName: app.engineer.lastName,
        currentPosition: app.engineer.currentPosition,
        yearsOfExperience: app.engineer.yearsOfExperience,
      },
    }))

    // Calculate statistics
    const stats = {
      activeJobs: jobs.filter((j) => j.isActive).length,
      totalJobs: jobCount,
      totalProjects: projectCount,
      totalApplications: transformedApplications.length,
      pendingApplications: transformedApplications.filter((a) => a.status === 'PENDING').length,
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
