import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: 応募済み案件一覧を取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const userRole = (session.user as any).role

    // エンジニアの場合、自分の応募を取得
    if (userRole === 'ENGINEER') {
      const engineer = await prisma.engineer.findUnique({
        where: { userId },
        select: { id: true }
      })

      if (!engineer) {
        return NextResponse.json({ error: 'エンジニアプロフィールが見つかりません' }, { status: 404 })
      }

      const applications = await prisma.projectApplication.findMany({
        where: { engineerId: engineer.id },
        include: {
          project: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json(applications)
    }

    // 企業の場合、自社案件への応募を取得
    if (userRole === 'COMPANY') {
      const company = await prisma.company.findUnique({
        where: { userId },
        select: { id: true }
      })

      if (!company) {
        return NextResponse.json({ error: '企業プロフィールが見つかりません' }, { status: 404 })
      }

      const { searchParams } = new URL(request.url)
      const projectId = searchParams.get('projectId')

      const applications = await prisma.projectApplication.findMany({
        where: {
          project: {
            companyId: company.id,
            ...(projectId ? { id: projectId } : {})
          }
        },
        include: {
          engineer: {
            include: {
              user: {
                select: {
                  email: true
                }
              }
            }
          },
          project: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json(applications)
    }

    return NextResponse.json({ error: '無効なユーザー種別です' }, { status: 403 })
  } catch (error) {
    console.error('Error fetching project applications:', error)
    return NextResponse.json(
      { error: '応募情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST: 案件に応募
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const userRole = (session.user as any).role

    // エンジニアのみ応募可能
    if (userRole !== 'ENGINEER') {
      return NextResponse.json({ error: 'エンジニアのみ応募できます' }, { status: 403 })
    }

    const engineer = await prisma.engineer.findUnique({
      where: { userId },
      select: { id: true }
    })

    if (!engineer) {
      return NextResponse.json({ error: 'エンジニアプロフィールが見つかりません' }, { status: 404 })
    }

    const body = await request.json()
    const { projectId, coverLetter } = body

    if (!projectId) {
      return NextResponse.json({ error: '案件IDが必要です' }, { status: 400 })
    }

    // 案件が存在するか確認
    const project = await prisma.projectPost.findUnique({
      where: { id: projectId, isActive: true }
    })

    if (!project) {
      return NextResponse.json({ error: '案件が見つかりません' }, { status: 404 })
    }

    // 既に応募済みかチェック
    const existingApplication = await prisma.projectApplication.findUnique({
      where: {
        projectId_engineerId: {
          projectId,
          engineerId: engineer.id
        }
      }
    })

    if (existingApplication) {
      return NextResponse.json({ error: 'この案件には既に応募済みです' }, { status: 409 })
    }

    // 応募を作成
    const application = await prisma.projectApplication.create({
      data: {
        projectId,
        engineerId: engineer.id,
        coverLetter,
        status: 'PENDING'
      },
      include: {
        project: {
          include: {
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error('Error creating project application:', error)
    return NextResponse.json(
      { error: '応募の作成に失敗しました' },
      { status: 500 }
    )
  }
}
