import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('=== テストデータ作成開始 ===\n')

  // 1. テスト用応募者を作成
  console.log('1. テスト用応募者を作成中...')
  const engineerPassword = await hash('Test1234!', 12)

  const testEngineer = await prisma.user.upsert({
    where: { email: 'test-engineer@example.com' },
    update: {},
    create: {
      email: 'test-engineer@example.com',
      passwordHash: engineerPassword,
      role: 'ENGINEER',
      emailVerified: true,
      engineer: {
        create: {
          firstName: '太郎',
          lastName: 'テスト',
          birthDate: new Date('1995-05-15'),
          gender: '男性',
          nationality: '日本',
          phoneNumber: '090-1234-5678',
          address: '東京都渋谷区',
          bio: 'フルスタックエンジニアとして5年の経験があります。React、Node.js、TypeScriptが得意です。',
          yearsOfExperience: 5,
          currentPosition: 'シニアエンジニア',
          finalEducation: '大学卒',
          graduationSchool: '東京大学',
          major: '情報工学',
          graduationYear: 2018,
          isITEngineer: true,
          githubUrl: 'https://github.com/test-engineer',
        },
      },
    },
    include: {
      engineer: true,
    },
  })
  console.log(`   応募者作成完了: ${testEngineer.email}`)

  // 2. テスト用企業を作成
  console.log('\n2. テスト用企業を作成中...')
  const companyPassword = await hash('Test1234!', 12)

  const testCompany = await prisma.user.upsert({
    where: { email: 'test-company@example.com' },
    update: {},
    create: {
      email: 'test-company@example.com',
      passwordHash: companyPassword,
      role: 'COMPANY',
      emailVerified: true,
      company: {
        create: {
          name: 'テスト株式会社',
          description: '最先端のIT技術でビジネスを変革する企業です。',
          industry: 'IT・通信',
          employeeCount: 75,
          address: '東京都港区',
          website: 'https://test-company.example.com',
          subscriptionPlan: 'BASIC',
          subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
          isTrialActive: false,
          hasUsedTrial: true,
        },
      },
    },
    include: {
      company: true,
    },
  })
  console.log(`   企業作成完了: ${testCompany.email}`)

  // 3. 求人を作成
  console.log('\n3. 求人を作成中...')
  const job = await prisma.job.create({
    data: {
      companyId: testCompany.company!.id,
      title: 'フルスタックエンジニア募集',
      description: 'React、Node.js、TypeScriptを使用したWebアプリケーション開発を担当していただきます。\n\n【仕事内容】\n・新規機能の設計・開発\n・コードレビュー\n・技術的な課題解決',
      jobType: 'FULL_TIME',
      location: '東京都港区',
      salaryMin: 500,
      salaryMax: 800,
      requirements: '・Webアプリケーション開発経験3年以上\n・React、TypeScriptの実務経験\n・チーム開発経験',
      benefits: '・フレックスタイム制\n・リモートワーク可\n・書籍購入補助\n・資格取得支援',
      isActive: true,
    },
  })
  console.log(`   求人作成完了: ${job.title}`)

  // 4. 応募を作成
  console.log('\n4. 応募を作成中...')
  const application = await prisma.application.create({
    data: {
      jobId: job.id,
      engineerId: testEngineer.engineer!.id,
      status: 'PENDING',
      coverLetter: 'この度は貴社の求人に興味を持ち、応募させていただきました。\n\n私はフルスタックエンジニアとして5年の経験があり、React、Node.js、TypeScriptを用いた開発に精通しています。\n\n貴社の技術スタックと私のスキルセットが合致しており、即戦力として貢献できると考えております。',
    },
  })
  console.log(`   応募作成完了: ID ${application.id}`)

  // 5. メッセージを作成
  console.log('\n5. メッセージを作成中...')

  // 応募者からのメッセージ
  const message1 = await prisma.message.create({
    data: {
      applicationId: application.id,
      companyId: testCompany.company!.id,
      engineerId: testEngineer.engineer!.id,
      senderType: 'ENGINEER',
      content: 'はじめまして。この度はご検討いただきありがとうございます。面接の機会をいただければ幸いです。',
      isRead: false,
    },
  })
  console.log('   応募者からのメッセージ送信完了')

  // 企業からの返信
  const message2 = await prisma.message.create({
    data: {
      applicationId: application.id,
      companyId: testCompany.company!.id,
      engineerId: testEngineer.engineer!.id,
      senderType: 'COMPANY',
      content: 'ご応募ありがとうございます。書類を確認させていただきました。\n\nぜひ一度お話しさせていただきたいと思います。来週のご都合はいかがでしょうか？',
      isRead: false,
    },
  })
  console.log('   企業からのメッセージ送信完了')

  // 応募者からの返信
  const message3 = await prisma.message.create({
    data: {
      applicationId: application.id,
      companyId: testCompany.company!.id,
      engineerId: testEngineer.engineer!.id,
      senderType: 'ENGINEER',
      content: 'ご連絡ありがとうございます。\n\n来週でしたら、月曜日と水曜日の午後であれば空いております。ご検討いただけますと幸いです。',
      isRead: false,
    },
  })
  console.log('   応募者からの返信送信完了')

  // 6. 応募ステータスを更新
  console.log('\n6. 応募ステータスを更新中...')
  await prisma.application.update({
    where: { id: application.id },
    data: { status: 'INTERVIEW' },
  })
  console.log('   応募ステータスを「面接中」に更新完了')

  console.log('\n=== テストデータ作成完了 ===')
  console.log('\n【テストアカウント情報】')
  console.log('応募者:')
  console.log('  メール: test-engineer@example.com')
  console.log('  パスワード: Test1234!')
  console.log('\n企業:')
  console.log('  メール: test-company@example.com')
  console.log('  パスワード: Test1234!')
  console.log('\n本番環境でログインしてテストしてください。')
}

main()
  .catch((e) => {
    console.error('エラー:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
