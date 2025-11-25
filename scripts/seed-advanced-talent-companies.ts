import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// 日本の企業名のサンプル（高度人材企業向け）
const companyPrefixes = [
  'グローバル', 'インターナショナル', 'ワールドワイド', 'アジア',
  'テクノロジー', 'イノベーション', 'アドバンス', 'フューチャー',
  'プロフェッショナル', 'エクセレント', 'プレミアム', 'エリート',
  '先進', '国際', '総合', '最先端'
]

const companySuffixes = [
  'システムズ', 'ソリューションズ', 'テクノロジー', 'コンサルティング',
  'エンタープライズ', 'インダストリーズ', 'グループ', 'ホールディングス',
  'コーポレーション', 'ワークス', 'ラボ', 'スタジオ'
]

const industries = [
  'IT・通信', '金融', '製造', '商社', 'コンサルティング',
  '医療・福祉', 'エンターテイメント', '教育', '不動産', 'メディア'
]

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function main() {
  console.log('🚀 Starting advanced talent companies seed process...')

  // パスワードのハッシュ化
  const passwordHash = await hash('password123', 10)

  console.log('🏢 Creating 100 advanced talent companies...')
  const companies = []

  for (let i = 0; i < 100; i++) {
    const companyName = `${randomChoice(companyPrefixes)}${randomChoice(companySuffixes)}${i + 1}`
    const email = `advanced-company${i + 1}@example.com`

    try {
      // ユーザーを作成
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: 'COMPANY',
        }
      })

      // 高度人材企業を作成
      const company = await prisma.company.create({
        data: {
          userId: user.id,
          name: companyName,
          industry: randomChoice(industries),
          website: `https://www.${companyName.replace(/\s+/g, '').toLowerCase()}.com`,
          employeeCount: randomInt(100, 5000), // 大規模企業
          description: `${companyName}は、高度な専門性を持つ人材を積極的に採用している企業です。グローバルな視点でビジネスを展開し、優秀な外国人材の活躍を支援しています。`,
          isITCompany: true, // 高度人材企業はIT企業とする
          supportsAdvancedTalentPoints: true, // 高度人材加点制度対応
          subscriptionPlan: 'BASIC', // 有料プラン
          subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1年後
        }
      })

      companies.push(company)

      if ((i + 1) % 20 === 0) {
        console.log(`  Created ${i + 1} advanced talent companies...`)
      }
    } catch (error) {
      console.error(`Error creating company ${i + 1}:`, error)
    }
  }

  console.log(`✅ Created ${companies.length} advanced talent companies`)

  console.log('\n✨ Seed completed successfully!')
  console.log('📊 Summary:')
  console.log(`  - Advanced Talent Companies: ${companies.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
