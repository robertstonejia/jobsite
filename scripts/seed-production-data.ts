import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// 日本の会社名プレフィックス
const companyPrefixes = [
  '株式会社', '有限会社', '合同会社', ''
]

// 会社名のパターン
const companyNames = [
  'テックソリューションズ', 'システムズ', 'イノベーション', 'デジタルワークス',
  'クラウドテック', 'ソフトウェア開発', 'ITサービス', 'データサイエンス',
  'AIラボ', 'ウェブクリエイト', 'モバイルテック', 'セキュリティ',
  'ネットワークス', 'インフラ', 'コンサルティング', 'ソリューション',
  'エンジニアリング', 'プロダクツ', 'サービス', 'テクノロジー',
  'ラボラトリー', 'リサーチ', 'デベロップメント', 'クリエイティブ',
  'プランニング', 'マネジメント', 'パートナーズ', 'グループ',
  'ホールディングス', 'ジャパン', 'インターナショナル', 'グローバル',
  'フューチャー', 'ネクスト', 'スマート', 'ファースト'
]

// 地名
const locations = [
  '東京都渋谷区', '東京都新宿区', '東京都港区', '東京都千代田区', '東京都中央区',
  '東京都品川区', '東京都目黒区', '東京都世田谷区', '東京都豊島区', '東京都文京区',
  '大阪府大阪市北区', '大阪府大阪市中央区', '大阪府大阪市淀川区',
  '神奈川県横浜市西区', '神奈川県横浜市中区', '神奈川県川崎市',
  '愛知県名古屋市中区', '愛知県名古屋市中村区',
  '福岡県福岡市博多区', '福岡県福岡市中央区',
  '北海道札幌市中央区', '宮城県仙台市青葉区', '広島県広島市中区'
]

// 駅名
const stations = [
  '渋谷駅', '新宿駅', '品川駅', '東京駅', '池袋駅', '六本木駅', '恵比寿駅',
  '目黒駅', '五反田駅', '大崎駅', '秋葉原駅', '神田駅', '有楽町駅',
  '大阪駅', '梅田駅', '難波駅', '心斎橋駅', '本町駅',
  '横浜駅', '川崎駅', '名古屋駅', '博多駅', '天神駅', '札幌駅', '仙台駅'
]

// 業界
const industries = [
  'IT・通信', 'Web・インターネット', 'ソフトウェア', 'SIer', 'コンサルティング',
  '金融・Fintech', 'EC・小売', '広告・マーケティング', 'ゲーム・エンタメ',
  '医療・ヘルスケア', '教育・EdTech', '人材・HR Tech', '不動産・PropTech'
]

// 技術カテゴリー
const categories = ['Java', 'C#', 'PHP', 'Ruby', 'Python', 'JavaScript', 'AWS', 'Linux', 'Go', 'Kotlin', 'その他']

// 契約形態
const contractTypes = ['業務委託', '準委任', '請負', '派遣']

// 案件タイトルテンプレート
const projectTitleTemplates = [
  '{category}エンジニア募集【{location}】',
  '【{category}】{type}開発案件',
  '{category}を使用した{type}構築',
  '【高単価】{category}エンジニア募集',
  '{category}経験者募集！{type}開発',
  '【リモート可】{category}開発案件',
  '{type}の{category}エンジニア',
  '【長期】{category}開発プロジェクト',
  '{category}×{subCategory}のハイブリッド案件',
  '【即日〜】{category}エンジニア急募'
]

const projectTypes = [
  'Webアプリケーション', 'モバイルアプリ', 'バックエンドシステム', 'API',
  '基幹システム', 'ECサイト', '管理画面', 'データ分析基盤', 'クラウド移行',
  'マイクロサービス', 'SaaS', 'AIシステム', '決済システム', 'CRM'
]

// ランダム選択ヘルパー
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 会社名生成
function generateCompanyName(index: number): string {
  const prefix = randomChoice(companyPrefixes)
  const name = randomChoice(companyNames)
  const suffix = index > 100 ? randomChoice(['', 'Japan', 'Tech', 'Lab', 'Works']) : ''
  return `${prefix}${name}${suffix}${index % 50 === 0 ? '' : ''}`
}

// 案件タイトル生成
function generateProjectTitle(category: string): string {
  const template = randomChoice(projectTitleTemplates)
  const type = randomChoice(projectTypes)
  const location = randomChoice(locations).split('区')[0] + '区'
  const subCategory = randomChoice(categories.filter(c => c !== category))

  return template
    .replace('{category}', category)
    .replace('{type}', type)
    .replace('{location}', location)
    .replace('{subCategory}', subCategory)
}

// 案件説明生成
function generateProjectDescription(category: string): string {
  const type = randomChoice(projectTypes)
  const descriptions = [
    `${type}の開発プロジェクトです。${category}を使用した開発経験のある方を募集しています。チーム開発でアジャイル手法を採用しており、最新の技術スタックで開発を進めています。`,
    `大手クライアント向けの${type}開発案件です。${category}の実務経験が必須となります。長期的な参画が可能な方を優遇します。`,
    `スタートアップ企業での${type}開発です。${category}を中心に、モダンな開発環境で自由度の高い開発ができます。裁量を持って働きたい方におすすめです。`,
    `${type}のリニューアル案件です。${category}での開発経験を活かし、既存システムの改善・新機能追加を担当していただきます。`,
    `新規${type}の立ち上げプロジェクトです。${category}エンジニアとして、設計から実装まで幅広く携わることができます。`,
  ]
  return randomChoice(descriptions)
}

