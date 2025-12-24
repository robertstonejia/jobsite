import { PrismaClient, JobType } from '@prisma/client'

const prisma = new PrismaClient()

// 職種タイトル
const jobTitles = [
  'フロントエンドエンジニア',
  'バックエンドエンジニア',
  'フルスタックエンジニア',
  'インフラエンジニア',
  'SREエンジニア',
  'データエンジニア',
  'データサイエンティスト',
  'MLエンジニア',
  'iOSエンジニア',
  'Androidエンジニア',
  'モバイルエンジニア',
  'QAエンジニア',
  'テストエンジニア',
  'セキュリティエンジニア',
  'DevOpsエンジニア',
  'クラウドエンジニア',
  'ネットワークエンジニア',
  'システムエンジニア',
  'プロジェクトマネージャー',
  'テックリード',
  'エンジニアリングマネージャー',
  'CTO候補',
  'VPoE候補',
  'Webエンジニア',
  'サーバーサイドエンジニア',
]

// 会社の特徴
const companyFeatures = [
  '急成長スタートアップ',
  '上場企業',
  'メガベンチャー',
  '外資系企業',
  '自社サービス開発',
  'SaaS企業',
  'Fintech企業',
  'ヘルステック企業',
  'EdTech企業',
  'EC企業',
  'ゲーム会社',
  'AI/ML企業',
]

// 地域
const locations = [
  '東京都渋谷区', '東京都新宿区', '東京都港区', '東京都千代田区', '東京都中央区',
  '東京都品川区', '東京都目黒区', '東京都世田谷区', '東京都豊島区', '東京都文京区',
  '大阪府大阪市北区', '大阪府大阪市中央区', '大阪府大阪市淀川区',
  '神奈川県横浜市西区', '神奈川県横浜市中区', '神奈川県川崎市',
  '愛知県名古屋市中区', '愛知県名古屋市中村区',
  '福岡県福岡市博多区', '福岡県福岡市中央区',
  '北海道札幌市中央区', '宮城県仙台市青葉区', '広島県広島市中区',
  'フルリモート', '全国（リモート勤務）',
]

// 技術スタック
const techStacks = [
  'React, TypeScript, Next.js',
  'Vue.js, Nuxt.js, TypeScript',
  'Angular, RxJS, TypeScript',
  'Node.js, Express, MongoDB',
  'Python, Django, PostgreSQL',
  'Python, FastAPI, MySQL',
  'Ruby on Rails, PostgreSQL',
  'Go, gRPC, Kubernetes',
  'Java, Spring Boot, AWS',
  'Kotlin, Spring Boot, GCP',
  'PHP, Laravel, MySQL',
  'Scala, Akka, Spark',
  'Rust, WebAssembly',
  'Swift, iOS, Firebase',
  'Kotlin, Android, Firebase',
  'Flutter, Dart, Firebase',
  'React Native, TypeScript',
  'AWS, Terraform, Docker',
  'GCP, Kubernetes, Istio',
  'Azure, .NET Core, C#',
]

// 福利厚生
const benefits = [
  '完全週休2日制（土日祝）',
  'フレックスタイム制',
  'リモートワーク可',
  '年間休日120日以上',
  '各種社会保険完備',
  '交通費全額支給',
  '書籍購入補助',
  'カンファレンス参加費補助',
  '資格取得支援制度',
  '副業OK',
  'ストックオプション制度',
  '401k/企業型確定拠出年金',
  '育児・介護休暇制度',
  'オフィス内カフェ/軽食無料',
  '健康診断・人間ドック',
]

const jobTypes: JobType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE']

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateJobTitle(): string {
  const title = randomChoice(jobTitles)
  const feature = randomChoice(companyFeatures)
  const prefixes = ['【急募】', '【高年収】', '【リモート可】', '【未経験歓迎】', '【経験者優遇】', '']
  const prefix = randomChoice(prefixes)
  return `${prefix}${feature}の${title}`
}

