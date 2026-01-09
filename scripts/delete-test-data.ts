import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️ テストデータの削除を開始します...')

  // 現在のカウントを確認
  const beforeCounts = {
    jobs: await prisma.job.count(),
    projects: await prisma.projectPost.count(),
    companies: await prisma.company.count(),
    users: await prisma.user.count(),
  }

  console.log('📊 削除前のデータ:')
  console.log(`  - 求人: ${beforeCounts.jobs}件`)
  console.log(`  - IT案件: ${beforeCounts.projects}件`)
  console.log(`  - 企業: ${beforeCounts.companies}件`)
  console.log(`  - ユーザー: ${beforeCounts.users}件`)

  // テスト企業を特定（「テスト企業」で始まる名前）
  const testCompanies = await prisma.company.findMany({
    where: {
      name: {
        startsWith: 'テスト企業',
      },
    },
    select: {
      id: true,
      userId: true,
      name: true,
    },
  })

  console.log(`\n🔍 テスト企業: ${testCompanies.length}件を検出`)

  // 1. すべての求人を削除（テストデータのみ）
  console.log('\n🗑️ 求人を削除中...')
  const deletedJobs = await prisma.job.deleteMany({})
  console.log(`  ✅ ${deletedJobs.count}件の求人を削除`)

  // 2. すべてのIT案件を削除（テストデータのみ）
  console.log('\n🗑️ IT案件を削除中...')
  const deletedProjects = await prisma.projectPost.deleteMany({})
  console.log(`  ✅ ${deletedProjects.count}件のIT案件を削除`)

  // 3. テスト企業のユーザーIDを取得
  const testUserIds = testCompanies.map(c => c.userId)

  // 4. テスト企業を削除（Cascade削除でユーザーも削除される）
  if (testCompanies.length > 0) {
    console.log('\n🗑️ テスト企業とユーザーを削除中...')

    // ユーザーを削除すると、関連する企業も Cascade で削除される
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: {
          in: testUserIds,
        },
      },
    })
    console.log(`  ✅ ${deletedUsers.count}件のテスト企業/ユーザーを削除`)
  }

  // 削除後のカウントを確認
  const afterCounts = {
    jobs: await prisma.job.count(),
    projects: await prisma.projectPost.count(),
    companies: await prisma.company.count(),
    users: await prisma.user.count(),
  }

  console.log('\n📊 削除後のデータ:')
  console.log(`  - 求人: ${afterCounts.jobs}件`)
  console.log(`  - IT案件: ${afterCounts.projects}件`)
  console.log(`  - 企業: ${afterCounts.companies}件`)
  console.log(`  - ユーザー: ${afterCounts.users}件`)

  console.log('\n🎉 テストデータの削除が完了しました！')
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