// 必須スキル生成
function generateRequirements(category: string): string {
  const years = randomInt(1, 5)
  const skills = [
    `${category}での開発経験${years}年以上`,
    'チーム開発経験',
    'Git/GitHubの使用経験',
    'アジャイル開発の経験があれば尚可'
  ]

  if (category === 'Java') skills.push('Spring Boot/Spring Frameworkの経験')
  if (category === 'Python') skills.push('Django/FastAPIの経験')
  if (category === 'JavaScript') skills.push('React/Vue/Angularいずれかの経験')
  if (category === 'PHP') skills.push('Laravel/Symfonyの経験')
  if (category === 'Ruby') skills.push('Ruby on Railsの経験')
  if (category === 'AWS') skills.push('AWS認定資格保有者優遇')
  if (category === 'Go') skills.push('マイクロサービス開発経験')

  return skills.slice(0, 4).join('\n')
}

// 尚可スキル生成
function generatePreferredSkills(category: string): string {
  const skills = [
    'Docker/Kubernetesの経験',
    'CI/CD環境の構築経験',
    'クラウドサービス(AWS/GCP/Azure)の経験',
    'データベース設計の経験',
    'パフォーマンスチューニングの経験',
    '英語でのコミュニケーション能力',
    'リーダー/マネジメント経験'
  ]

  return skills.slice(0, randomInt(2, 4)).join('\n')
}

async function main() {
  console.log('🚀 本番データ生成を開始します...')
  console.log('📊 目標: 300社, 500案件')

  const hashedPassword = await bcrypt.hash('testpassword123', 10)

  // 既存の会社数を確認
  const existingCompanyCount = await prisma.company.count()
  const existingProjectCount = await prisma.projectPost.count()

  console.log(`📈 既存データ: ${existingCompanyCount}社, ${existingProjectCount}案件`)

  const companiesToCreate = Math.max(0, 300 - existingCompanyCount)
  const projectsToCreate = Math.max(0, 500 - existingProjectCount)

  console.log(`📝 作成予定: ${companiesToCreate}社, ${projectsToCreate}案件`)

  // 会社を作成
  const createdCompanies: string[] = []

  for (let i = 0; i < companiesToCreate; i++) {
    const companyName = generateCompanyName(existingCompanyCount + i + 1)
    const email = `company${existingCompanyCount + i + 1}_${Date.now()}@example.com`

    try {
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          role: 'COMPANY',
          emailVerified: true,
          company: {
            create: {
              name: companyName,
              description: `${companyName}は、${randomChoice(industries)}業界で事業を展開しています。最新技術を活用したソリューションを提供し、クライアントのDX推進をサポートしています。`,
              industry: randomChoice(industries),
              website: `https://www.example-${existingCompanyCount + i + 1}.co.jp`,
              address: randomChoice(locations),
              phoneNumber: `03-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
              employeeCount: randomInt(10, 5000),
              foundedYear: randomInt(1990, 2023),
              isTrialActive: true,
              trialStartDate: new Date(),
              trialEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180日後
              hasUsedTrial: true,
              isITCompany: true,
            }
          }
        },
        include: { company: true }
      })

      if (user.company) {
        createdCompanies.push(user.company.id)
      }

      if ((i + 1) % 50 === 0) {
        console.log(`✅ ${i + 1}/${companiesToCreate} 社作成完了`)
      }
    } catch (error) {
      console.error(`❌ 会社 ${i + 1} の作成に失敗:`, error)
    }
  }

  console.log(`\n📊 ${createdCompanies.length} 社を新規作成しました`)

  // 全会社IDを取得
  const allCompanies = await prisma.company.findMany({
    select: { id: true }
  })

  console.log(`\n📋 全会社数: ${allCompanies.length}`)

  // 案件を作成
  let createdProjects = 0

  for (let i = 0; i < projectsToCreate; i++) {
    const company = randomChoice(allCompanies)
    const category = randomChoice(categories)
    const location = randomChoice(locations)
    const station = randomChoice(stations)

    try {
      await prisma.projectPost.create({
        data: {
          companyId: company.id,
          title: generateProjectTitle(category),
          description: generateProjectDescription(category),
          requirements: generateRequirements(category),
          preferredSkills: generatePreferredSkills(category),
          monthlyRate: randomInt(40, 120) * 10000, // 40万〜120万
          workingHours: `${randomInt(140, 180)}時間/月`,
          contractType: randomChoice(contractTypes),
          interviewCount: randomInt(1, 3),
          nearestStation: station,
          paymentTerms: randomChoice(['月末締め翌月末払い', '月末締め翌々月15日払い', '月末締め翌月15日払い']),
          category,
          duration: randomChoice(['3ヶ月〜', '6ヶ月〜', '長期', '1年〜', '3ヶ月（延長可能性あり）']),
          location,
          remoteOk: Math.random() > 0.4, // 60%リモート可
          foreignNationalityOk: Math.random() > 0.7, // 30%外国籍可
          isActive: true,
        }
      })

      createdProjects++

      if ((i + 1) % 100 === 0) {
        console.log(`✅ ${i + 1}/${projectsToCreate} 案件作成完了`)
      }
    } catch (error) {
      console.error(`❌ 案件 ${i + 1} の作成に失敗:`, error)
    }
  }

  console.log(`\n🎉 完了！`)
  console.log(`📊 新規作成: ${createdCompanies.length}社, ${createdProjects}案件`)

  // 最終的なカウント
  const finalCompanyCount = await prisma.company.count()
  const finalProjectCount = await prisma.projectPost.count()

  console.log(`📈 合計: ${finalCompanyCount}社, ${finalProjectCount}案件`)
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
