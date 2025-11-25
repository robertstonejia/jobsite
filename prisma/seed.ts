import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Add skills
  const skills = [
    { name: 'JavaScript', category: 'プログラミング言語' },
    { name: 'TypeScript', category: 'プログラミング言語' },
    { name: 'Python', category: 'プログラミング言語' },
    { name: 'Java', category: 'プログラミング言語' },
    { name: 'Go', category: 'プログラミング言語' },
    { name: 'PHP', category: 'プログラミング言語' },
    { name: 'Ruby', category: 'プログラミング言語' },
    { name: 'C#', category: 'プログラミング言語' },
    { name: 'React', category: 'フレームワーク' },
    { name: 'Next.js', category: 'フレームワーク' },
    { name: 'Vue.js', category: 'フレームワーク' },
    { name: 'Angular', category: 'フレームワーク' },
    { name: 'Node.js', category: 'フレームワーク' },
    { name: 'Django', category: 'フレームワーク' },
    { name: 'Flask', category: 'フレームワーク' },
    { name: 'Spring Boot', category: 'フレームワーク' },
    { name: 'Laravel', category: 'フレームワーク' },
    { name: 'Ruby on Rails', category: 'フレームワーク' },
    { name: 'PostgreSQL', category: 'データベース' },
    { name: 'MySQL', category: 'データベース' },
    { name: 'MongoDB', category: 'データベース' },
    { name: 'Redis', category: 'データベース' },
    { name: 'Docker', category: 'インフラ・DevOps' },
    { name: 'Kubernetes', category: 'インフラ・DevOps' },
    { name: 'AWS', category: 'インフラ・DevOps' },
    { name: 'GCP', category: 'インフラ・DevOps' },
    { name: 'Azure', category: 'インフラ・DevOps' },
    { name: 'Git', category: 'ツール' },
    { name: 'GitHub', category: 'ツール' },
    { name: 'GitLab', category: 'ツール' },
  ]

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    })
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
