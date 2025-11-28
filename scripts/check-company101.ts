import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'company101@test.com' },
    include: { company: true },
  })

  if (user?.company) {
    console.log('企業名:', user.company.name)
    console.log('IT企業:', user.company.isITCompany)
    console.log('企業ID:', user.company.id)

    const projects = await prisma.projectPost.count({
      where: { companyId: user.company.id },
    })

    console.log('作成したIT案件数:', projects)
  } else {
    console.log('企業が見つかりません')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
