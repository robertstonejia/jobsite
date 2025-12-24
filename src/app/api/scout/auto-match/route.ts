import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { sendEmail, createScoutEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// マッチングスコアを計算する関数
function calculateMatchScore(job: any, engineer: any): number {
  let score = 0

  // スキルマッチング (最大50点)
  const jobSkillIds = job.skills.map((js: any) => js.skillId)
  const engineerSkillIds = engineer.skills.map((es: any) => es.skillId)
  const matchedSkills = jobSkillIds.filter((id: string) => engineerSkillIds.includes(id))

  if (jobSkillIds.length > 0) {
    score += (matchedSkills.length / jobSkillIds.length) * 50
  }

  // 経験年数マッチング (最大20点)
  if (engineer.yearsOfExperience) {
    if (engineer.yearsOfExperience >= 5) {
      score += 20
    } else if (engineer.yearsOfExperience >= 3) {
      score += 15
    } else if (engineer.yearsOfExperience >= 1) {
      score += 10
    }
  }

  // 給与マッチング (最大15点)
  if (job.salaryMin && engineer.desiredSalaryMin) {
    if (job.salaryMin >= engineer.desiredSalaryMin) {
      score += 15
    } else if (job.salaryMin >= engineer.desiredSalaryMin * 0.8) {
      score += 10
    }
  }

  // ロケーションマッチング (最大15点)
  if (job.remoteOk) {
    score += 15
  } else if (job.location && engineer.address) {
    if (engineer.address.includes(job.location) || job.location.includes(engineer.address)) {
      score += 15
    }
  }

  return Math.round(score)
}

// POST - 自動マッチングを実行してスカウトメールを送信
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobId, minScore = 60 } = await req.json()

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true },
    })

    if (!user?.company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get job with skills
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
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

    if (job.companyId !== user.company.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 求人に必要なスキルIDを取得
    const jobSkillIds = job.skills.map((js) => js.skillId)

    // 既にスカウト済みのエンジニアIDを一括取得（N+1問題を回避）
    const existingScouts = await prisma.scoutEmail.findMany({
      where: {
        companyId: user.company.id,
        jobId: job.id,
      },
      select: {
        engineerId: true,
      },
    })
    const scoutedEngineerIds = new Set(existingScouts.map((s) => s.engineerId))

    // スキルでフィルタリングしたエンジニアのみを取得（パフォーマンス改善）
    // メール認証済みのエンジニアのみ
    const engineers = await prisma.engineer.findMany({
      where: {
        user: {
          emailVerified: true,
        },
        // 求人のスキルを少なくとも1つ持つエンジニアのみ
        ...(jobSkillIds.length > 0
          ? {
              skills: {
                some: {
                  skillId: {
                    in: jobSkillIds,
                  },
                },
              },
            }
          : {}),
        // 既にスカウト済みのエンジニアは除外
        id: {
          notIn: Array.from(scoutedEngineerIds),
        },
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
      },
      take: 100, // 一度に最大100件まで処理
    })

    // Calculate match scores and filter
    const matches = engineers
      .map((engineer) => ({
        engineer,
        score: calculateMatchScore(job, engineer),
      }))
      .filter((match) => match.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50) // 最大50件のスカウトメールを送信

    // Send scout emails to matched engineers
    const scoutEmails = []
    for (const match of matches) {

      const subject = `【スカウト】${user.company.name}から${job.title}のオファー`
      const content = `
こんにちは、${match.engineer.displayName || match.engineer.firstName}様

${user.company.name}の採用担当です。

あなたのスキルと経験が、弊社の「${job.title}」のポジションと高い適合性を示しています(マッチング度: ${match.score}%)。

【求人概要】
・職種: ${job.title}
・雇用形態: ${job.jobType}
${job.location ? `・勤務地: ${job.location}` : ''}
${job.remoteOk ? '・リモートワーク可能' : ''}
${job.salaryMin && job.salaryMax ? `・想定年収: ${job.salaryMin.toLocaleString()}〜${job.salaryMax.toLocaleString()}円` : ''}

詳細をご確認いただき、ご興味がございましたらぜひご応募ください。
      `.trim()

      const scoutEmail = await prisma.scoutEmail.create({
        data: {
          companyId: user.company.id,
          engineerId: match.engineer.id,
          jobId: job.id,
          subject,
          content,
          matchScore: match.score,
        },
      })

      scoutEmails.push(scoutEmail)

      // Send email notification
      if (match.engineer.user.email) {
        const engineerName =
          match.engineer.displayName || `${match.engineer.firstName} ${match.engineer.lastName}`

        const emailData = createScoutEmail({
          engineerName,
          companyName: user.company.name,
          jobTitle: job.title,
          jobUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/jobs/${job.id}`,
          message: content,
        })

        sendEmail({
          ...emailData,
          to: match.engineer.user.email,
        }).catch((error) => {
          console.error('Failed to send scout email:', error)
        })
      }
    }

    return NextResponse.json({
      message: `${scoutEmails.length}件のスカウトメールを送信しました`,
      scoutCount: scoutEmails.length,
      matches: matches.length,
    })
  } catch (error) {
    console.error('Error in auto-matching:', error)
    return NextResponse.json({ error: 'Failed to execute auto-matching' }, { status: 500 })
  }
}
