import { PrismaClient, UserRole, JobType, ApplicationStatus, SubscriptionPlan } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// ランダムな日付を生成
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// ランダムな要素を選択
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

// ランダムな複数要素を選択
function randomChoices<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(count, array.length))
}

const industries = [
  'IT・ソフトウェア',
  'Webサービス',
  'SIer',
  '製造業',
  '金融',
  'コンサルティング',
  '広告・マーケティング',
  'ゲーム',
  'AI・機械学習',
  'セキュリティ',
]

const employeeCounts = ['1-10人', '11-50人', '51-200人', '201-500人', '501-1000人', '1000人以上']

const skillCategories = {
  'プログラミング言語': ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Ruby', 'PHP', 'C#', 'C++', 'Rust', 'Swift', 'Kotlin'],
  'フレームワーク': ['React', 'Vue.js', 'Angular', 'Next.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'Rails', 'Laravel'],
  'データベース': ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 'Oracle', 'SQL Server'],
  'インフラ': ['AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'CircleCI'],
  'その他': ['Git', 'Linux', 'Agile', 'Scrum', 'TDD', 'CI/CD', 'GraphQL', 'REST API'],
}

const positions = [
  'フロントエンドエンジニア',
  'バックエンドエンジニア',
  'フルスタックエンジニア',
  'インフラエンジニア',
  'DevOpsエンジニア',
  'データエンジニア',
  'MLエンジニア',
  'モバイルアプリエンジニア',
  'テックリード',
  'Webディレクター',
]

const locations = [
  '東京都',
  '大阪府',
  '神奈川県',
  '愛知県',
  '福岡県',
  '北海道',
  '京都府',
  '埼玉県',
  '千葉県',
  '兵庫県',
]

const nationalities = ['日本', 'アメリカ', '中国', 'インド', 'ベトナム', 'フィリピン', '韓国', 'タイ', 'インドネシア']

const availableFromOptions = ['すぐにでも', '一か月以内', '三か月以内', '半年以内', '一年以内']

async function main() {
  console.log('🚀 Starting large-scale test data generation...')
  console.log('📊 Target: 300 companies, 3000 engineers')

  const passwordHash = await hash('password123', 12)

  // スキルを作成
  console.log('\n📝 Creating skills...')
  const allSkills = []
  for (const [category, skills] of Object.entries(skillCategories)) {
    for (const skillName of skills) {
      const skill = await prisma.skill.upsert({
        where: { name: skillName },
        update: {},
        create: {
          name: skillName,
          category,
        },
      })
      allSkills.push(skill)
    }
  }
  console.log(`✅ Created ${allSkills.length} skills`)

  // 企業を作成
  console.log('\n🏢 Creating 300 companies...')
  const companies = []
  for (let i = 1; i <= 300; i++) {
    const isITCompany = Math.random() > 0.3 // 70% IT企業
    const hasTrial = i <= 100 // 最初の100社はトライアル中
    const hasSubscription = i > 100 && i <= 250 // 101-250社はサブスクリプション有効

    const trialStartDate = hasTrial ? new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000) : null
    const trialEndDate = trialStartDate ? new Date(trialStartDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null

    const subscriptionExpiry = hasSubscription
      ? new Date(Date.now() + (30 + Math.random() * 60) * 24 * 60 * 60 * 1000)
      : null

    const user = await prisma.user.create({
      data: {
        email: `company${i}@test.com`,
        passwordHash,
        role: 'COMPANY' as UserRole,
        emailVerified: true,
        company: {
          create: {
            name: `テスト企業${i}`,
            description: `これはテスト企業${i}の説明です。優秀な人材を募集しています。`,
            industry: randomChoice(industries),
            website: `https://company${i}.example.com`,
            address: randomChoice(locations),
            phoneNumber: `03-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
            employeeCount: randomChoice([10, 50, 100, 200, 500, 1000]),
            foundedYear: 1990 + Math.floor(Math.random() * 34),
            isITCompany,
            subscriptionPlan: hasSubscription ? 'BASIC' as SubscriptionPlan : 'FREE' as SubscriptionPlan,
            subscriptionExpiry,
            trialStartDate,
            trialEndDate,
            isTrialActive: hasTrial && trialEndDate && trialEndDate > new Date(),
            hasUsedTrial: hasTrial,
            hasScoutAccess: hasSubscription || (hasTrial && Math.random() > 0.5),
            scoutAccessExpiry: hasSubscription ? subscriptionExpiry : null,
          },
        },
      },
      include: { company: true },
    })

    companies.push(user.company!)
    if (i % 50 === 0) {
      console.log(`  Created ${i}/300 companies...`)
    }
  }
  console.log(`✅ Created ${companies.length} companies`)

  // エンジニアを作成
  console.log('\n👨‍💻 Creating 3000 engineers...')
  const engineers = []
  for (let i = 1; i <= 3000; i++) {
    const nationality = randomChoice(nationalities)
    const isJapanese = nationality === '日本'

    const user = await prisma.user.create({
      data: {
        email: `engineer${i}@test.com`,
        passwordHash,
        role: 'ENGINEER' as UserRole,
        emailVerified: true,
        engineer: {
          create: {
            firstName: `太郎${i}`,
            lastName: `山田`,
            displayName: `エンジニア${i}`,
            birthDate: randomDate(new Date(1985, 0, 1), new Date(2000, 0, 1)),
            phoneNumber: `090-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
            address: randomChoice(locations),
            nearestStation: `駅${Math.floor(Math.random() * 100)}`,
            bio: `エンジニア${i}です。${randomChoice(positions)}として働いています。`,
            gender: randomChoice(['男性', '女性', 'その他']),
            nationality,
            residenceStatus: !isJapanese ? randomChoice(['技術・人文知識・国際業務', '永住者', '定住者', '特定技能']) : null,
            residenceExpiry: !isJapanese ? new Date(Date.now() + Math.random() * 365 * 3 * 24 * 60 * 60 * 1000) : null,
            yearsOfExperience: Math.floor(Math.random() * 15) + 1,
            currentPosition: randomChoice(positions),
            desiredPosition: randomChoice(positions),
            desiredSalaryMin: 400 + Math.floor(Math.random() * 400),
            desiredSalaryMax: 600 + Math.floor(Math.random() * 600),
            availableFrom: randomChoice(availableFromOptions),
            isITEngineer: true,
            githubUrl: Math.random() > 0.5 ? `https://github.com/engineer${i}` : null,
            linkedinUrl: Math.random() > 0.7 ? `https://linkedin.com/in/engineer${i}` : null,
          },
        },
      },
      include: { engineer: true },
    })

    // スキルを追加
    const engineerSkillCount = 3 + Math.floor(Math.random() * 5)
    const selectedSkills = randomChoices(allSkills, engineerSkillCount)
    for (const skill of selectedSkills) {
      await prisma.engineerSkill.create({
        data: {
          engineerId: user.engineer!.id,
          skillId: skill.id,
          level: 1 + Math.floor(Math.random() * 5),
          yearsUsed: Math.floor(Math.random() * 10),
        },
      })
    }

    // 職歴を追加 (1-3件)
    const experienceCount = 1 + Math.floor(Math.random() * 3)
    for (let j = 0; j < experienceCount; j++) {
      const startDate = randomDate(new Date(2010, 0, 1), new Date(2020, 0, 1))
      const endDate = j === 0 ? null : randomDate(startDate, new Date())

      await prisma.experience.create({
        data: {
          engineerId: user.engineer!.id,
          companyName: `株式会社サンプル${j + 1}`,
          position: randomChoice(positions),
          description: `${randomChoice(positions)}として従事しました。`,
          startDate,
          endDate,
          isCurrent: j === 0,
        },
      })
    }

    // 学歴を追加
    await prisma.education.create({
      data: {
        engineerId: user.engineer!.id,
        schoolName: `${randomChoice(['東京', '大阪', '京都', '名古屋'])}${randomChoice(['大学', '工業大学', '理科大学'])}`,
        degree: randomChoice(['学士', '修士', '博士']),
        fieldOfStudy: randomChoice(['情報工学', 'コンピュータサイエンス', '電気工学', '数学']),
        startDate: new Date(2010, 3, 1),
        endDate: new Date(2014, 2, 31),
        isCurrent: false,
      },
    })

    engineers.push(user.engineer!)
    if (i % 500 === 0) {
      console.log(`  Created ${i}/3000 engineers...`)
    }
  }
  console.log(`✅ Created ${engineers.length} engineers`)

  // 求人を作成
  console.log('\n💼 Creating jobs...')
  let jobCount = 0
  for (const company of companies.slice(0, 200)) { // 最初の200社が求人投稿
    const jobsPerCompany = 1 + Math.floor(Math.random() * 3)
    for (let j = 0; j < jobsPerCompany; j++) {
      const selectedSkills = randomChoices(allSkills, 3 + Math.floor(Math.random() * 4))

      const job = await prisma.job.create({
        data: {
          companyId: company.id,
          title: `${randomChoice(positions)} - ${company.name}`,
          description: `${randomChoice(positions)}を募集しています。`,
          requirements: '要件: 実務経験3年以上',
          benefits: '福利厚生: 社会保険完備、リモートワーク可',
          jobType: randomChoice(['FULL_TIME', 'CONTRACT', 'FREELANCE'] as JobType[]),
          location: randomChoice(locations),
          remoteOk: Math.random() > 0.5,
          foreignNationalityOk: Math.random() > 0.6,
          salaryMin: 400 + Math.floor(Math.random() * 300),
          salaryMax: 600 + Math.floor(Math.random() * 600),
          isActive: Math.random() > 0.2,
          viewCount: Math.floor(Math.random() * 1000),
          createdAt: randomDate(new Date(2024, 0, 1), new Date()),
          skills: {
            create: selectedSkills.map(skill => ({
              skillId: skill.id,
              required: Math.random() > 0.3,
              level: 1 + Math.floor(Math.random() * 5),
            })),
          },
        },
      })
      jobCount++
    }
  }
  console.log(`✅ Created ${jobCount} jobs`)

  // IT案件を作成
  console.log('\n📋 Creating IT projects...')
  let projectCount = 0
  for (const company of companies.slice(0, 150)) { // IT企業が案件投稿
    if (!company.isITCompany) continue

    const projectsPerCompany = Math.floor(Math.random() * 3)
    for (let j = 0; j < projectsPerCompany; j++) {
      await prisma.projectPost.create({
        data: {
          companyId: company.id,
          title: `${randomChoice(['Java', 'Python', 'PHP', 'Go', 'Ruby'])}案件 - ${company.name}`,
          description: `${randomChoice(positions)}を募集中です。`,
          requirements: '必須スキル: 実務経験2年以上',
          preferredSkills: '尚可: クラウド経験',
          monthlyRate: 50 + Math.floor(Math.random() * 80),
          workingHours: '160-180時間/月',
          contractType: randomChoice(['業務委託', '準委任', '請負']),
          interviewCount: 1 + Math.floor(Math.random() * 3),
          nearestStation: `${randomChoice(locations)}駅`,
          paymentTerms: '月末締め翌月末払い',
          category: randomChoice(['Java', 'PHP', 'Ruby', 'Python', 'Go', 'AWS', 'Linux']),
          duration: randomChoice(['3ヶ月', '6ヶ月', '1年', '長期']),
          location: randomChoice(locations),
          remoteOk: Math.random() > 0.5,
          foreignNationalityOk: Math.random() > 0.7,
          isActive: Math.random() > 0.2,
          createdAt: randomDate(new Date(2024, 0, 1), new Date()),
        },
      })
      projectCount++
    }
  }
  console.log(`✅ Created ${projectCount} IT projects`)

  // 応募を作成
  console.log('\n📬 Creating applications...')
  const jobs = await prisma.job.findMany({ where: { isActive: true }, take: 300 })
  let applicationCount = 0

  for (const job of jobs) {
    const applicantCount = Math.floor(Math.random() * 15)
    const selectedEngineers = randomChoices(engineers, applicantCount)

    for (const engineer of selectedEngineers) {
      try {
        await prisma.application.create({
          data: {
            jobId: job.id,
            engineerId: engineer.id,
            status: randomChoice(['PENDING', 'REVIEWED', 'INTERVIEW', 'ACCEPTED', 'REJECTED'] as ApplicationStatus[]),
            coverLetter: `${job.title}に応募します。よろしくお願いします。`,
            createdAt: randomDate(new Date(2024, 0, 1), new Date()),
          },
        })
        applicationCount++
      } catch (e) {
        // 重複スキップ
      }
    }
  }
  console.log(`✅ Created ${applicationCount} applications`)

  // スカウトメールを作成
  console.log('\n📧 Creating scout emails...')
  let scoutCount = 0
  for (const company of companies.slice(0, 100)) {
    if (!company.hasScoutAccess) continue

    const scoutRecipients = randomChoices(engineers, 5 + Math.floor(Math.random() * 10))
    for (const engineer of scoutRecipients) {
      await prisma.scoutEmail.create({
        data: {
          companyId: company.id,
          engineerId: engineer.id,
          subject: `${company.name}からスカウトのご案内`,
          content: `あなたのスキルに興味を持ちました。ぜひ一度お話しさせてください。`,
          matchScore: 50 + Math.floor(Math.random() * 50),
          isRead: Math.random() > 0.5,
          isReplied: Math.random() > 0.7,
          createdAt: randomDate(new Date(2024, 0, 1), new Date()),
        },
      })
      scoutCount++
    }
  }
  console.log(`✅ Created ${scoutCount} scout emails`)

  console.log('\n🎉 Test data generation completed!')
  console.log(`
📊 Summary:
  - Companies: ${companies.length}
  - Engineers: ${engineers.length}
  - Skills: ${allSkills.length}
  - Jobs: ${jobCount}
  - IT Projects: ${projectCount}
  - Applications: ${applicationCount}
  - Scout Emails: ${scoutCount}
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
