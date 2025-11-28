import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const projectCategories = ['Java', 'C#', 'PHP', 'Ruby', 'Python', 'JavaScript', 'AWS', 'Linux', 'Go', 'Kotlin']
const contractTypes = ['業務委託', '準委任', '請負']
const locations = ['東京都港区', '東京都渋谷区', '東京都新宿区', '大阪府大阪市', '神奈川県横浜市', '愛知県名古屋市']

const projectTitles = [
  '大規模ECサイトのバックエンド開発',
  '金融システムのモダナイゼーション',
  'クラウドネイティブアプリケーション開発',
  'モバイルアプリのバックエンドAPI開発',
  'データ分析基盤の構築',
  'マイクロサービスアーキテクチャ移行',
  'DevOps環境構築・運用',
  'SaaSプロダクトの新機能開発',
  'レガシーシステムのリプレース',
  'AI・機械学習システム開発',
]

async function main() {
  console.log('🌱 IT案件テストデータを作成中...\n')

  // IT企業を取得
  const itCompanies = await prisma.company.findMany({
    where: { isITCompany: true },
    take: 50,
  })

  if (itCompanies.length === 0) {
    console.log('❌ IT企業が見つかりません')
    return
  }

  console.log(`✅ ${itCompanies.length}社のIT企業を見つけました`)

  let createdCount = 0

  // 各IT企業に2-3件の案件を作成
  for (const company of itCompanies) {
    const projectCount = Math.floor(Math.random() * 2) + 2 // 2-3件

    for (let i = 0; i < projectCount; i++) {
      const category = projectCategories[Math.floor(Math.random() * projectCategories.length)]
      const title = projectTitles[Math.floor(Math.random() * projectTitles.length)]
      const monthlyRate = (Math.floor(Math.random() * 60) + 40) * 10000 // 40-100万円

      try {
        await prisma.projectPost.create({
          data: {
            companyId: company.id,
            title: `${category} - ${title}`,
            description: `${category}を使用した${title}のプロジェクトです。最新の技術スタックを活用し、高品質なシステムを構築します。`,
            requirements: `${category}での実務経験3年以上、チーム開発経験`,
            preferredSkills: 'Git, Docker, AWS, アジャイル開発経験',
            monthlyRate,
            workingHours: '140-180時間/月',
            contractType: contractTypes[Math.floor(Math.random() * contractTypes.length)],
            interviewCount: Math.floor(Math.random() * 2) + 1,
            nearestStation: '各線主要駅',
            paymentTerms: '月末締め翌月末払い',
            category,
            duration: `${Math.floor(Math.random() * 12) + 3}ヶ月`,
            location: locations[Math.floor(Math.random() * locations.length)],
            remoteOk: Math.random() > 0.5,
            foreignNationalityOk: Math.random() > 0.7,
            isActive: true,
          },
        })

        createdCount++

        if (createdCount % 10 === 0) {
          console.log(`  作成済み: ${createdCount}件...`)
        }
      } catch (error) {
        console.error(`案件作成エラー:`, error)
      }
    }
  }

  console.log(`\n✅ ${createdCount}件のIT案件を作成しました！\n`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
