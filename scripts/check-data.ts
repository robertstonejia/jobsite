import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const [companies, engineers, skills, jobs, applications, scoutEmails, projects] = await Promise.all([
    prisma.company.count(),
    prisma.engineer.count(),
    prisma.skill.count(),
    prisma.job.count(),
    prisma.application.count(),
    prisma.scoutEmail.count(),
    prisma.projectPost.count(),
  ])

  console.log('\n📊 Test Data Summary:')
  console.log('  ✅ Companies:', companies)
  console.log('  ✅ Engineers:', engineers)
  console.log('  ✅ Skills:', skills)
  console.log('  ✅ Jobs:', jobs)
  console.log('  ✅ IT Projects:', projects)
  console.log('  ✅ Applications:', applications)
  console.log('  ✅ Scout Emails:', scoutEmails)
  console.log('')

  // トライアル状態の企業数を確認
  const now = new Date()
  const trialing = await prisma.company.count({
    where: {
      isTrialActive: true,
      trialEndDate: { gt: now },
    },
  })

  const subscribed = await prisma.company.count({
    where: {
      subscriptionPlan: { not: 'FREE' },
      subscriptionExpiry: { gt: now },
    },
  })

  console.log('💳 Subscription Status:')
  console.log('  🎉 Active Trials:', trialing)
  console.log('  💰 Paid Subscriptions:', subscribed)
  console.log('')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
