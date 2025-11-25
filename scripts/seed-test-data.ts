import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// 日本の名前のサンプル
const lastNames = [
  '佐藤', '鈴木', '高橋', '田中', '渡辺', '伊藤', '山本', '中村', '小林', '加藤',
  '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水',
  '山崎', '森', '池田', '橋本', '阿部', '石川', '山下', '中島', '石井', '小川'
]

const firstNames = [
  '太郎', '次郎', '三郎', '花子', '美咲', '健太', '大輔', '翔太', '陽子', '優子',
  '一郎', '和也', '拓也', '美穂', '由美', '直樹', '浩二', '智子', '真理', '恵子',
  '修', '誠', '茂', '隆', '明', '清', '勇', '正', '剛', '悟'
]

const companyNames = [
  'テクノロジー株式会社', 'システムズ', 'ソリューションズ', 'デジタル',
  'イノベーション', 'クリエイティブ', 'ビジネス', 'エンタープライズ',
  'グローバル', 'インターナショナル', 'アドバンス', 'フューチャー',
  'ネクスト', 'スマート', 'プロフェッショナル', 'エクセレント'
]

const industries = [
  'IT・通信', '金融', '製造', '商社', '小売', 'サービス', '不動産',
  'メディア', '医療・福祉', '教育', 'エンターテイメント', 'コンサルティング'
]

const jobTitles = [
  'Webエンジニア', 'フロントエンドエンジニア', 'バックエンドエンジニア',
  'フルスタックエンジニア', 'データサイエンティスト', 'AIエンジニア',
  'インフラエンジニア', 'DevOpsエンジニア', 'QAエンジニア', 'セキュリティエンジニア',
  'プロジェクトマネージャー', 'プロダクトマネージャー', 'UIUXデザイナー'
]

const skills = [
  'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js',
  'Python', 'Django', 'Flask', 'Java', 'Spring', 'Go', 'Ruby', 'Rails',
  'PHP', 'Laravel', 'C#', '.NET', 'AWS', 'Azure', 'GCP', 'Docker',
  'Kubernetes', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Git'
]

const locations = [
  '東京都', '大阪府', '神奈川県', '愛知県', '福岡県', '北海道',
  '埼玉県', '千葉県', '兵庫県', '京都府'
]

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomBoolean(): boolean {
  return Math.random() > 0.5
}