function generateDescription(title: string, techStack: string): string {
  const descriptions = [
    `当社では${title}を募集しています。\n\n【業務内容】\n・自社プロダクトの設計・開発・運用\n・新機能の企画・実装\n・コードレビュー、技術的な課題解決\n・チームメンバーとの協働\n\n【技術スタック】\n${techStack}\n\n【チーム構成】\nエンジニア${randomInt(5, 30)}名のチームで開発を行っています。\nアジャイル開発を採用し、2週間スプリントで開発を進めています。`,

    `【募集背景】\n事業拡大に伴い、開発体制を強化するため${title}を募集します。\n\n【仕事内容】\n・Webアプリケーションの設計・開発\n・APIの設計・実装\n・パフォーマンス改善・技術的負債の解消\n・新技術の調査・導入検討\n\n【開発環境】\n${techStack}\n\nモダンな技術スタックで開発を行っており、新しい技術への挑戦も歓迎します。`,

    `【会社について】\n私たちは急成長中のテクノロジーカンパニーです。\n\n【ポジションについて】\n${title}として、プロダクト開発の中核を担っていただきます。\n\n【具体的な業務】\n・${techStack}を用いた開発\n・設計からリリースまでの一連の開発プロセス\n・継続的な改善活動\n\n【働く環境】\nフルリモート勤務可能、フレックスタイム制を導入しています。`,
  ]
  return randomChoice(descriptions)
}

function generateRequirements(): string {
  const years = randomInt(1, 7)
  const requirements = [
    `・Webアプリケーション開発経験${years}年以上`,
    '・Git/GitHubを用いたチーム開発経験',
    '・基本的なSQL操作の理解',
    '・自ら課題を発見し、解決に向けて行動できる方',
    '・チームでのコミュニケーションを大切にできる方',
  ]
  return requirements.join('\n')
}

function generateBenefits(): string {
  const shuffled = [...benefits].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, randomInt(6, 10)).map(b => `・${b}`).join('\n')
}

async function main() {
  console.log('🚀 求人データ生成を開始します...')
  console.log('📊 目標: 2000件の求人')

  // 既存の求人数を確認
  const existingJobCount = await prisma.job.count()
  console.log(`📈 既存データ: ${existingJobCount}件`)

  const jobsToCreate = Math.max(0, 2000 - existingJobCount)
  console.log(`📝 作成予定: ${jobsToCreate}件`)

  if (jobsToCreate === 0) {
    console.log('✅ 既に2000件以上の求人があります')
    return
  }

  // 全会社IDを取得
  const allCompanies = await prisma.company.findMany({
    select: { id: true }
  })

  if (allCompanies.length === 0) {
    console.error('❌ 会社データがありません。先に会社を作成してください。')
    return
  }

  console.log(`📋 会社数: ${allCompanies.length}`)

  let createdJobs = 0
  const batchSize = 100

  for (let i = 0; i < jobsToCreate; i += batchSize) {
    const batch = []
    const currentBatchSize = Math.min(batchSize, jobsToCreate - i)

    for (let j = 0; j < currentBatchSize; j++) {
      const company = randomChoice(allCompanies)
      const techStack = randomChoice(techStacks)
      const title = generateJobTitle()
      const location = randomChoice(locations)
      const isRemote = location.includes('リモート') || Math.random() > 0.5

      const salaryMin = randomInt(300, 800) * 10000 // 300万〜800万
      const salaryMax = salaryMin + randomInt(100, 400) * 10000 // +100万〜400万

      batch.push({
        companyId: company.id,
        title,
        description: generateDescription(title, techStack),
        requirements: generateRequirements(),
        benefits: generateBenefits(),
        jobType: randomChoice(jobTypes),
        location,
        remoteOk: isRemote,
        foreignNationalityOk: Math.random() > 0.7,
        salaryMin,
        salaryMax,
        isActive: true,
        viewCount: randomInt(0, 500),
      })
    }

    try {
      await prisma.job.createMany({
        data: batch,
      })
      createdJobs += currentBatchSize

      if ((i + currentBatchSize) % 500 === 0 || i + currentBatchSize === jobsToCreate) {
        console.log(`✅ ${i + currentBatchSize}/${jobsToCreate} 件作成完了`)
      }
    } catch (error) {
      console.error(`❌ バッチ ${i}-${i + currentBatchSize} の作成に失敗:`, error)
    }
  }

  console.log(`\n🎉 完了！`)
  console.log(`📊 新規作成: ${createdJobs}件`)

  // 最終的なカウント
  const finalJobCount = await prisma.job.count()
  console.log(`📈 合計: ${finalJobCount}件`)
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
