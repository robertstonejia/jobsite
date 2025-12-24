import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  本番環境の求人情報とIT案件情報を削除しています...\n')

  try {
    // 求人に関連するデータを削除
    console.log('📋 求人関連データを削除中...')

    // 応募情報を削除
    const deletedApplications = await prisma.application.deleteMany({})
    console.log(`  ✓ ${deletedApplications.count}件の応募情報を削除しました`)

    // 求人スキルを削除
    const deletedJobSkills = await prisma.jobSkill.deleteMany({})
    console.log(`  ✓ ${deletedJobSkills.count}件の求人スキルを削除しました`)

    // 求人を削除
    const deletedJobs = await prisma.job.deleteMany({})
    console.log(`  ✓ ${deletedJobs.count}件の求人を削除しました`)

    console.log('\n💼 IT案件関連データを削除中...')

    // IT案件の応募情報を削除
    const deletedProjectApplications = await prisma.projectApplication.deleteMany({})
    console.log(`  ✓ ${deletedProjectApplications.count}件のIT案件応募を削除しました`)

    // IT案件を削除
    const deletedProjects = await prisma.projectPost.deleteMany({})
    console.log(`  ✓ ${deletedProjects.count}件のIT案件を削除しました`)

    console.log('\n✅ すべての求人情報とIT案件情報を削除しました\n')
    console.log('📊 削除サマリー:')
    console.log(`  - 求人: ${deletedJobs.count}件`)
    console.log(`  - 応募: ${deletedApplications.count}件`)
    console.log(`  - 求人スキル: ${deletedJobSkills.count}件`)
    console.log(`  - IT案件: ${deletedProjects.count}件`)
    console.log(`  - IT案件応募: ${deletedProjectApplications.count}件`)
    console.log(`  - 合計: ${deletedJobs.count + deletedApplications.count + deletedJobSkills.count + deletedProjects.count + deletedProjectApplications.count}件\n`)

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
