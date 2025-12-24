import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== テストデータ削除開始 ===\n')

  // テストユーザーのメールアドレス
  const testEngineerEmail = 'test-engineer@example.com'
  const testCompanyEmail = 'test-company@example.com'

  // 1. テスト応募者を取得
  const testEngineer = await prisma.user.findUnique({
    where: { email: testEngineerEmail },
    include: { engineer: true },
  })

  // 2. テスト企業を取得
  const testCompany = await prisma.user.findUnique({
    where: { email: testCompanyEmail },
    include: { company: true },
  })

  // 3. 関連データを削除
  if (testCompany?.company) {
    console.log('1. 企業関連データを削除中...')

    // メッセージを削除
    const deletedMessages = await prisma.message.deleteMany({
      where: { companyId: testCompany.company.id },
    })
    console.log(`   メッセージ ${deletedMessages.count} 件削除`)

    // 求人に関連する応募を削除
    const jobs = await prisma.job.findMany({
      where: { companyId: testCompany.company.id },
      select: { id: true },
    })

    for (const job of jobs) {
      await prisma.application.deleteMany({
        where: { jobId: job.id },
      })
    }
    console.log('   応募を削除')

    // 求人を削除
    const deletedJobs = await prisma.job.deleteMany({
      where: { companyId: testCompany.company.id },
    })
    console.log(`   求人 ${deletedJobs.count} 件削除`)

    // IT案件を削除
    const deletedProjects = await prisma.projectPost.deleteMany({
      where: { companyId: testCompany.company.id },
    })
    console.log(`   IT案件 ${deletedProjects.count} 件削除`)
  }

  // 4. テスト企業ユーザーを削除（Companyも一緒に削除される）
  if (testCompany) {
    console.log('\n2. テスト企業を削除中...')
    await prisma.company.deleteMany({
      where: { userId: testCompany.id },
    })
    await prisma.user.delete({
      where: { email: testCompanyEmail },
    })
    console.log(`   企業削除完了: ${testCompanyEmail}`)
  } else {
    console.log('\n2. テスト企業は存在しません')
  }

  // 5. テスト応募者ユーザーを削除（Engineerも一緒に削除される）
  if (testEngineer) {
    console.log('\n3. テスト応募者を削除中...')

    // 応募者の応募とメッセージを削除
    if (testEngineer.engineer) {
      await prisma.message.deleteMany({
        where: { engineerId: testEngineer.engineer.id },
      })
      await prisma.application.deleteMany({
        where: { engineerId: testEngineer.engineer.id },
      })
    }

    await prisma.engineer.deleteMany({
      where: { userId: testEngineer.id },
    })
    await prisma.user.delete({
      where: { email: testEngineerEmail },
    })
    console.log(`   応募者削除完了: ${testEngineerEmail}`)
  } else {
    console.log('\n3. テスト応募者は存在しません')
  }

  console.log('\n=== テストデータ削除完了 ===')
}

main()
  .catch((e) => {
    console.error('エラー:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