async function main() {
  console.log('🚀 Starting seed process...')

  // パスワードのハッシュ化
  const passwordHash = await hash('password123', 10)

  console.log('📊 Creating skills...')
  // スキルを作成
  const createdSkills = await Promise.all(
    skills.map(async (skillName) => {
      return await prisma.skill.upsert({
        where: { name: skillName },
        update: {},
        create: {
          name: skillName,
          category: randomChoice(['言語', 'フレームワーク', 'クラウド', 'データベース', 'ツール'])
        }
      })
    })
  )
  console.log(`✅ Created ${createdSkills.length} skills`)

  console.log('🏢 Creating 200 companies...')
  const companies = []
  for (let i = 0; i < 200; i++) {
    const companyName = `${randomChoice(companyNames)}${i + 1}`
    const email = `company${i + 1}@example.com`

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'COMPANY',
      }
    })

    const company = await prisma.company.create({
      data: {
        userId: user.id,
        name: companyName,
        industry: randomChoice(industries),
        website: `https://www.${companyName.replace(/\s+/g, '').toLowerCase()}.com`,
        employeeCount: randomInt(10, 1000), // Schema shows it's Int not String
        description: `${companyName}は、最先端の技術とサービスを提供する企業です。`,
        isITCompany: randomBoolean(),
        subscriptionPlan: randomChoice(['FREE', 'BASIC', 'BASIC', 'BASIC']), // 多くがBASIC
        subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30日後
      }
    })

    companies.push(company)

    if ((i + 1) % 50 === 0) {
      console.log(`  Created ${i + 1} companies...`)
    }
  }
  console.log(`✅ Created ${companies.length} companies`)

  console.log('👥 Creating 2000 engineers...')
  const engineers = []
  for (let i = 0; i < 2000; i++) {
    const lastName = randomChoice(lastNames)
    const firstName = randomChoice(firstNames)
    const email = `engineer${i + 1}@example.com`

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'ENGINEER',
      }
    })

    const engineer = await prisma.engineer.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        displayName: `${lastName}${firstName}`,
        phoneNumber: `090-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
        bio: `${randomInt(1, 15)}年のエンジニア経験があります。`,
        yearsOfExperience: randomInt(1, 15),
        currentPosition: randomChoice(jobTitles),
        desiredPosition: randomChoice(jobTitles),
        desiredSalaryMin: randomInt(400, 600) * 10000,
        desiredSalaryMax: randomInt(700, 1000) * 10000,
      }
    })

    // スキルを追加（3-8個ランダム）
    const numSkills = randomInt(3, 8)
    const engineerSkills = []
    const selectedSkills = [...createdSkills].sort(() => 0.5 - Math.random()).slice(0, numSkills)

    for (const skill of selectedSkills) {
      engineerSkills.push(
        prisma.engineerSkill.create({
          data: {
            engineerId: engineer.id,
            skillId: skill.id,
            level: randomInt(1, 5),
            yearsUsed: randomInt(1, 10)
          }
        })
      )
    }
    await Promise.all(engineerSkills)

    // 職務経歴を追加（1-3個）
    const numExperiences = randomInt(1, 3)
    const experiences = []
    for (let j = 0; j < numExperiences; j++) {
      const startDate = new Date(Date.now() - randomInt(365 * 5, 365 * 10) * 24 * 60 * 60 * 1000)
      const isCurrent = j === 0 && randomBoolean()

      experiences.push(
        prisma.experience.create({
          data: {
            engineerId: engineer.id,
            companyName: `株式会社${randomChoice(companyNames)}`,
            position: randomChoice(jobTitles),
            description: 'システム開発プロジェクトに参加し、設計・開発・テストを担当しました。',
            startDate,
            endDate: isCurrent ? null : new Date(startDate.getTime() + randomInt(365, 365 * 3) * 24 * 60 * 60 * 1000),
            isCurrent
          }
        })
      )
    }
    await Promise.all(experiences)

    engineers.push(engineer)

    if ((i + 1) % 200 === 0) {
      console.log(`  Created ${i + 1} engineers...`)
    }
  }
  console.log(`✅ Created ${engineers.length} engineers`)

  console.log('📝 Creating job posts...')
  const jobs = []
  // 各企業が2-5個の求人を投稿
  for (const company of companies) {
    const numJobs = randomInt(2, 5)
    for (let i = 0; i < numJobs; i++) {
      const job = await prisma.job.create({
        data: {
          companyId: company.id,
          title: randomChoice(jobTitles),
          description: '私たちと一緒に働きませんか？最新の技術を使って開発に携わることができます。',
          requirements: '実務経験2年以上、チーム開発の経験がある方',
          benefits: '在宅勤務可、フレックスタイム制、資格取得支援',
          jobType: randomChoice(['FULL_TIME', 'FULL_TIME', 'CONTRACT', 'FREELANCE']),
          location: randomChoice(locations),
          salaryMin: randomInt(400, 600) * 10000,
          salaryMax: randomInt(700, 1200) * 10000,
          isActive: randomBoolean(),
          viewCount: randomInt(0, 500)
        }
      })
      jobs.push(job)
    }
  }
  console.log(`✅ Created ${jobs.length} job posts`)

  console.log('📨 Creating applications and messages...')
  // 応募を作成（ランダムに3000-5000件）
  const numApplications = randomInt(3000, 5000)
  const applications = []

  for (let i = 0; i < numApplications; i++) {
    const engineer = randomChoice(engineers)
    const job = randomChoice(jobs)

    // 重複チェック（簡易版）
    const existing = await prisma.application.findFirst({
      where: {
        jobId: job.id,
        engineerId: engineer.id
      }
    })

    if (existing) continue

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        engineerId: engineer.id,
        status: randomChoice(['PENDING', 'PENDING', 'REVIEWED', 'INTERVIEW', 'ACCEPTED', 'REJECTED']),
        coverLetter: '貴社の求人に大変興味があり、応募させていただきました。これまでの経験を活かして貢献したいと考えております。',
      }
    })

    applications.push(application)

    // 50%の確率でメッセージを作成
    if (randomBoolean()) {
      const numMessages = randomInt(1, 5)
      for (let j = 0; j < numMessages; j++) {
        const isCompany = j % 2 === 0
        const isRead = randomBoolean()

        await prisma.message.create({
          data: {
            applicationId: application.id,
            companyId: job.companyId,
            engineerId: engineer.id,
            senderType: isCompany ? 'COMPANY' : 'ENGINEER',
            content: isCompany
              ? 'ご応募ありがとうございます。書類選考の結果、面接にお進みいただくことになりました。'
              : 'お世話になっております。面接日程について、ご相談させていただきたく存じます。',
            isRead,
          }
        })
      }
    }

    if ((i + 1) % 500 === 0) {
      console.log(`  Created ${i + 1} applications...`)
    }
  }
  console.log(`✅ Created ${applications.length} applications with messages`)

  console.log('🎯 Creating project posts (IT案件)...')
  // IT企業が案件を投稿
  const itCompanies = companies.filter(c => c.isITCompany)
  for (const company of itCompanies) {
    const numProjects = randomInt(1, 3)
    for (let i = 0; i < numProjects; i++) {
      await prisma.projectPost.create({
        data: {
          companyId: company.id,
          title: `${randomChoice(['Webアプリケーション', 'モバイルアプリ', 'システム', 'API'])}開発案件`,
          description: '経験豊富なエンジニアを募集しています。リモートワーク可能です。',
          category: randomChoice(['Java', 'PHP', 'Ruby', 'Python', 'Go', 'AWS']),
          monthlyRate: randomInt(50, 100) * 10000,
          location: randomChoice(locations),
          remoteOk: randomBoolean(),
          isActive: randomBoolean(),
        }
      })
    }
  }
  console.log(`✅ Created project posts`)

  console.log('💳 Creating payment records...')
  // 有料プランの企業に支払い記録を作成
  const paidCompanies = companies.filter(c => c.subscriptionPlan === 'BASIC')
  for (const company of paidCompanies) {
    await prisma.payment.create({
      data: {
        companyId: company.id,
        amount: 10000,
        plan: 'BASIC',
        paymentMethod: randomChoice(['credit', 'wechat', 'alipay']),
        status: 'completed',
        transactionId: `TEST_${Date.now()}_${company.id}`
      }
    })
  }
  console.log(`✅ Created payment records`)

  console.log('\n✨ Seed completed successfully!')
  console.log('📊 Summary:')
  console.log(`  - Companies: ${companies.length}`)
  console.log(`  - Engineers: ${engineers.length}`)
  console.log(`  - Job Posts: ${jobs.length}`)
  console.log(`  - Applications: ${applications.length}`)
  console.log(`  - Skills: ${createdSkills.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
