import { PrismaClient } from '@prisma/client'
import { checkTrialStatus, canAccessPaidFeatures, getTrialMessage } from '../src/lib/trial'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Testing Trial Features\n')

  // 1. トライアル中の企業を取得
  console.log('📋 Test 1: トライアル期間の表示とトライアル残り日数')
  console.log('='.repeat(60))

  const trialCompanies = await prisma.company.findMany({
    where: {
      isTrialActive: true,
      trialEndDate: { gt: new Date() },
    },
    take: 3,
  })

  for (const company of trialCompanies) {
    const trialStatus = checkTrialStatus(company)
    const message = getTrialMessage(company)
    const canAccess = canAccessPaidFeatures(company)

    console.log(`\n✅ Company: ${company.name}`)
    console.log(`   Trial Active: ${trialStatus.isActive}`)
    console.log(`   Days Remaining: ${trialStatus.daysRemaining}日`)
    console.log(`   Trial End Date: ${company.trialEndDate?.toLocaleDateString('ja-JP')}`)
    console.log(`   Can Access Features: ${canAccess}`)
    console.log(`   Message: ${message.message}`)
    console.log(`   Message Type: ${message.type}`)
  }

  // 2. トライアル期限切れの企業を作成してテスト
  console.log('\n\n📋 Test 2: トライアル終了後のアクセス制限')
  console.log('='.repeat(60))

  // 期限切れ企業を探す（または作成）
  let expiredCompany = await prisma.company.findFirst({
    where: {
      isTrialActive: true,
      trialEndDate: { lt: new Date() },
    },
  })

  if (!expiredCompany) {
    // 期限切れ企業を作成
    const user = await prisma.user.create({
      data: {
        email: 'expired-trial@test.com',
        passwordHash: '$2a$12$xyz',
        role: 'COMPANY',
        emailVerified: true,
        company: {
          create: {
            name: 'トライアル期限切れ企業',
            isTrialActive: true,
            trialStartDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40日前
            trialEndDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10日前に終了
            hasUsedTrial: true,
            subscriptionPlan: 'FREE',
          },
        },
      },
      include: { company: true },
    })
    expiredCompany = user.company!
  }

  const expiredStatus = checkTrialStatus(expiredCompany)
  const expiredMessage = getTrialMessage(expiredCompany)
  const expiredCanAccess = canAccessPaidFeatures(expiredCompany)

  console.log(`\n❌ Company: ${expiredCompany.name}`)
  console.log(`   Trial Active: ${expiredStatus.isActive}`)
  console.log(`   Has Expired: ${expiredStatus.hasExpired}`)
  console.log(`   Days Remaining: ${expiredStatus.daysRemaining}日`)
  console.log(`   Can Access Features: ${expiredCanAccess}`)
  console.log(`   Message: ${expiredMessage.message}`)
  console.log(`   Message Type: ${expiredMessage.type}`)

  // 3. 有料プラン企業のテスト
  console.log('\n\n📋 Test 3: 有料プラン企業のアクセス権限')
  console.log('='.repeat(60))

  const paidCompany = await prisma.company.findFirst({
    where: {
      subscriptionPlan: { not: 'FREE' },
      subscriptionExpiry: { gt: new Date() },
    },
  })

  if (paidCompany) {
    const paidStatus = checkTrialStatus(paidCompany)
    const paidCanAccess = canAccessPaidFeatures(paidCompany)

    console.log(`\n💰 Company: ${paidCompany.name}`)
    console.log(`   Subscription Plan: ${paidCompany.subscriptionPlan}`)
    console.log(`   Subscription Expiry: ${paidCompany.subscriptionExpiry?.toLocaleDateString('ja-JP')}`)
    console.log(`   Trial Active: ${paidStatus.isActive}`)
    console.log(`   Can Access Features: ${paidCanAccess}`)
  }

  // 4. 無料プラン企業のテスト
  console.log('\n\n📋 Test 4: 無料プラン企業のアクセス制限')
  console.log('='.repeat(60))

  const freeCompany = await prisma.company.findFirst({
    where: {
      subscriptionPlan: 'FREE',
      OR: [
        { isTrialActive: false },
        { trialEndDate: { lt: new Date() } },
        { trialEndDate: null },
      ],
    },
  })

  if (freeCompany) {
    const freeStatus = checkTrialStatus(freeCompany)
    const freeCanAccess = canAccessPaidFeatures(freeCompany)
    const freeMessage = getTrialMessage(freeCompany)

    console.log(`\n🆓 Company: ${freeCompany.name}`)
    console.log(`   Subscription Plan: ${freeCompany.subscriptionPlan}`)
    console.log(`   Trial Active: ${freeStatus.isActive}`)
    console.log(`   Can Access Features: ${freeCanAccess}`)
    console.log(`   Message: ${freeMessage.message}`)
  }

  // 5. 統計サマリー
  console.log('\n\n📊 Statistics Summary')
  console.log('='.repeat(60))

  const now = new Date()
  const [
    totalCompanies,
    activeTrials,
    expiredTrials,
    paidSubscriptions,
    canAccessCount,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({
      where: {
        isTrialActive: true,
        trialEndDate: { gt: now },
      },
    }),
    prisma.company.count({
      where: {
        hasUsedTrial: true,
        OR: [
          { isTrialActive: false },
          { trialEndDate: { lt: now } },
        ],
      },
    }),
    prisma.company.count({
      where: {
        subscriptionPlan: { not: 'FREE' },
        subscriptionExpiry: { gt: now },
      },
    }),
    prisma.company.count({
      where: {
        OR: [
          {
            subscriptionPlan: { not: 'FREE' },
            subscriptionExpiry: { gt: now },
          },
          {
            isTrialActive: true,
            trialEndDate: { gt: now },
          },
        ],
      },
    }),
  ])

  console.log(`\n  Total Companies: ${totalCompanies}`)
  console.log(`  🎉 Active Trials: ${activeTrials}`)
  console.log(`  ⏰ Expired Trials: ${expiredTrials}`)
  console.log(`  💰 Paid Subscriptions: ${paidSubscriptions}`)
  console.log(`  ✅ Can Access Paid Features: ${canAccessCount}`)
  console.log(`  ❌ Cannot Access: ${totalCompanies - canAccessCount}`)

  // 6. 警告が必要な企業（トライアル残り3日以下）
  console.log('\n\n⚠️  Companies Needing Warning (≤3 days remaining)')
  console.log('='.repeat(60))

  const companies = await prisma.company.findMany({
    where: {
      isTrialActive: true,
      trialEndDate: { gt: now },
    },
  })

  const warningCompanies = companies.filter(c => {
    const status = checkTrialStatus(c)
    return status.isActive && status.daysRemaining <= 3
  })

  console.log(`\n  Found ${warningCompanies.length} companies with ≤3 days remaining`)
  warningCompanies.forEach(c => {
    const status = checkTrialStatus(c)
    console.log(`  - ${c.name}: ${status.daysRemaining}日`)
  })

  console.log('\n✅ All tests completed!\n')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
